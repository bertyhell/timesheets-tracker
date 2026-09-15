import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { DatabaseService } from '../database/database.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { ProgramsService } from '../programs/programs.service';
import { CustomError } from '../shared/CustomError';
import { logger } from '../shared/logger';
import { JiraEventInfoDto, TimelineEventDto } from '../timelines/dto/response-timeline-events.dto';
import { resolveWebsiteEndTimes } from '../websites/helpers/resolve-website-end-times';
import { WebsitesService } from '../websites/websites.service';
import { JiraConnectionDto } from './dto/jira-connection.dto';
import { extractJiraIssueKey, isSameJiraHost } from './helpers/extract-jira-issue-key';
import { mergeJiraVisits, type JiraVisit } from './helpers/merge-jira-visits';
import {
  findJiraIssuesByKeys,
  type FindJiraIssuesByKeysResult,
} from './queries/findJiraIssuesByKeys';
import { findRecentJiraWebsites } from './queries/findRecentJiraWebsites';
import { upsertJiraIssue } from './queries/upsertJiraIssue';

export const JIRA_INTEGRATION_TYPE = 'jira';

/**
 * Visits to the same ticket less than this far apart become one block. Matches the default auto-tag
 * merge gap, so a Jira block and the auto tag it triggers do not fragment differently.
 */
const JIRA_MERGE_GAP_MINUTES = 5;

/**
 * How many issues are fetched at once. Jira has no documented per-second limit for this endpoint,
 * but a day can easily hold dozens of tickets and firing all of them at once is what rate limiting
 * exists to punish, so the fan-out is bounded.
 */
const JIRA_ISSUE_FETCH_CONCURRENCY = 8;

/** The sprint custom field id differs per Jira instance, so it is looked up once and cached. */
const SPRINT_FIELD_CACHE_KEY = 'jira-sprint-field-id';
const SPRINT_FIELD_SCHEMA = 'com.pyxis.greenhopper.jira:gh-sprint';

/**
 * Per site *and* per token, because which host answers depends on both: the same site accepts an
 * unscoped token on its own url and a scoped one only on the gateway. Keying on the site alone let
 * a host probed with an earlier token outlive it — and since the site url answers some endpoints
 * for a scoped token while 404ing on issues, that stale host failed in a way that looked like
 * missing permissions on every ticket.
 */
const CLOUD_ID_CACHE_PREFIX = 'jira-api-base-url-';

/**
 * The request used to check that credentials work, both for the settings page and for the host
 * probe below. It has to be one the integration itself makes: Jira enforces scopes per endpoint, so
 * a probe against some other endpoint could pass (or fail) on a scope set that says nothing about
 * whether the real requests will go through.
 */
const JIRA_PROBE_PATH = '/rest/api/3/field';

/**
 * How many recently visited tickets the connection test reads before it concludes anything. More
 * than one, because any single ticket can be deleted or restricted; few, because each one is a
 * request the user waits on.
 */
const JIRA_PROBE_ISSUE_COUNT = 3;

interface JiraNamed {
  name?: string;
}

interface JiraUser {
  displayName?: string;
}

interface JiraIssueResponse {
  key: string;
  fields: Record<string, unknown> & {
    summary?: string;
    labels?: string[];
    fixVersions?: JiraNamed[];
    components?: JiraNamed[];
    project?: { key?: string; name?: string };
    assignee?: JiraUser | null;
    reporter?: JiraUser | null;
    status?: JiraNamed;
    issuetype?: JiraNamed;
    priority?: JiraNamed;
    parent?: { key?: string; fields?: { summary?: string } };
  };
}

interface JiraFieldResponse {
  id: string;
  schema?: { custom?: string };
}

/** A stored issue row, minus the bookkeeping column. */
type StoredJiraIssue = Omit<FindJiraIssuesByKeysResult, 'fetchedAt'>;

/** Raised when Jira rejects the credentials themselves rather than one particular issue. */
class JiraAuthError extends Error {}

