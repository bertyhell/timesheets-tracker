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
import { AutoTagDto } from '../auto-tags/dto/response-auto-tag.dto';
import { TagNamesService } from '../tag-names/tag-names.service';
import { GitCommitsService, GitCommitEvent } from '../git-commits/git-commits.service';
import { CustomError } from '../shared/CustomError';

@Injectable()
export class TimelinesService {
  constructor(
    @Inject(ActiveStatesService) private activeStatesService: ActiveStatesService,
    @Inject(AutoTagsService) private autoTagsService: AutoTagsService,
    @Inject(CalendarsService) private calendarsService: CalendarsService,
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(GitCommitsService) private gitCommitsService: GitCommitsService,
    @Inject(ProgramsService) private programsService: ProgramsService,
    @Inject(TagsService) private tagsService: TagsService,
    @Inject(TagNamesService) private tagNamesService: TagNamesService,
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
      color: rawTimeline.color ?? null,
    };
  }

  async findAllTimelines(searchTerm: string | undefined): Promise<Timeline[]> {
    try {
      const db = this.databaseService.getDb();
      let rawTimelines: Record<string, any>[];
      if (searchTerm) {
        rawTimelines = findAllTimelinesBySearchTerm(db, { searchTerm });
      } else {
        rawTimelines = findAllTimelines(db);
      }
      return rawTimelines.map(this.adapt);
    } catch (err) {
      const error = new CustomError('Failed to fetch all timelines from the database', err, {
        searchTerm,
      });
      console.error(error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = countTimelines(db);
      return result?.count ?? 0;
    } catch (err) {
      const error = new CustomError('Failed to count timelines in the database', err, {});
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Timeline> {
    try {
      const db = this.databaseService.getDb();
      const timeline = findOneTimeline(db, { id });

      return this.adapt(timeline);
    } catch (err) {
      const error = new CustomError('Failed to fetch one timeline from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async create(timeline: CreateTimelineDto): Promise<Timeline> {
    let id: string | null = null;
    try {
      const db = this.databaseService.getDb();
      id = uuid();
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
        color: timeline.color ?? null,
      });

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create a timeline entry in the database', err, {
        id,
        timeline,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, updateTimelineDto: UpdateTimelineDto): Promise<Timeline> {
    try {
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
          color: updateTimelineDto.color !== undefined ? (updateTimelineDto.color ?? null) : existing.color,
        },
        { id }
      );

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update timeline entry in the database', err, {
        id,
        updateTimelineDto,
      });
      console.error(error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const db = this.databaseService.getDb();
      await deleteTimeline(db, { id });
    } catch (err) {
      const error = new CustomError('Failed to delete timeline entry from the database', err, {
        id,
      });
      console.error(error);
      throw error;
    }
  }

  public async findAllEvents(
    startedAt: string,
    endedAt: string,
    term: string | undefined,
    timelineIds: string[] | undefined
  ): Promise<TimelineWithEventsDto[]> {
    try {
      const timelines = await this.findAllTimelines(undefined);
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
                    timelineId: timelineInfo.id,
                  };
                });
              })();

            case TimelineType.AutoTag: {
              // Resolve autotags after fetching all other events
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
                    timelineId: timelineInfo.id,
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
                    timelineId: timelineInfo.id,
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
                    timelineId: timelineInfo.id,
                  };
                });
              })();

            case TimelineType.Calendar:
              return (async () => {
                try {
                  const calendarEvents = await this.calendarsService.getEvents(
                    (timelineInfo.eventProviderInfo as { icsUrl?: string })?.icsUrl,
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
                      timelineId: timelineInfo.id,
                    };
                  });
                } catch (err) {
                  console.error(
                    new CustomError('Failed to fetch events from calendar', err, {
                      icsUrl: (timelineInfo.eventProviderInfo as { icsUrl?: string })?.icsUrl,
                      startedAt,
                      endedAt,
                    })
                  );
                  return []; // TODO pass errors to client to show as toast messages
                }
              })();

            case TimelineType.GitCommit:
              return (async () => {
                try {
                  const folderPath = (timelineInfo.eventProviderInfo as { folderPath?: string })
                    ?.folderPath;
                  const gitCommits = await this.gitCommitsService.getEvents(
                    folderPath,
                    startedAt,
                    endedAt
                  );
                  return gitCommits.map((commit: GitCommitEvent): TimelineEventDto => {
                    return {
                      id: commit.id,
                      startedAt: commit.startedAt,
                      endedAt: commit.endedAt,
                      info: {
                        repoName: commit.repoName,
                        commitMessage: commit.commitMessage,
                      },
                      timelineId: timelineInfo.id,
                    };
                  });
                } catch (err) {
                  console.error(
                    new CustomError('Failed to fetch git commit events', err, {
                      folderPath: (timelineInfo.eventProviderInfo as { folderPath?: string })
                        ?.folderPath,
                      startedAt,
                      endedAt,
                    })
                  );
                  return []; // TODO pass errors to client to show as toast messages
                }
              })();
          }
        }
      );
      const events = await Promise.all(fetchEventPromises);

      const timelinesWithEvents = timelinesToFetch.map(
        (timeline, timelineIndex): TimelineWithEventsDto => {
          return {
            id: timeline.id,
            type: timeline.timelineType,
            events: events[timelineIndex],
          };
        }
      );

      // Analyze auto-tags if an autotagTimeline is present
      const tagNames = await this.tagNamesService.findAll(undefined);
      const autoTags = (await this.autoTagsService.findAll(undefined)) as AutoTagDto[];
      return this.autoTagsService.analyseEvents(timelinesWithEvents, autoTags, tagNames);
    } catch (err) {
      const error = new CustomError('Failed to fetch all timeline events', err, {
        startedAt,
        endedAt,
        term,
        timelineIds,
      });
      console.error(error);
      throw error;
    }
  }
}
