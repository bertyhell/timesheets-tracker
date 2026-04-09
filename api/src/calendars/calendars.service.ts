import { Inject, Injectable } from '@nestjs/common';
import * as ical from 'node-ical';
import type { Calendar, CalendarEvent } from '../types/types';
import fs from 'node:fs/promises';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { CalendarEventDto } from './dto/calendar-event.dto';
import { findAllCalendars } from './queries/findAllCalendars';
import { findOneCalendar } from './queries/findOneCalendar';
import { createCalendar } from './queries/createCalendar';
import { updateCalendar } from './queries/updateCalendar';
import { deleteCalendar } from './queries/deleteCalendar';

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
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  async findAll(): Promise<Calendar[]> {
    const db = this.databaseService.getDb();
    return findAllCalendars(db);
  }

  async findOne(id: string): Promise<Calendar> {
    const db = this.databaseService.getDb();
    return findOneCalendar(db, { id });
  }

  async create(createCalendarDto: CreateCalendarDto): Promise<Calendar> {
    const db = this.databaseService.getDb();
    const id = uuid();
    await createCalendar(db, {
      id,
      title: createCalendarDto.title,
      url: createCalendarDto.url,
      color: createCalendarDto.color,
    });
    return this.findOne(id);
  }

  async update(id: string, updateCalendarDto: UpdateCalendarDto): Promise<Calendar> {
    const db = this.databaseService.getDb();
    const existing = await this.findOne(id);
    await updateCalendar(
      db,
      {
        title: updateCalendarDto.title ?? existing.title,
        url: updateCalendarDto.url ?? existing.url,
        color: updateCalendarDto.color ?? existing.color,
      },
      { id }
    );
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const db = this.databaseService.getDb();
    await deleteCalendar(db, { id });
  }

  async getEvents(id: string, startedAt: string, endedAt: string): Promise<CalendarEventDto[]> {
    const calendar = await this.findOne(id);
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
  }
}
