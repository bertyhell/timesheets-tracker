import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { DatabaseService } from '../database/database.service';
import { TimelineEventDto } from '../timelines/dto/response-timeline-events.dto';
import { ProductiveCompanyDto } from './dto/company.dto';
import { ProductiveDealDto } from './dto/deal.dto';
import { ProductiveServiceDto } from './dto/service.dto';
import { SyncTimeEntryDto } from './dto/sync-time-entries.dto';
import {
  ProductiveServiceTreeNodeDto,
  ProductiveServiceTreeNodeKind,
} from './dto/service-tree.dto';

/** Carries Productive's error text through to the HTTP response. */
class BadGatewayLikeError extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_GATEWAY);
  }
}

/** Minimal JSON:API shapes, enough to walk `data` + `included` sideloads. */
interface JsonApiRelationship {
  data?: { id: string; type: string } | null;
}

interface JsonApiResource {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
  relationships?: Record<string, JsonApiRelationship>;
}

/**
 * Intermediate tree node: `node` is the DTO under construction, `children`
 * keeps insertion order per level while services are folded in. `position` is
 * carried on the node during building and stripped before it is returned.
 */
interface TreeBucket {
  node: ProductiveServiceTreeNodeDto & { position?: number };
  children: Map<string, TreeBucket>;
}

interface ProductiveServiceRecord {
  id: string;
  attributes: {
    name: string;
    custom_fields: Record<string, unknown> | null;
  };
}

interface ProductiveCompanyRecord {
  id: string;
  attributes: {
    name: string;
  };
}

interface ProductiveDealRecord {
  id: string;
  attributes: {
    name: string;
  };
}

interface ProductiveBooking {
  id: string;
  attributes: {
    hours: number | null;
    percentage: number | null;
    total_time: number | null;
    note: string | null;
  };
  relationships: {
    service?: {
      data?: { id: string } | null;
    };
  };
}

@Injectable()
export class ProductiveService {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getEventsForDay(date: string, timelineId: string, clearCache = false): Promise<TimelineEventDto[]> {
    const db = this.databaseService.getDb();
    const cacheKey = date; // yyyy-MM-dd

    if (!clearCache) {
      const cached = db.prepare(
        'SELECT responseJson FROM cachedNetworkRequests WHERE cacheKey = ?'
      ).get(cacheKey) as { responseJson: string } | undefined;

      if (cached) {
        const bookingsJson = JSON.parse(cached.responseJson) as Record<string, unknown>;
        const bookings: ProductiveBooking[] = (bookingsJson.data as ProductiveBooking[]) ?? [];
        const included: ProductiveServiceRecord[] = (bookingsJson.included as ProductiveServiceRecord[]) ?? [];
        const serviceMap = new Map<string, ProductiveServiceRecord>(included.map(s => [s.id, s]));
        return this.mapBookingsToEvents(bookings, serviceMap, date, timelineId);
      }
    }

    const { baseUrl, organisationId, token, userId } = this.getIntegration();

    if (!userId) {
      throw new Error('Productive user ID is not configured — fill in the User ID field in Settings → Integrations → Productive');
    }

    const headers = {
      'X-Auth-Token': token,
      'X-Organization-Id': organisationId,
      'Content-Type': 'application/vnd.api+json',
    };

    const query = [
      `filter[person_id][eq]=${encodeURIComponent(userId)}`,
      `filter[started_on][lt_eq]=${encodeURIComponent(date)}`,
      `filter[ended_on][gt_eq]=${encodeURIComponent(date)}`,
      'include=service',
    ].join('&');
    const bookingsUrl = `${baseUrl}/bookings?${query}`;

    console.log('[Productive] fetching:', bookingsUrl);
    const bookingsRes = await fetch(bookingsUrl, { headers });
    if (!bookingsRes.ok) {
      const body = await bookingsRes.text().catch(() => '');
      throw new Error(`Productive bookings request failed: ${bookingsRes.status} — ${body}`);
    }

    const bookingsJson = await bookingsRes.json() as Record<string, unknown>;

    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    if (date < todayKey) {
      db.prepare(
        'INSERT OR REPLACE INTO cachedNetworkRequests (cacheKey, responseJson) VALUES (?, ?)'
      ).run(cacheKey, JSON.stringify(bookingsJson));
    }

