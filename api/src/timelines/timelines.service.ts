import { CreateTimelineDto } from './dto/create-timeline.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import {
  ActiveState,
  CalendarEvent,
  Program,
  Tag,
  Timeline,
  TimelineType,
  Website,
} from '../types/types';
import { UpdateTimelineDto } from './dto/update-timeline.dto';
import { findAllTimelines } from './queries/findAllTimelines';
import { findAllTimelinesBySearchTerm } from './queries/findAllTimelinesBySearchTerm';
import { countTimelines } from './queries/countTimelines';
import { findOneTimeline } from './queries/findOneTimeline';
import { createTimeline } from './queries/createTimeline';
import { updateTimeline } from './queries/updateTimeline';
import { deleteTimeline } from './queries/deleteTimeline';
import { TimelineEventDto, TimelineWithEventsDto } from './dto/response-timeline-events.dto';
import { TimelineDto } from './dto/response-timeline.dto';
import { CalendarsService } from '../calendars/calendars.service';
import { ProgramsService } from '../programs/programs.service';
import { WebsitesService } from '../websites/websites.service';
import { TagsService } from '../tags/tags.service';
import { AutoTagsService } from '../auto-tags/auto-tags.service';
import { ActiveStatesService } from '../activeStates/active-states.service';

@Injectable()
export class TimelinesService {
  constructor(
    @Inject(ActiveStatesService) private activeStatesService: ActiveStatesService,
    @Inject(AutoTagsService) private autoTagsService: AutoTagsService,
    @Inject(CalendarsService) private calendarsService: CalendarsService,
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(ProgramsService) private programsService: ProgramsService,
    @Inject(TagsService) private tagsService: TagsService,
    @Inject(WebsitesService) private websitesService: WebsitesService
  ) {}

  adapt(rawTimeline: Record<string, any>): Timeline {
    return {
      id: rawTimeline.id,
      title: rawTimeline.title,
      timelineType: rawTimeline.timelineType as TimelineType,
      eventProviderInfo: rawTimeline.eventProviderInfo
        ? JSON.parse(rawTimeline.eventProviderInfo)
        : null,
      createdAt: rawTimeline.createdAt,
      updatedAt: rawTimeline.updatedAt,
      visualOrder: rawTimeline.visualOrder,
    };
  }

  async findAll(searchTerm: string | undefined): Promise<Timeline[]> {
    const db = this.databaseService.getDb();
    let rawTimelines: Record<string, any>[];
    if (searchTerm) {
      rawTimelines = findAllTimelinesBySearchTerm(db, { searchTerm });
    } else {
      rawTimelines = findAllTimelines(db);
    }
    return rawTimelines.map(this.adapt);
  }

  async count(): Promise<number> {
    const db = this.databaseService.getDb();
    const result = countTimelines(db);
    return result?.count ?? 0;
  }

  async findOne(id: string): Promise<Timeline> {
    const db = this.databaseService.getDb();
    const timeline = findOneTimeline(db, { id });

    return this.adapt(timeline);
  }

  async create(timeline: CreateTimelineDto): Promise<Timeline> {
    const db = this.databaseService.getDb();
    const id = uuid();
    const now = new Date().toISOString();
    createTimeline(db, {
      id,
      title: timeline.title,
      timelineType: timeline.timelineType,
      eventProviderInfo: timeline.eventProviderInfo
        ? JSON.stringify(timeline.eventProviderInfo)
        : null,
      createdAt: now,
      updatedAt: now,
      visualOrder: timeline.visualOrder,
    });

    return this.findOne(id);
  }

  async update(id: string, updateTimelineDto: UpdateTimelineDto): Promise<Timeline> {
    const db = this.databaseService.getDb();
    const existing = await this.findOne(id);
    const eventProviderInfo = updateTimelineDto.eventProviderInfo ?? existing.eventProviderInfo;
    updateTimeline(
      db,
      {
        title: updateTimelineDto.title ?? existing.title,
        timelineType: (updateTimelineDto.timelineType ?? existing.timelineType) as TimelineType,
        eventProviderInfo: eventProviderInfo ? JSON.stringify(eventProviderInfo) : null,
        updatedAt: new Date().toISOString(),
        visualOrder: updateTimelineDto.visualOrder ?? existing.visualOrder,
      },
      { id }
    );

    return this.findOne(id);
  }

