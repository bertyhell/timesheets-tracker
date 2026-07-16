import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { DatabaseService } from '../database/database.service';
import { TimelineEventDto } from '../timelines/dto/response-timeline-events.dto';
import { ProductiveCompanyDto } from './dto/company.dto';
import { ProductiveDealDto } from './dto/deal.dto';
import { ProductiveServiceDto } from './dto/service.dto';
import { SyncTimeEntryDto } from './dto/sync-time-entries.dto';

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

    const integration = this.integrationsService.findOne('productive');
    if (!integration) {
      throw new NotFoundException('Productive integration not configured');
    }

    const { baseUrl, organisationId, token, userId } = integration;

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
    return integration;
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
}