    const bookings: ProductiveBooking[] = (bookingsJson.data as ProductiveBooking[]) ?? [];
    const included: ProductiveServiceRecord[] = (bookingsJson.included as ProductiveServiceRecord[]) ?? [];

    const serviceMap = new Map<string, ProductiveServiceRecord>(included.map(s => [s.id, s]));

    return this.mapBookingsToEvents(bookings, serviceMap, date, timelineId);
  }

  private getIntegration() {
    const integration = this.integrationsService.findOne('productive');
    if (!integration) {
      throw new NotFoundException('Productive integration not configured');
    }
    return { ...integration, baseUrl: ProductiveService.resolveBaseUrl(integration.baseUrl) };
  }

  /**
   * The settings field is commonly filled in as just `https://api.productive.io`
   * (that is also the form's default), which is the host and not the API root.
   * Append the version prefix when no path was given so every call below lands
   * on a real route instead of a 404 "Route Not Found".
   */
  private static resolveBaseUrl(baseUrl: string): string {
    const trimmed = (baseUrl ?? '').replace(/\/+$/, '');
    if (!trimmed) return 'https://api.productive.io/api/v2';
    try {
      const { pathname } = new URL(trimmed);
      return pathname === '' || pathname === '/' ? `${trimmed}/api/v2` : trimmed;
    } catch {
      return trimmed;
    }
  }

  private buildHeaders(organisationId: string, token: string) {
    return {
      'X-Auth-Token': token,
      'X-Organization-Id': organisationId,
      'Content-Type': 'application/vnd.api+json',
    };
  }

  /**
   * Fetch every page of a Productive list endpoint, following JSON:API
   * pagination until no further pages are reported.
   */
  private async fetchAllPages<T>(resource: string, filters: string[] = []): Promise<T[]> {
    const { baseUrl, organisationId, token } = this.getIntegration();
    const headers = this.buildHeaders(organisationId, token);

    const records: T[] = [];

    let pageNumber = 1;
    for (;;) {
      const query = [...filters, 'page[size]=200', `page[number]=${pageNumber}`].join('&');
      const url = `${baseUrl}/${resource}?${query}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Productive ${resource} request failed: ${res.status} — ${body}`);
      }

      const json = (await res.json()) as Record<string, unknown>;
      const data = (json.data as T[]) ?? [];
      records.push(...data);

