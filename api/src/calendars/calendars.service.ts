import { Injectable } from '@nestjs/common';
import * as ical from 'node-ical';
import { CalendarResponse } from 'node-ical';

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
const ICS_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class CalendarsService {
  /**
   * Kept in memory rather than in `cachedNetworkRequests`: a parsed calendar is large, it is only
   * worth holding for minutes, and losing it on restart costs one download.
   */
  private readonly icsCache = new Map<string, { fetchedAt: number; events: CalendarResponse }>();

  /** Drops the downloaded calendars, so a refresh in the UI re-downloads them. */
  clearIcsCache(): void {
    this.icsCache.clear();
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

    const cached = this.icsCache.get(icsUrl);
    if (cached && Date.now() - cached.fetchedAt < ICS_CACHE_TTL_MS) {
      return cached.events;
    }

    // parse the real url
    const events = await ical.async.fromURL(icsUrl);
    this.icsCache.set(icsUrl, { fetchedAt: Date.now(), events });
    return events;
  }
}
