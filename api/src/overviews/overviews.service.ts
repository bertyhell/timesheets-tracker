import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import { DatabaseService } from '../database/database.service';
import { CustomError } from '../shared/CustomError';
import {
  DateRangeMode,
  OverviewFlatRow,
  OverviewSourceType,
  SavedOverviewConfig,
  TimelineType,
} from '../types/types';
import { TagsService } from '../tags/tags.service';
import { ProgramsService } from '../programs/programs.service';
import { WebsitesService } from '../websites/websites.service';
import { ActiveStatesService } from '../active-states/active-states.service';
import { AutoTagsService } from '../auto-tags/auto-tags.service';
import { TagNamesService } from '../tag-names/tag-names.service';
import { TimelinesService } from '../timelines/timelines.service';
import { AutoTagDto } from '../auto-tags/dto/response-auto-tag.dto';
import {
  AutoTagEventInfoDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../timelines/dto/response-timeline-events.dto';
import { getWebsiteDomain } from './helpers/get-website-domain';
import { resolveWebsiteEndTimes } from '../websites/helpers/resolve-website-end-times';
import { CreateSavedOverviewConfigDto } from './dto/create-saved-overview-config.dto';
import { UpdateSavedOverviewConfigDto } from './dto/update-saved-overview-config.dto';
import { findAllSavedOverviewConfigs } from './queries/findAllSavedOverviewConfigs';
import { findOneSavedOverviewConfig } from './queries/findOneSavedOverviewConfig';
import { createSavedOverviewConfig } from './queries/createSavedOverviewConfig';
import { updateSavedOverviewConfig } from './queries/updateSavedOverviewConfig';
import { deleteSavedOverviewConfig } from './queries/deleteSavedOverviewConfig';

const NOT_APPLICABLE = 'N/A';

// Backfilled onto rows whose sourceType has no notion of a given optional field, so the
// flatRows array stays shape-homogeneous when 2+ sourceTypes are combined in one request.
const OPTIONAL_FIELD_DEFAULTS: Partial<OverviewFlatRow> = {
  websiteDomain: NOT_APPLICABLE,
  websiteTitle: NOT_APPLICABLE,
  tagName: NOT_APPLICABLE,
  tagCode: NOT_APPLICABLE,
  programName: NOT_APPLICABLE,
  windowTitle: NOT_APPLICABLE,
  activeState: NOT_APPLICABLE,
  autoTagTitle: NOT_APPLICABLE,
};

// Id of the throw-away AutoTag timeline used to recompute rule activations for the
// "Auto-tag rule activations" report when the user has no AutoTag timeline configured.
const SYNTHETIC_AUTO_TAG_TIMELINE_ID = 'overviews-auto-tag-analysis';

@Injectable()
export class OverviewsService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(TagsService) private tagsService: TagsService,
    @Inject(ProgramsService) private programsService: ProgramsService,
    @Inject(WebsitesService) private websitesService: WebsitesService,
    @Inject(ActiveStatesService) private activeStatesService: ActiveStatesService,
    @Inject(AutoTagsService) private autoTagsService: AutoTagsService,
    @Inject(TagNamesService) private tagNamesService: TagNamesService,
    @Inject(TimelinesService) private timelinesService: TimelinesService
  ) {}

  private adapt(raw: Record<string, any>): SavedOverviewConfig {
    return {
      id: raw.id,
      name: raw.name,
      visualOrder: raw.visualOrder,
      dateRangeMode: raw.dateRangeMode as DateRangeMode,
      customStartedAt: raw.customStartedAt ?? null,
      customEndedAt: raw.customEndedAt ?? null,
      sourceTypes: JSON.parse(raw.sourceTypes),
      reportState: JSON.parse(raw.reportState),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  async findAll(): Promise<SavedOverviewConfig[]> {
    try {
      const db = this.databaseService.getDb();
      const rawConfigs = findAllSavedOverviewConfigs(db);
      return rawConfigs.map((raw) => this.adapt(raw));
    } catch (err) {
      const error = new CustomError('Failed to fetch all saved overview configs from the database', err, {});
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<SavedOverviewConfig> {
    try {
      const db = this.databaseService.getDb();
      const raw = findOneSavedOverviewConfig(db, { id });
      return this.adapt(raw);
    } catch (err) {
      const error = new CustomError('Failed to fetch one saved overview config from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async create(dto: CreateSavedOverviewConfigDto): Promise<SavedOverviewConfig> {
    let id: string | null = null;
    try {
      const db = this.databaseService.getDb();
      id = uuid();
      const now = new Date().toISOString();
      const existing = findAllSavedOverviewConfigs(db);
      const visualOrder = existing.length;

      createSavedOverviewConfig(db, {
        id,
        name: dto.name,
        visualOrder,
        dateRangeMode: dto.dateRangeMode,
        customStartedAt: dto.customStartedAt ?? null,
        customEndedAt: dto.customEndedAt ?? null,
        sourceTypes: JSON.stringify(dto.sourceTypes),
        reportState: JSON.stringify(dto.reportState),
        createdAt: now,
        updatedAt: now,
      });

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create a saved overview config in the database', err, {
        id,
        dto,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateSavedOverviewConfigDto): Promise<SavedOverviewConfig> {
    try {
      const db = this.databaseService.getDb();
      const existing = await this.findOne(id);

      updateSavedOverviewConfig(
        db,
        {
          name: dto.name ?? existing.name,
          dateRangeMode: dto.dateRangeMode ?? existing.dateRangeMode,
          customStartedAt:
            dto.customStartedAt !== undefined ? dto.customStartedAt : existing.customStartedAt,
          customEndedAt: dto.customEndedAt !== undefined ? dto.customEndedAt : existing.customEndedAt,
          sourceTypes: JSON.stringify(dto.sourceTypes ?? existing.sourceTypes),
          reportState: JSON.stringify(dto.reportState ?? existing.reportState),
          updatedAt: new Date().toISOString(),
        },
        { id }
      );

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update saved overview config in the database', err, {
        id,
        dto,
      });
      console.error(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const db = this.databaseService.getDb();
      await deleteSavedOverviewConfig(db, { id });
    } catch (err) {
      const error = new CustomError('Failed to delete saved overview config from the database', err, {
        id,
      });
      console.error(error);
      throw error;
    }
  }

  async getData(
    startedAt: string,
    endedAt: string,
    sourceTypes: OverviewSourceType[]
  ): Promise<OverviewFlatRow[]> {
    try {
      const rows: OverviewFlatRow[] = [];
      const extraDefaults = sourceTypes.length > 1 ? OPTIONAL_FIELD_DEFAULTS : {};

      if (sourceTypes.includes(OverviewSourceType.Tag)) {
        const tags = await this.tagsService.findAll(startedAt, endedAt);
        for (const tag of tags) {
          rows.push(
            this.toFlatRow(
              tag.id,
              tag.tagName?.title ?? 'Untagged',
              OverviewSourceType.Tag,
              tag.startedAt,
              tag.endedAt,
              {
                ...extraDefaults,
                tagName: tag.tagName?.title ?? 'Untagged',
                tagCode: tag.tagName?.code ?? NOT_APPLICABLE,
                tagColor: tag.tagName?.color,
              }
            )
          );
        }
      }

      if (sourceTypes.includes(OverviewSourceType.Program)) {
        const programs = await this.programsService.findAll(startedAt, endedAt);
        for (const program of programs) {
          rows.push(
            this.toFlatRow(
              program.id,
              program.programName ?? 'Unknown',
              OverviewSourceType.Program,
              program.startedAt,
              program.endedAt,
              {
                ...extraDefaults,
                programName: program.programName ?? 'Unknown',
                windowTitle: program.windowTitle ?? NOT_APPLICABLE,
              }
            )
          );
        }
      }

      if (sourceTypes.includes(OverviewSourceType.Website)) {
        const websites = await this.websitesService.findAll(startedAt, endedAt);
        const websitePrograms = await this.programsService.findAll(startedAt, endedAt);
        for (const website of resolveWebsiteEndTimes(websites, websitePrograms)) {
          rows.push(
            this.toFlatRow(
              website.id,
              website.websiteTitle ?? website.websiteUrl ?? 'Unknown',
              OverviewSourceType.Website,
              website.startedAt,
              website.endedAt,
              {
                ...extraDefaults,
                websiteTitle: website.websiteTitle ?? website.websiteUrl ?? 'Unknown',
                websiteDomain: getWebsiteDomain(website.websiteUrl),
              }
            )
          );
        }
      }

      if (sourceTypes.includes(OverviewSourceType.AutoTag)) {
        const autoTags = (await this.autoTagsService.findAll(undefined)) as AutoTagDto[];
        const titlesByAutoTagId = new Map(autoTags.map((autoTag) => [autoTag.id, autoTag.title]));
        const autoTagEvents = await this.getAutoTagEvents(startedAt, endedAt, autoTags);
        for (const event of autoTagEvents) {
          const info = event.info as AutoTagEventInfoDto;
          const ruleTitle = titlesByAutoTagId.get(info.autoTagId) ?? 'Deleted rule';
          rows.push(
            this.toFlatRow(
              event.id,
              ruleTitle,
              OverviewSourceType.AutoTag,
              event.startedAt,
              event.endedAt,
              {
                ...extraDefaults,
                autoTagTitle: ruleTitle,
                tagName: info.tagNameTitle,
                tagCode: info.tagNameCode || NOT_APPLICABLE,
                tagColor: info.tagNameColor,
              }
            )
          );
        }
      }

      if (sourceTypes.includes(OverviewSourceType.ActiveState)) {
        const activeStates = await this.activeStatesService.findAll(startedAt, endedAt);
        for (const activeState of activeStates) {
          rows.push(
            this.toFlatRow(
              activeState.id,
              activeState.isActive ? 'Active' : 'Inactive',
              OverviewSourceType.ActiveState,
              activeState.startedAt,
              activeState.endedAt,
              { ...extraDefaults, activeState: activeState.isActive ? 'Active' : 'Inactive' }
            )
          );
        }
      }

      return rows;
    } catch (err) {
      const error = new CustomError('Failed to fetch overview data', err, {
        startedAt,
        endedAt,
        sourceTypes,
      });
      console.error(error);
      throw error;
    }
  }

  /**
   * Auto-tag events are never stored: they are recomputed on every request by replaying the rules
   * over the other timelines. This reuses the exact same pipeline the timeline view uses, so the
   * activations counted here are the ones the user actually sees. When an AutoTag timeline exists
   * its already-analysed events are reused; otherwise the rules are replayed onto a throw-away
   * timeline so the report also works for users who never added an AutoTag timeline.
   *
   * Note that adjacent events resolving to the same tag are merged by the analyser, so one
   * "activation" is a continuous block of matched time rather than a single raw condition match.
   */
  private async getAutoTagEvents(
    startedAt: string,
    endedAt: string,
    autoTags: AutoTagDto[]
  ): Promise<TimelineEventDto[]> {
    const timelinesWithEvents = await this.timelinesService.findAllEvents(
      startedAt,
      endedAt,
      undefined,
      undefined
    );

    const existingAutoTagTimeline = timelinesWithEvents.find(
      (timeline) => timeline.type === TimelineType.AutoTag
    );
    if (existingAutoTagTimeline) {
      return existingAutoTagTimeline.events;
    }

    if (!autoTags.length) {
      return [];
    }

    const syntheticAutoTagTimeline: TimelineWithEventsDto = {
      id: SYNTHETIC_AUTO_TAG_TIMELINE_ID,
      type: TimelineType.AutoTag,
      events: [],
    };
    const tagNames = await this.tagNamesService.findAll(undefined);
    const analysed = this.autoTagsService.analyseEvents(
      [...timelinesWithEvents, syntheticAutoTagTimeline],
      autoTags,
      tagNames
    );
    return analysed.find((timeline) => timeline.id === SYNTHETIC_AUTO_TAG_TIMELINE_ID)?.events ?? [];
  }

  private toFlatRow(
    id: string,
    category: string,
    sourceType: OverviewSourceType,
    startedAt: string,
    endedAt: string,
    extra?: Partial<OverviewFlatRow>
  ): OverviewFlatRow {
    const start = new Date(startedAt);
    const end = new Date(endedAt);
    return {
      id,
      category,
      sourceType,
      startedAt,
      endedAt,
      date: format(start, 'yyyy-MM-dd'),
      week: format(start, "RRRR-'W'II"),
      month: format(start, 'yyyy-MM'),
      durationHours: (end.getTime() - start.getTime()) / 3_600_000,
      ...extra,
    };
  }
}
