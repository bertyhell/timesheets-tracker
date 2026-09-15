import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import * as ical from 'node-ical';
import { CalendarResponse } from 'node-ical';

import { CachedNetworkRequestsService } from '../database/cached-network-requests.service';
import { CustomError } from '../shared/CustomError';
import { CalendarEventDto } from './dto/calendar-event.dto';

type ICalEvent = {
  type: string;
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: Date & { dateOnly?: boolean };
  end: Date;
  datetype?: 'date' | 'date-time';
};

/**
 * How long a downloaded calendar is reused for. An ics url returns the whole calendar rather than
 * the range being asked about, so paging through days re-downloaded the same file every time — and
 * it is the one fetch on this path with no local copy to fall back on, which makes it set the wall
 * clock for the whole events request whenever the provider is slow. Short enough that an event
 * added elsewhere still appears on its own; the refresh button bypasses it entirely.
 */
const ICS_CACHE_TTL_SECONDS = 5 * 60;

/** Groups the per-url entries so a refresh can drop them together. */
const ICS_CACHE_PREFIX = 'calendar-ics-';

@Injectable()
export class CalendarsService {
  constructor(private readonly cachedNetworkRequests: CachedNetworkRequestsService) {}

  /** Drops the downloaded calendars, so a refresh in the UI re-downloads them. */
  clearIcsCache(): void {
    this.cachedNetworkRequests.deleteByPrefix(ICS_CACHE_PREFIX);
  }

  async getEvents(
    icsUrl: string | undefined | null,
    startedAt: string,
    endedAt: string
  ): Promise<CalendarEventDto[]> {
    try {
      if (!icsUrl) {
        return [];
      }
      const events = Object.values(await this.loadCalendar(icsUrl)) as ICalEvent[];

      const filteredEvents = events.filter((event) => {
        if (event.type !== 'VEVENT' || !event.start || !event.end) return false;
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return eventStart < new Date(endedAt) && eventEnd > new Date(startedAt);
      });

      return filteredEvents.map(
        (event): CalendarEventDto => ({
          id: event.uid || '',
          summary: event.summary || '',
          description: event.description || '',
          location: event.location || '',
          startedAt: event.start.toISOString(),
          endedAt: event.end.toISOString(),
          // node-ical marks date-only (all-day) events via `datetype`/`start.dateOnly`,
          // there is no `dateOnly` property on the event itself.
          allDay: event.datetype === 'date' || event.start?.dateOnly === true,
        })
      );
    } catch (err) {
      throw new CustomError('Failed to get events from ics url', err, {
        icsUrl,
        startedAt,
        endedAt,
      });
    }
  }

  private async loadCalendar(icsUrl: string): Promise<CalendarResponse> {
    const icsFile: string | undefined = process.env.CALENDAR_FALLBACK_ICS_FILE;
    if (icsFile) {
      // for local testing
      return ical.async.parseFile(icsFile);
    }

    // The ics body is cached rather than the parsed calendar: parsing produces Date objects, which
    // a JSON round-trip through the cache table would hand back as strings. Re-parsing is local
    // work, and the download is what this is here to avoid.
    const ics = await this.cachedNetworkRequests.cached(
      `${ICS_CACHE_PREFIX}${CalendarsService.fingerprint(icsUrl)}`,
      async () => {
        const response = await fetch(icsUrl);
        if (!response.ok) {
          throw new Error(`ics request failed: ${response.status} ${response.statusText}`);
        }
        return response.text();
      },
      { ttlSeconds: ICS_CACHE_TTL_SECONDS }
    );

    return ical.async.parseICS(ics);
  }

  /** An ics url can carry a secret, so it is hashed rather than stored as part of the cache key. */
  private static fingerprint(icsUrl: string): string {
    return createHash('sha256').update(icsUrl).digest('hex').slice(0, 16);
  }
}