@Injectable()
export class JiraService {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly databaseService: DatabaseService,
    private readonly websitesService: WebsitesService,
    private readonly programsService: ProgramsService
  ) {}

  /**
   * Turns the browser history of a day into per-ticket blocks.
   *
   * The Jira timeline is derived from the websites the extension already reports rather than from a
   * table of its own: the extension records every url and title, so every ticket page the user
   * opened is already on record — including ones from before this integration existed, which is why
   * enabling it backfills history instead of only tracking from today onwards.
   */
  async getEventsForRange(
    startedAt: string,
    endedAt: string,
    timelineId: string,
    clearCache = false
  ): Promise<TimelineEventDto[]> {
    const { baseUrl } = this.getIntegration();

    const websites = await this.websitesService.findAll(startedAt, endedAt);
    const programs = await this.programsService.findAll(startedAt, endedAt);

    // Website events only carry a startedAt; reusing the website helper gives Jira blocks exactly
    // the same end-time semantics (and the same non-overlap guarantee) as the Websites timeline.
    const visits = resolveWebsiteEndTimes(websites, programs).reduce<JiraVisit[]>(
      (result, website) => {
        if (!website.websiteUrl || !isSameJiraHost(website.websiteUrl, baseUrl)) {
          return result;
        }
        const issueKey = extractJiraIssueKey(website.websiteUrl, website.websiteTitle);
        if (issueKey) {
          result.push({ issueKey, startedAt: website.startedAt, endedAt: website.endedAt });
        }
        return result;
      },
      []
    );

    const mergedVisits = mergeJiraVisits(visits, JIRA_MERGE_GAP_MINUTES);
    if (!mergedVisits.length) {
      return [];
    }

    const issues = await this.ensureIssues(
      [...new Set(mergedVisits.map((visit) => visit.issueKey))],
      clearCache
    );

    return mergedVisits.map((visit): TimelineEventDto => {
      const issue = issues.get(visit.issueKey);
      const info: JiraEventInfoDto = {
        jiraIssueKey: visit.issueKey,
        jiraSummary: issue?.summary || undefined,
        jiraProjectKey: issue?.projectKey || undefined,
        jiraProjectName: issue?.projectName || undefined,
        jiraLabels: issue?.labels || undefined,
        jiraFixVersions: issue?.fixVersions || undefined,
        jiraComponents: issue?.components || undefined,
        jiraSprint: issue?.sprint || undefined,
        jiraAssignee: issue?.assignee || undefined,
        jiraReporter: issue?.reporter || undefined,
        jiraStatus: issue?.status || undefined,
        jiraIssueType: issue?.issueType || undefined,
        jiraPriority: issue?.priority || undefined,
        jiraParentKey: issue?.parentKey || undefined,
        jiraParentSummary: issue?.parentSummary || undefined,
        jiraUrl: `${baseUrl}/browse/${visit.issueKey}`,
      };
      return {
        // Stable across renders of the same day, so React keys and selections survive a refetch.
        id: `jira-${visit.issueKey}-${visit.startedAt}`,
        startedAt: visit.startedAt,
        endedAt: visit.endedAt,
        info,
        timelineId,
      };
    });
  }

  /**
   * Verifies the stored credentials, so a wrong token surfaces in settings instead of as an empty
   * timeline.
   *
   * It probes the field list rather than `/rest/api/3/myself`: Jira enforces a scope set per
   * endpoint, and `myself` demands `read:group:jira` and `read:application-role:jira`, which this
   * integration never needs otherwise. Testing against it would make the user grant two scopes for
   * the sake of the test — and, worse, a passing test would say nothing about whether the requests
   * that matter are in scope. The field list is one of the two requests this integration actually
   * makes, and it needs no particular ticket to exist.
   */
  async testConnection(): Promise<JiraConnectionDto> {
    try {
      await this.request<JiraFieldResponse[]>(JIRA_PROBE_PATH);
    } catch (err) {
      return { ok: false, error: JiraService.toMessage(err) };
    }

    // Jira scopes the field list and the issue endpoint separately, so reaching the first says
    // nothing about the second — a token that cannot read a single ticket would otherwise report a
    // healthy connection and then produce an empty timeline. A ticket the user has already visited
    // is the only issue key to be had without the extra scopes a search would need.
    const issueKeys = this.findRecentlyVisitedIssueKeys(JIRA_PROBE_ISSUE_COUNT);
    if (!issueKeys.length) {
      return {
        ok: true,
        warning:
          'Ticket access could not be checked: no page on this Jira site has been visited yet. ' +
          'Open a ticket and test again.',
      };
    }

    let lastError = '';
    for (const issueKey of issueKeys) {
      try {
        await this.fetchIssue(issueKey);
        return { ok: true };
      } catch (err) {
        // Only the credentials themselves are worth failing the test over. A single ticket can be
        // unreadable for reasons that say nothing about the setup — deleted, or in a project this
        // account cannot see — so the next one is tried before giving a verdict.
        if (err instanceof JiraAuthError) {
          return {
            ok: false,
            error: `Signed in, but reading ticket ${issueKey} failed: ${JiraService.toMessage(err)}`,
          };
        }
        lastError = `${issueKey}: ${JiraService.toMessage(err)}`;
      }
    }

    return {
      ok: true,
      warning:
        `Signed in, but none of the last ${issueKeys.length} tickets visited could be read — ` +
        `they may be deleted or restricted, or the token may be missing an issue scope. ` +
        `Last attempt — ${lastError}`,
    };
  }

  /** The most recent Jira tickets in the browsing history, to test the issue endpoint against. */
  private findRecentlyVisitedIssueKeys(count: number): string[] {
    const { baseUrl } = this.getIntegration();
    const recent = findRecentJiraWebsites(this.databaseService.getDb(), {
      urlPrefix: baseUrl,
      limit: 50,
    });

    const issueKeys = new Set<string>();
    for (const { websiteUrl, websiteTitle } of recent) {
      const issueKey = websiteUrl ? extractJiraIssueKey(websiteUrl, websiteTitle ?? '') : null;
      if (issueKey) {
        issueKeys.add(issueKey);
        if (issueKeys.size === count) break;
      }
    }
    return [...issueKeys];
  }

  /**
   * Reads the given issues from the local store, fetching only the ones that are not there yet.
   *
   * A stored issue is trusted indefinitely: ticket metadata changes rarely, and re-checking it on a
   * timer meant the first load of the day paid a network round trip per ticket for something the
   * user had not asked to be updated. Refreshing is the refresh button's job — that sets
   * `forceRefresh` and re-fetches everything on the day being viewed.
   *
   * A failure to fetch one issue is swallowed: a single deleted or restricted ticket should not
   * blank out the whole day. Credential failures are not swallowed — those mean every other fetch
   * would fail too, so the first one aborts the batch.
   */
  private async ensureIssues(
    issueKeys: string[],
    forceRefresh: boolean
  ): Promise<Map<string, FindJiraIssuesByKeysResult>> {
    const db = this.databaseService.getDb();
    const stored = new Map(
      findJiraIssuesByKeys(db, { issueKeys }).map((issue) => [issue.issueKey, issue])
    );

    const keysToFetch = issueKeys.filter((issueKey) => forceRefresh || !stored.has(issueKey));
    if (!keysToFetch.length) {
      return stored;
    }

    // Resolved once up front and handed to every fetch. A site with no sprint field caches no
    // answer (see getSprintFieldId), so leaving each fetch to look it up itself would cost a field
    // list request per ticket rather than one per day.
    const sprintFieldId = await this.getSprintFieldId();

    const fetched = await this.fetchIssuesInBatches(keysToFetch, sprintFieldId);
    for (const issue of fetched) {
      const row = { ...issue, fetchedAt: new Date().toISOString() };
      upsertJiraIssue(db, row);
      stored.set(row.issueKey, row);
    }

    return stored;
  }

  /**
   * Fetches issues a slice at a time. An auth error propagates and drops the whole batch, since it
   * says the credentials are wrong rather than anything about the ticket that hit it; any other
   * error yields an empty row, so an issue that will never resolve is not re-requested on every
   * render of the day. The refresh button clears those, in case access has since been restored.
   */
  private async fetchIssuesInBatches(
    issueKeys: string[],
    sprintFieldId: string | null
  ): Promise<StoredJiraIssue[]> {
    const results: StoredJiraIssue[] = [];

    for (let index = 0; index < issueKeys.length; index += JIRA_ISSUE_FETCH_CONCURRENCY) {
      const batch = issueKeys.slice(index, index + JIRA_ISSUE_FETCH_CONCURRENCY);
      const settled = await Promise.all(
        batch.map(async (issueKey): Promise<StoredJiraIssue | JiraAuthError> => {
          try {
            return await this.fetchIssue(issueKey, sprintFieldId);
          } catch (err) {
            if (err instanceof JiraAuthError) {
              return err;
            }
            console.error(new CustomError('Failed to fetch a Jira issue', err, { issueKey }));
            return JiraService.emptyIssue(issueKey);
          }
        })
      );

      const authError = settled.find((result): result is JiraAuthError => result instanceof Error);
      if (authError) {
        throw authError;
      }
      results.push(...(settled as StoredJiraIssue[]));
    }

    return results;
  }

  /**
   * `sprintFieldId` is passed in when a batch has already resolved it, so a batch costs one field
   * list lookup instead of one per ticket. Callers fetching a single issue can leave it out.
   */
  private async fetchIssue(
    issueKey: string,
    sprintFieldId?: string | null
  ): Promise<StoredJiraIssue> {
    const resolvedSprintFieldId =
      sprintFieldId === undefined ? await this.getSprintFieldId() : sprintFieldId;
    const fields = [
      'summary',
      'labels',
      'fixVersions',
      'components',
      'project',
      'assignee',
      'reporter',
      'status',
      'issuetype',
      'priority',
      'parent',
      ...(resolvedSprintFieldId ? [resolvedSprintFieldId] : []),
    ];

    const issue = await this.request<JiraIssueResponse>(
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=${fields.join(',')}`
    );

    return {
      issueKey,
      summary: issue.fields.summary ?? '',
      projectKey: issue.fields.project?.key ?? '',
      projectName: issue.fields.project?.name ?? '',
      labels: (issue.fields.labels ?? []).join(', '),
      fixVersions: JiraService.joinNames(issue.fields.fixVersions),
      components: JiraService.joinNames(issue.fields.components),
      sprint: resolvedSprintFieldId
        ? JiraService.resolveSprintName(issue.fields[resolvedSprintFieldId])
        : '',
      assignee: issue.fields.assignee?.displayName ?? '',
      reporter: issue.fields.reporter?.displayName ?? '',
      status: issue.fields.status?.name ?? '',
      issueType: issue.fields.issuetype?.name ?? '',
      priority: issue.fields.priority?.name ?? '',
      parentKey: issue.fields.parent?.key ?? '',
      parentSummary: issue.fields.parent?.fields?.summary ?? '',
    };
  }

  /**
   * Sprint is a custom field, and its id is assigned per Jira instance, so it has to be looked up by
   * its schema type rather than hardcoded. The answer never changes for an instance, so it is
   * cached alongside the other network caches.
   */
  private async getSprintFieldId(): Promise<string | null> {
    const db = this.databaseService.getDb();
    const cached = db
      .prepare('SELECT responseJson FROM cachedNetworkRequests WHERE cacheKey = ?')
      .get(SPRINT_FIELD_CACHE_KEY) as { responseJson: string } | undefined;
    if (cached) {
      return JSON.parse(cached.responseJson) as string | null;
    }

    const allFields = await this.request<JiraFieldResponse[]>(JIRA_PROBE_PATH);
    const sprintFieldId =
      allFields.find((field) => field.schema?.custom === SPRINT_FIELD_SCHEMA)?.id ?? null;

    // A miss is not cached. Not finding the field means either that this site has no sprints or
    // that the lookup itself went wrong — and the second case used to stick, leaving every ticket
    // without a sprint until the cache was cleared by hand. Re-asking costs one request per batch
    // of issues on a site that genuinely has no sprint field.
    if (sprintFieldId) {
      db.prepare(
        'INSERT OR REPLACE INTO cachedNetworkRequests (cacheKey, responseJson) VALUES (?, ?)'
      ).run(SPRINT_FIELD_CACHE_KEY, JSON.stringify(sprintFieldId));
    }
    return sprintFieldId;
  }

  /**
   * Drops the cached sprint field id, so a refresh in the UI re-discovers it — a field can be added
   * to a site that did not have one.
   *
   * The probed api base url is deliberately kept. Which host accepts a token does not change
   * between refreshes, and re-discovering it costs a tenant_info call plus up to two probe requests
   * before the first ticket is even requested. It is already invalidated where it can actually go
   * stale: the cache key includes a fingerprint of the token, so a new token re-probes on its own.
   */
  clearFieldCache(): void {
    this.databaseService
      .getDb()
      .prepare('DELETE FROM cachedNetworkRequests WHERE cacheKey = ?')
      .run(SPRINT_FIELD_CACHE_KEY);
  }

  /**
   * Works out which host this site's token is accepted on, and remembers it.
   *
   * A scoped token is only accepted on `api.atlassian.com/ex/jira/{cloudId}` — sent straight to
   * `your-org.atlassian.net` it 401s — which is why the settings form asks for a scoped token and
   * why this lookup exists. An unscoped token is accepted on the site url, and Atlassian does not
   * document whether it is also accepted on the gateway, so rather than guess, both are tried once
   * and whichever authenticates is cached. Only a successful probe is cached: caching a failure
   * would pin the integration to a host that never works, and the answer is cached against the
   * token it was probed with, so pasting a new token re-probes instead of inheriting the old host.
   */
  private async getApiBaseUrl(
    siteUrl: string,
    token: string,
    headers: Record<string, string>
  ): Promise<string> {
    const db = this.databaseService.getDb();
    const cacheKey = `${CLOUD_ID_CACHE_PREFIX}${new URL(siteUrl).host}-${JiraService.fingerprint(token)}`;
    const cached = db
      .prepare('SELECT responseJson FROM cachedNetworkRequests WHERE cacheKey = ?')
      .get(cacheKey) as { responseJson: string } | undefined;
    if (cached) {
      return JSON.parse(cached.responseJson) as string;
    }

    const candidates: string[] = [];
    const cloudId = await this.resolveCloudId(siteUrl);
    if (cloudId) {
      candidates.push(`https://api.atlassian.com/ex/jira/${cloudId}`);
    }
    candidates.push(siteUrl);

    for (const candidate of candidates) {
      const accepted = await fetch(`${candidate}${JIRA_PROBE_PATH}`, { headers })
        .then((response) => response.ok)
        .catch(() => false);
      if (accepted) {
        logger.info(`[Jira] token accepted on ${candidate}, using it for this site`);
        db.prepare(
          'INSERT OR REPLACE INTO cachedNetworkRequests (cacheKey, responseJson) VALUES (?, ?)'
        ).run(cacheKey, JSON.stringify(candidate));
        return candidate;
      }
      logger.info(`[Jira] token not accepted on ${candidate}`);
    }

    // Nothing authenticated. Return the most likely host so the caller's own request produces the
    // real error message for the user, and leave the cache empty so the next attempt probes again.
    return candidates[0];
  }

  /** `_edge/tenant_info` is unauthenticated, so this resolves even before the token is valid. */
  private async resolveCloudId(siteUrl: string): Promise<string | null> {
    try {
      const response = await fetch(`${siteUrl}/_edge/tenant_info`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return null;
      const { cloudId } = (await response.json()) as { cloudId?: string };
      return cloudId ?? null;
    } catch (err) {
      // Self-managed sites and anything behind a proxy have no tenant_info; those take the site url.
      console.error(new CustomError('Failed to resolve the Jira cloud id', err, { siteUrl }));
      return null;
    }
  }

  /**
   * Every call this service makes is a GET, so a token scoped to the read scopes listed in the
   * settings form is all this integration ever needs.
   */
  private async request<T>(path: string): Promise<T> {
    const { baseUrl, userId, token } = this.getIntegration();
    if (!userId) {
      throw new Error(
        'Jira email is not configured — fill in the Email field in Settings → Integrations → Jira'
      );
    }

    const headers = {
      Authorization: `Basic ${Buffer.from(`${userId}:${token}`).toString('base64')}`,
      Accept: 'application/json',
    };

    const url = `${await this.getApiBaseUrl(baseUrl, token, headers)}${path}`;
    logger.info('[Jira] fetching: ' + url);
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const message = `Jira request failed: ${response.status} — ${body}`;
      // 401 means the credentials are wrong, so retrying the remaining issues is pointless. A 403 or
      // 404 is about this one issue (restricted or deleted) and is handled per issue by the caller.
      throw response.status === 401 ? new JiraAuthError(message) : new Error(message);
    }

    return (await response.json()) as T;
  }

  /**
   * A Jira timeline can exist without the integration being set up (yet). Callers use this to skip
   * fetching instead of hitting a "not configured" error on every events request.
   */
  isConfigured(): boolean {
    return !!this.integrationsService.findOne(JIRA_INTEGRATION_TYPE);
  }

  private getIntegration() {
    const integration = this.integrationsService.findOne(JIRA_INTEGRATION_TYPE);
    if (!integration) {
      throw new NotFoundException('Jira integration not configured');
    }
    return { ...integration, baseUrl: JiraService.resolveBaseUrl(integration.baseUrl) };
  }

  /**
   * Reduces whatever the user pasted to the instance origin. Copying the url straight out of the
   * browser while looking at a ticket is the obvious thing to do, so
   * `https://org.atlassian.net/browse/ABC-1` has to work as well as a bare host.
   */
  private static resolveBaseUrl(baseUrl: string): string {
    const trimmed = (baseUrl ?? '').replace(/\/+$/, '');
    if (!trimmed) return '';
    try {
      return new URL(trimmed).origin;
    } catch {
      return trimmed;
    }
  }

  /** Identifies a token in a cache key without storing the token itself. */
  private static fingerprint(token: string): string {
    return createHash('sha256').update(token).digest('hex').slice(0, 12);
  }

  private static toMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }

  private static joinNames(values: JiraNamed[] | undefined): string {
    return (values ?? [])
      .map((value) => value.name)
      .filter(Boolean)
      .join(', ');
  }

  /**
   * The sprint field holds every sprint the issue has been in, oldest first. The last entry is the
   * one the issue is in now, which is the one worth tagging time against.
   */
  private static resolveSprintName(value: unknown): string {
    if (!Array.isArray(value)) {
      return '';
    }
    const names = value
      .map((sprint) => (sprint as JiraNamed | null)?.name)
      .filter((name): name is string => !!name);
    return names.at(-1) ?? '';
  }

  private static emptyIssue(issueKey: string): StoredJiraIssue {
    return {
      issueKey,
      summary: '',
      projectKey: '',
      projectName: '',
      labels: '',
      fixVersions: '',
      components: '',
      sprint: '',
      assignee: '',
      reporter: '',
      status: '',
      issueType: '',
      priority: '',
      parentKey: '',
      parentSummary: '',
    };
  }
}
