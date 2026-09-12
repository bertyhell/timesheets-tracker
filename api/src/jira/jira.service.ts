import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { DatabaseService } from '../database/database.service';
import { WebsitesService } from '../websites/websites.service';
import { ProgramsService } from '../programs/programs.service';
import { resolveWebsiteEndTimes } from '../websites/helpers/resolve-website-end-times';
import {
  JiraEventInfoDto,
  TimelineEventDto,
} from '../timelines/dto/response-timeline-events.dto';
import { JiraConnectionDto } from './dto/jira-connection.dto';
import { extractJiraIssueKey, isSameJiraHost } from './helpers/extract-jira-issue-key';
import { mergeJiraVisits, type JiraVisit } from './helpers/merge-jira-visits';
import {
  findJiraIssuesByKeys,
  type FindJiraIssuesByKeysResult,
} from './queries/findJiraIssuesByKeys';
import { upsertJiraIssue } from './queries/upsertJiraIssue';
import { CustomError } from '../shared/CustomError';
import { logger } from '../shared/logger';

export const JIRA_INTEGRATION_TYPE = 'jira';

/**
 * Visits to the same ticket less than this far apart become one block. Matches the default auto-tag
 * merge gap, so a Jira block and the auto tag it triggers do not fragment differently.
 */
const JIRA_MERGE_GAP_MINUTES = 5;

/** How long a stored issue is trusted before it is re-fetched. */
const JIRA_ISSUE_TTL_HOURS = 12;

/** The sprint custom field id differs per Jira instance, so it is looked up once and cached. */
const SPRINT_FIELD_CACHE_KEY = 'jira-sprint-field-id';
const SPRINT_FIELD_SCHEMA = 'com.pyxis.greenhopper.jira:gh-sprint';

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

  /** Verifies the stored credentials, so a wrong token surfaces in settings instead of as an empty timeline. */
  async testConnection(): Promise<JiraConnectionDto> {
    try {
      const user = await this.request<JiraUser>('/rest/api/3/myself');
      return { ok: true, displayName: user.displayName };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /**
   * Reads the given issues from the local store, fetching the ones that are missing or stale.
   *
   * A failure to fetch one issue is swallowed: a single deleted or restricted ticket should not
   * blank out the whole day. Credential failures are not swallowed — those mean every subsequent
   * fetch would fail too, so it stops after the first one.
   */
  private async ensureIssues(
    issueKeys: string[],
    forceRefresh: boolean
  ): Promise<Map<string, FindJiraIssuesByKeysResult>> {
    const db = this.databaseService.getDb();
    const stored = new Map(
      findJiraIssuesByKeys(db, { issueKeys }).map((issue) => [issue.issueKey, issue])
    );

    const staleBefore = new Date(Date.now() - JIRA_ISSUE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const keysToFetch = issueKeys.filter((issueKey) => {
      const issue = stored.get(issueKey);
      return !issue || forceRefresh || issue.fetchedAt < staleBefore;
    });

    for (const issueKey of keysToFetch) {
      let issue: StoredJiraIssue;
      try {
        issue = await this.fetchIssue(issueKey);
      } catch (err) {
        if (err instanceof JiraAuthError) {
          throw err;
        }
        // Store an empty row so an issue that will never resolve is not re-requested on every
        // render of this day; it still refreshes once the TTL lapses, in case access is restored.
        issue = JiraService.emptyIssue(issueKey);
        console.error(new CustomError('Failed to fetch a Jira issue', err, { issueKey }));
      }

      const row = { ...issue, fetchedAt: new Date().toISOString() };
      upsertJiraIssue(db, row);
      stored.set(issueKey, row);
    }

    return stored;
  }

  private async fetchIssue(issueKey: string): Promise<StoredJiraIssue> {
    const sprintFieldId = await this.getSprintFieldId();
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
      ...(sprintFieldId ? [sprintFieldId] : []),
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
      sprint: sprintFieldId ? JiraService.resolveSprintName(issue.fields[sprintFieldId]) : '',
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

    const allFields = await this.request<JiraFieldResponse[]>('/rest/api/3/field');
    const sprintFieldId =
      allFields.find((field) => field.schema?.custom === SPRINT_FIELD_SCHEMA)?.id ?? null;

    db.prepare(
      'INSERT OR REPLACE INTO cachedNetworkRequests (cacheKey, responseJson) VALUES (?, ?)'
    ).run(SPRINT_FIELD_CACHE_KEY, JSON.stringify(sprintFieldId));
    return sprintFieldId;
  }

  /** Drops the cached sprint field id, so a refresh in the UI re-discovers it. */
  clearFieldCache(): void {
    this.databaseService
      .getDb()
      .prepare('DELETE FROM cachedNetworkRequests WHERE cacheKey = ?')
      .run(SPRINT_FIELD_CACHE_KEY);
  }

  /**
   * Every call this service makes is a GET. An Atlassian API token carries the full permissions of
   * the account it belongs to — there is no read-only variant — so keeping the verb set to GET is
   * what makes the integration read-only in practice.
   */
  private async request<T>(path: string): Promise<T> {
    const { baseUrl, userId, token } = this.getIntegration();
    if (!userId) {
      throw new Error(
        'Jira email is not configured — fill in the Email field in Settings → Integrations → Jira'
      );
    }

    const url = `${baseUrl}${path}`;
    logger.info('[Jira] fetching: ' + url);
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${userId}:${token}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const message = `Jira request failed: ${response.status} — ${body}`;
      // 401 means the credentials are wrong, so retrying the remaining issues is pointless. A 403 or
      // 404 is about this one issue (restricted or deleted) and is handled per issue by the caller.
      throw response.status === 401 ? new JiraAuthError(message) : new Error(message);
    }

    return (await response.json()) as T;
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
