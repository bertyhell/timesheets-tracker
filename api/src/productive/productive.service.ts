import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { TimelineEventDto } from '../timelines/dto/response-timeline-events.dto';

interface ProductiveBooking {
  id: string;
  attributes: {
    hours: number | null;
    percentage: number | null;
    total_time: number | null;
  };
  relationships: {
    service?: { data: { id: string; type: string } | null };
  };
}

interface ProductiveIncluded {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data: { id: string; type: string } | null }>;
}

@Injectable()
export class ProductiveService {
  constructor(private readonly integrationsService: IntegrationsService) {}

  async getEventsForDay(date: string, timelineId: string): Promise<TimelineEventDto[]> {
    const integration = this.integrationsService.findOne('productive');
    if (!integration) {
      throw new NotFoundException('Productive integration not configured');
    }

    const { baseUrl, organisationId, token, userId } = integration;
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Organization-Id': organisationId,
      'Content-Type': 'application/vnd.api+json',
    };

    const bookingsUrl = new URL(`${baseUrl}/api/v2/bookings`);
    bookingsUrl.searchParams.set('filter[person_id][eq]', userId);
    bookingsUrl.searchParams.set('filter[started_on][lt_eq]', date);
    bookingsUrl.searchParams.set('filter[ended_on][gt_eq]', date);
    bookingsUrl.searchParams.set('include', 'service.deal');

    const bookingsRes = await fetch(bookingsUrl.toString(), { headers });
    if (!bookingsRes.ok) {
      throw new Error(`Productive bookings request failed: ${bookingsRes.status}`);
    }

    const bookingsJson = await bookingsRes.json() as Record<string, unknown>;
    const bookings: ProductiveBooking[] = (bookingsJson.data as ProductiveBooking[]) ?? [];
    const included: ProductiveIncluded[] = (bookingsJson.included as ProductiveIncluded[]) ?? [];

    return this.mapBookingsToEvents(bookings, included, date, timelineId);
  }

  private mapBookingsToEvents(
    bookings: ProductiveBooking[],
    included: ProductiveIncluded[],
    date: string,
    timelineId: string
  ): TimelineEventDto[] {
    const workdayStartHour = 9;
    let cursorMinutes = workdayStartHour * 60;

    return bookings
      .map((booking): TimelineEventDto | null => {
        const hours = this.resolveHours(booking);
        if (!hours || hours <= 0) return null;

        const projectName = this.resolveProjectName(booking, included);
        const startMinutes = cursorMinutes;
        cursorMinutes += hours * 60;

        const startedAt = this.minutesToIso(date, startMinutes);
        const endedAt = this.minutesToIso(date, cursorMinutes);

        return {
          id: `productive-${booking.id}`,
          startedAt,
          endedAt,
          info: {
            tagNameName: projectName,
          },
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

  private resolveProjectName(booking: ProductiveBooking, included: ProductiveIncluded[]): string {
    const serviceId = booking.relationships?.service?.data?.id;
    if (!serviceId) return 'Unknown project';

    const service = included.find((i) => i.type === 'services' && i.id === serviceId);
    if (!service) return 'Unknown project';

    const dealId = (service.relationships?.deal?.data as { id?: string } | null)?.id;
    if (dealId) {
      const deal = included.find((i) => i.type === 'deals' && i.id === dealId);
      if (deal?.attributes?.name) return String(deal.attributes.name);
    }

    return String(service.attributes?.name ?? 'Unknown project');
  }

  private minutesToIso(date: string, totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date}T${pad(hours)}:${pad(mins)}:00.000Z`;
  }
}
