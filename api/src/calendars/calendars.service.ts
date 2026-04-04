import { Injectable } from '@nestjs/common';
import * as ical from 'node-ical';
import type { CalendarEvent } from './types';
import fs from 'node:fs/promises';

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
  async parseEvents(url: string, start: string, end: string): Promise<CalendarEvent[]> {
    const icsString = (
      await fs.readFile('C:/Users/verheb4/Downloads/verhelstbert-gmail-calendar.ics', 'utf8')
    ).toString();
    const data = await ical.async.parseICS(icsString);

    const events = Object.values(data) as ICalEvent[];

    events.forEach((event) => {
      console.log(event.summary + ' -- ' + event.location);
    });

    const filteredEvents = events.filter((event) => {
      if (event.type !== 'VEVENT' || !event.start || !event.end) return false;
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return eventStart < new Date(end) && eventEnd > new Date(start);
    });

    return filteredEvents.map((event) => ({
      id: event.uid || '',
      summary: event.summary || '',
      description: event.description || '',
      location: event.location || '',
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      allDay: event.dateOnly || false,
    }));
  }
}