      const meta = json.meta as { total_pages?: number } | undefined;
      const totalPages = meta?.total_pages;
      if (data.length === 0 || !totalPages || pageNumber >= totalPages) {
        break;
      }
      pageNumber += 1;
    }

    return records;
  }

  // Prefix for the company/deal/service list caches so they can be cleared as a
  // group on a frontend refresh (see clearListCache).
  private static readonly LIST_CACHE_PREFIX = 'productive-';

  private readListCache<T>(cacheKey: string): T | null {
    const db = this.databaseService.getDb();
    const row = db
      .prepare('SELECT responseJson FROM cachedNetworkRequests WHERE cacheKey = ?')
      .get(cacheKey) as { responseJson: string } | undefined;
    return row ? (JSON.parse(row.responseJson) as T) : null;
  }

  private writeListCache(cacheKey: string, value: unknown): void {
    const db = this.databaseService.getDb();
    db.prepare(
      'INSERT OR REPLACE INTO cachedNetworkRequests (cacheKey, responseJson) VALUES (?, ?)'
    ).run(cacheKey, JSON.stringify(value));
  }

  /** Clear the cached company/deal/service lists (invoked on a frontend refresh). */
  clearListCache(): void {
    const db = this.databaseService.getDb();
    db.prepare('DELETE FROM cachedNetworkRequests WHERE cacheKey LIKE ?').run(
      `${ProductiveService.LIST_CACHE_PREFIX}%`
    );
  }

  async getCompanies(): Promise<ProductiveCompanyDto[]> {
    const cacheKey = `${ProductiveService.LIST_CACHE_PREFIX}companies`;
    const cached = this.readListCache<ProductiveCompanyDto[]>(cacheKey);
    if (cached) return cached;

    const records = await this.fetchAllPages<ProductiveCompanyRecord>('companies');
    const result = records.map((record) => ({
      companyId: record.id,
      companyName: record.attributes.name,
    }));
    this.writeListCache(cacheKey, result);
    return result;
  }

  async getDealsByCompany(companyId: string): Promise<ProductiveDealDto[]> {
    const cacheKey = `${ProductiveService.LIST_CACHE_PREFIX}deals-${companyId}`;
    const cached = this.readListCache<ProductiveDealDto[]>(cacheKey);
    if (cached) return cached;

    const records = await this.fetchAllPages<ProductiveDealRecord>('deals', [
      `filter[company_id][eq]=${encodeURIComponent(companyId)}`,
    ]);
    const result = records.map((record) => ({
      dealId: record.id,
      dealName: record.attributes.name,
    }));
    this.writeListCache(cacheKey, result);
    return result;
  }

  async getServicesByDeal(dealId: string, date: string): Promise<ProductiveServiceDto[]> {
    const cacheKey = `${ProductiveService.LIST_CACHE_PREFIX}services-${dealId}-${date}`;
    const cached = this.readListCache<ProductiveServiceDto[]>(cacheKey);
    if (cached) return cached;

    const { userId } = this.getIntegration();
    const filters = [`filter[deal_id][eq]=${encodeURIComponent(dealId)}`];
    // Only surface services the current person can book time on that day.
    if (date) filters.push(`filter[bookable_date]=${encodeURIComponent(date)}`);
    if (userId) filters.push(`filter[person_id]=${encodeURIComponent(userId)}`);

    const records = await this.fetchAllPages<ProductiveServiceRecord>('services', filters);
    const result = records.map((record) => ({
      serviceId: record.id,
      serviceName: record.attributes.name,
    }));
    this.writeListCache(cacheKey, result);
    return result;
  }

  async createTimeEntries(date: string, entries: SyncTimeEntryDto[]): Promise<{ created: number }> {
    if (entries.length === 0) {
      return { created: 0 };
    }

    const { baseUrl, organisationId, token, userId } = this.getIntegration();
    if (!userId) {
      throw new Error(
        'Productive user ID is not configured — fill in the User ID field in Settings → Integrations → Productive'
      );
    }

    const headers = this.buildHeaders(organisationId, token);
    const url = `${baseUrl}/time_entries`;

    // One standard JSON:API create per entry (`data` is a single resource
    // object). A day only has a handful of entries, well under the
    // 100-requests-per-10-seconds rate limit.
    let created = 0;
    for (const entry of entries) {
      const attributes: Record<string, unknown> = { date, time: entry.minutes };
      if (entry.note) attributes.note = entry.note;

      const body = {
        data: {
          type: 'time_entries',
          attributes,
          relationships: {
            person: { data: { type: 'people', id: userId } },
            service: { data: { type: 'services', id: entry.serviceId } },
          },
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(
          `Productive time entry request failed (${created}/${entries.length} created): ${res.status} — ${errorBody}`
        );
      }

      created += 1;
    }

    return { created };

    // // Temporary: the real POST above is commented out for debugging. Remove this
    // console.log('sending items to time_entries', JSON.stringify(body, null, 2));
    // // once the fetch is re-enabled so the real created count is returned.
    // return { created: entries.length };
  }

  private mapBookingsToEvents(
    bookings: ProductiveBooking[],
    serviceMap: Map<string, ProductiveServiceRecord>,
    date: string,
    timelineId: string
  ): TimelineEventDto[] {
    let cursorMinutes = 9 * 60;

    return bookings
      .map((booking): TimelineEventDto | null => {
        const hours = this.resolveHours(booking);
        if (!hours || hours <= 0) return null;

        const label = booking.attributes.note?.trim() || 'Unnamed booking';
        const startMinutes = cursorMinutes;
        cursorMinutes += hours * 60;

        const serviceId = booking.relationships?.service?.data?.id;
        const service = serviceId ? serviceMap.get(serviceId) : undefined;
        const serviceName = service?.attributes.name;
        const serviceProject = service?.attributes.custom_fields
          ? (Object.values(service.attributes.custom_fields)[0] as string | undefined)
          : undefined;

        return {
          id: `productive-${booking.id}`,
          startedAt: this.minutesToIso(date, startMinutes),
          endedAt: this.minutesToIso(date, cursorMinutes),
          info: { tagNameName: label, serviceName, serviceProject },
          timelineId,
        };
      })
      .filter((e): e is TimelineEventDto => e !== null);
  }

  private resolveHours(booking: ProductiveBooking): number {
    const { hours, percentage, total_time } = booking.attributes;
    if (percentage != null) return (percentage / 100) * 8;
    if (hours != null) return hours;
    if (total_time != null) return total_time / 60;
    return 0;
  }

  private minutesToIso(date: string, totalMinutes: number): string {
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(Math.floor(totalMinutes / 60), Math.round(totalMinutes % 60), 0, 0);
    return d.toISOString();
  }

  // ---------------------------------------------------------------------------
  // Service tree (single-call, 5-level company → project → budget → section →
  // service picker used by the "Sync to output" dropdown).
  // ---------------------------------------------------------------------------

  /**
   * Fetch the bookable services in one call and fold them into the nested tree
   * the picker renders. `query` is passed straight to Productive as
   * `filter[query]` (server-side search); results are only cached when there is
   * no query, since a search is cheap to repeat and quickly goes stale.
   */
  async getServiceTree(date: string, query = ''): Promise<ProductiveServiceTreeNodeDto[]> {
    const trimmedQuery = query.trim();
    const cacheKey = `${ProductiveService.LIST_CACHE_PREFIX}service-tree-${date}`;

    if (!trimmedQuery) {
      const cached = this.readListCache<ProductiveServiceTreeNodeDto[]>(cacheKey);
      if (cached) return cached;
    }

    const payload = await this.fetchServices(date, trimmedQuery);
    const tree = this.buildServiceTree(payload);

    if (!trimmedQuery) this.writeListCache(cacheKey, tree);
    return tree;
  }

  /**
   * The full filter/sort/include set below is what Productive's own web app
   * sends. Not all of those keys are in the public reference, so a rejected
   * request is retried with only the documented filters and sorted client-side
   * afterwards (see buildServiceTree).
   */
  private async fetchServices(
    date: string,
    query: string
  ): Promise<{ data: JsonApiResource[]; included: JsonApiResource[] }> {
    const { userId } = this.getIntegration();

    const include = 'deal.company,deal.project.company,section.deal';
    const fields = [
      'fields[services]=id,name,position,worked_time,budgeted_time,section,deal,time_tracking_enabled',
      'fields[deals]=id,name,budget,project,company',
      'fields[sections]=id,name,position,deal',
      'fields[projects]=id,name,company',
      'fields[companies]=id,name,avatar_url',
    ];

    const common = [...fields, `include=${encodeURIComponent(include)}`];
    if (date) common.push(`filter[bookable_date]=${encodeURIComponent(date)}`);
    if (userId) common.push(`filter[person_id]=${encodeURIComponent(userId)}`);
    if (query) common.push(`filter[query]=${encodeURIComponent(query)}`);

    const preferred = [
      ...common,
      'filter[budgets_and_deals]=true',
      'filter[time_tracking_enabled]=true',
      `sort=${encodeURIComponent('company,project_name,budget,section_position,position')}`,
    ];
    const fallback = [...common, 'filter[time_tracking_enabled]=true'];

    try {
      return await this.fetchAllServicePages(preferred);
    } catch (preferredError) {
      console.warn(
        '[Productive] service tree request rejected, retrying with documented filters only:',
        preferredError instanceof Error ? preferredError.message : preferredError
      );
      try {
        return await this.fetchAllServicePages(fallback);
      } catch (fallbackError) {
        // Surface Productive's own message instead of a bare 500 so the picker
        // can show why it failed.
        throw new BadGatewayLikeError(
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        );
      }
    }
  }

  private async fetchAllServicePages(
    params: string[]
  ): Promise<{ data: JsonApiResource[]; included: JsonApiResource[] }> {
    const { baseUrl, organisationId, token } = this.getIntegration();
    const headers = this.buildHeaders(organisationId, token);

    const data: JsonApiResource[] = [];
    const included: JsonApiResource[] = [];

    let pageNumber = 1;
    for (;;) {
      const url = `${baseUrl}/services?${[...params, 'page[size]=200', `page[number]=${pageNumber}`].join('&')}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Productive services request failed: ${res.status} — ${body}`);
      }

      const json = (await res.json()) as Record<string, unknown>;
      const pageData = (json.data as JsonApiResource[]) ?? [];
      data.push(...pageData);
      included.push(...((json.included as JsonApiResource[]) ?? []));

      const totalPages = (json.meta as { total_pages?: number } | undefined)?.total_pages;
      if (pageData.length === 0 || !totalPages || pageNumber >= totalPages) break;
      pageNumber += 1;
    }

    return { data, included };
  }

  /**
   * Fold the flat JSON:API service list into company → project → budget →
   * (section) → service. The section level is optional (services can hang
   * directly off a budget) and so is the project level (internal budgets have
   * no project), so both fall back to a synthetic bucket.
   */
  private buildServiceTree(payload: {
    data: JsonApiResource[];
    included: JsonApiResource[];
  }): ProductiveServiceTreeNodeDto[] {
    const lookup = new Map<string, JsonApiResource>();
    for (const resource of payload.included) {
      lookup.set(`${resource.type}:${resource.id}`, resource);
    }
    const resolve = (ref?: JsonApiRelationship): JsonApiResource | undefined => {
      const identifier = ref?.data;
      return identifier ? lookup.get(`${identifier.type}:${identifier.id}`) : undefined;
    };

    // Nested insertion-ordered maps: company → project → budget → section.
    const companies = new Map<string, TreeBucket>();

    const bucket = (
      parent: Map<string, TreeBucket>,
      id: string,
      kind: ProductiveServiceTreeNodeKind,
      label: string,
      extra: Partial<TreeBucket['node']> = {}
    ): TreeBucket => {
      let existing = parent.get(id);
      if (!existing) {
        existing = { node: { id, kind, label, selectable: false, children: [], ...extra }, children: new Map() };
        parent.set(id, existing);
      }
      return existing;
    };

    for (const service of payload.data) {
      const section = resolve(service.relationships?.section);
      const deal = resolve(service.relationships?.deal) ?? resolve(section?.relationships?.deal);
      const project = resolve(deal?.relationships?.project);
      const company =
        resolve(project?.relationships?.company) ?? resolve(deal?.relationships?.company);

      const companyBucket = bucket(
        companies,
        company?.id ?? 'no-company',
        'company',
        (company?.attributes?.name as string) ?? 'No company',
        { avatarUrl: (company?.attributes?.avatar_url as string | undefined) ?? undefined }
      );
      const projectBucket = bucket(
        companyBucket.children,
        project?.id ?? `${companyBucket.node.id}:no-project`,
        'project',
        (project?.attributes?.name as string) ?? 'No project'
      );
      const budgetBucket = bucket(
        projectBucket.children,
        deal?.id ?? `${projectBucket.node.id}:no-budget`,
        'budget',
        (deal?.attributes?.name as string) ?? 'No budget'
      );

      // No section, or an unnamed default one → hang the service straight off
      // the budget, the way Productive's own picker renders it.
      const sectionName = ((section?.attributes?.name as string) ?? '').trim();
      const parentChildren = sectionName
        ? bucket(budgetBucket.children, section!.id, 'section', sectionName, {
            position: section!.attributes?.position as number | undefined,
          }).children
        : budgetBucket.children;

      parentChildren.set(service.id, {
        node: {
          id: service.id,
          kind: 'service',
          label: (service.attributes?.name as string) ?? 'Unnamed service',
          selectable: true,
          workedMinutes: (service.attributes?.worked_time as number | undefined) ?? 0,
          budgetedMinutes: (service.attributes?.budgeted_time as number | undefined) ?? undefined,
          children: [],
          position: service.attributes?.position as number | undefined,
        },
        children: new Map(),
      });
    }

    return this.flattenBuckets(companies);
  }

  /** Depth-first: buckets → DTO nodes, sorted the way the picker renders them. */
  private flattenBuckets(buckets: Map<string, TreeBucket>): ProductiveServiceTreeNodeDto[] {
    return Array.from(buckets.values())
      .map((entry) => ({
        ...entry.node,
        children: this.flattenBuckets(entry.children),
      }))
      .sort((a, b) => {
        // Sections and services carry an explicit position from Productive;
        // everything else is alphabetical.
        const aPos = (a as { position?: number }).position;
        const bPos = (b as { position?: number }).position;
        if (aPos != null && bPos != null && aPos !== bPos) return aPos - bPos;
        return a.label.localeCompare(b.label);
      })
      .map(({ ...node }) => {
        delete (node as { position?: number }).position;
        return node;
      });
  }
}