  async delete(id: string) {
    const db = this.databaseService.getDb();
    await deleteTimeline(db, { id });
  }

  public async findAllEvents(
    startedAt: string,
    endedAt: string,
    term: string | undefined,
    timelineIds: string[] | undefined
  ): Promise<TimelineWithEventsDto[]> {
    const timelines = await this.findAll(undefined);
    let timelinesToFetch: TimelineDto[];
    if (timelineIds) {
      timelinesToFetch = timelines.filter((timeline) => timelineIds.includes(timeline.id));
    } else {
      timelinesToFetch = timelines;
    }
    if (term) {
      timelinesToFetch = timelinesToFetch.filter((timeline) =>
        timeline.title.toLowerCase().includes(term.toLowerCase())
      );
    }
    const fetchEventPromises: Promise<TimelineEventDto[]>[] = timelinesToFetch.map(
      (timelineInfo): Promise<TimelineEventDto[]> => {
        switch (timelineInfo.timelineType) {
          case TimelineType.ActiveState:
            return (async () => {
              const activeStates = await this.activeStatesService.findAll(startedAt, endedAt);
              return activeStates.map((activeState: ActiveState): TimelineEventDto => {
                return {
                  id: activeState.id,
                  startedAt: activeState.startedAt,
                  endedAt: activeState.endedAt,
                  info: {
                    isActive: activeState.isActive,
                  },
                };
              });
            })();

          case TimelineType.AutoTag: {
            const autoTags = this.autoTagsService.findAll(undefined);
            // TODO resolve auto tags to events
            return Promise.resolve([]);
          }

          case TimelineType.Tag:
            return (async () => {
              const tagEvents = await this.tagsService.findAll(startedAt, endedAt);
              return tagEvents.map((tag: Tag): TimelineEventDto => {
                return {
                  id: tag.id,
                  startedAt: tag.startedAt,
                  endedAt: tag.endedAt,
                  info: {
                    tagNameId: tag.tagName?.id,
                    tagNameName: tag.tagName?.title,
                    tagNameColor: tag.tagName?.color,
                    tagNameCode: tag.tagName?.code,
                  },
                };
              });
            })();

          case TimelineType.Website:
            return (async () => {
              const websites = await this.websitesService.findAll(startedAt, endedAt);
              return websites.map((website: Website): TimelineEventDto => {
                return {
                  id: website.id,
                  startedAt: website.startedAt,
                  endedAt: website.endedAt,
                  info: {
                    websiteUrl: website.websiteUrl,
                    websiteTitle: website.websiteTitle,
                  },
                };
              });
            })();

          case TimelineType.Program:
            return (async () => {
              const programActivities = await this.programsService.findAll(startedAt, endedAt);
              return programActivities.map((program: Program): TimelineEventDto => {
                return {
                  id: program.id,
                  startedAt: program.startedAt,
                  endedAt: program.endedAt,
                  info: {
                    programName: program.programName,
                    windowTitle: program.windowTitle,
                  },
                };
              });
            })();

          case TimelineType.Calendar:
            return (async () => {
              const calendarEvents = await this.calendarsService.getEvents(
                timelineInfo.id,
                startedAt,
                endedAt
              );
              return calendarEvents.map((calendarEvent: CalendarEvent): TimelineEventDto => {
                return {
                  id: calendarEvent.id,
                  startedAt: calendarEvent.startedAt,
                  endedAt: calendarEvent.endedAt,
                  info: {
                    summary: calendarEvent.summary,
                    description: calendarEvent.description,
                    location: calendarEvent.location,
                    allDay: calendarEvent.allDay,
                  },
                };
              });
            })();
        }
      }
    );
    const events = await Promise.all(fetchEventPromises);
    return timelinesToFetch.map((timeline, timelineIndex): TimelineWithEventsDto => {
      return {
        id: timeline.id,
        type: timeline.timelineType,
        events: events[timelineIndex],
      };
    });
  }
}
