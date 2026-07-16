import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { DatabaseService } from '../database/database.service';
import { TimelineEventDto } from '../timelines/dto/response-timeline-events.dto';

interface ProductiveServiceRecord {
  id: string;
  attributes: {
    name: string;
    custom_fields: Record<string, unknown> | null;
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
