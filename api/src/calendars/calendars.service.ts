import { Injectable } from '@nestjs/common';
import * as ical from 'node-ical';
import { CalendarEventDto } from './dto/calendar-event.dto';
import { CustomError } from '../shared/CustomError';
import { CalendarResponse } from 'node-ical';

type ICalEvent = {
  type: string;
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  dateOnly?: boolean;
};

@Injectable()
export class CalendarsService {
  async getEvents(
    icsUrl: string | undefined | null,
    startedAt: string,
    endedAt: string
  ): Promise<CalendarEventDto[]> {
    try {
      if (!icsUrl) {
        return [];
      }
      let eventData: CalendarResponse;
      const icsFile: string | undefined = process.env.CALENDAR_FALLBACK_ICS_FILE;
      if (icsFile) {
        // for local testing
        eventData = await ical.async.parseFile(icsFile);
      } else {
        // parse the real url
        eventData = await ical.async.fromURL(icsUrl);
      }

      const events = Object.values(eventData) as ICalEvent[];

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
          allDay: event.dateOnly || false,
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
}
