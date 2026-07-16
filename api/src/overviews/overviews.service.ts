import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import { DatabaseService } from '../database/database.service';
import { CustomError } from '../shared/CustomError';
import { DateRangeMode, OverviewFlatRow, OverviewSourceType, SavedOverviewConfig } from '../types/types';
import { TagsService } from '../tags/tags.service';
import { ProgramsService } from '../programs/programs.service';
import { WebsitesService } from '../websites/websites.service';
import { ActiveStatesService } from '../active-states/active-states.service';
import { CreateSavedOverviewConfigDto } from './dto/create-saved-overview-config.dto';
import { UpdateSavedOverviewConfigDto } from './dto/update-saved-overview-config.dto';
import { findAllSavedOverviewConfigs } from './queries/findAllSavedOverviewConfigs';
import { findOneSavedOverviewConfig } from './queries/findOneSavedOverviewConfig';
import { createSavedOverviewConfig } from './queries/createSavedOverviewConfig';
import { updateSavedOverviewConfig } from './queries/updateSavedOverviewConfig';
import { deleteSavedOverviewConfig } from './queries/deleteSavedOverviewConfig';

@Injectable()
export class OverviewsService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(TagsService) private tagsService: TagsService,
    @Inject(ProgramsService) private programsService: ProgramsService,
    @Inject(WebsitesService) private websitesService: WebsitesService,
    @Inject(ActiveStatesService) private activeStatesService: ActiveStatesService
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
      pivotState: JSON.parse(raw.pivotState),
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
        pivotState: JSON.stringify(dto.pivotState),
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
          pivotState: JSON.stringify(dto.pivotState ?? existing.pivotState),
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

      if (sourceTypes.includes(OverviewSourceType.Tag)) {
        const tags = await this.tagsService.findAll(startedAt, endedAt);
        for (const tag of tags) {
          rows.push(
            this.toFlatRow(tag.id, tag.tagName?.title ?? 'Untagged', OverviewSourceType.Tag, tag.startedAt, tag.endedAt)
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
              program.endedAt
            )
          );
        }
      }

      if (sourceTypes.includes(OverviewSourceType.Website)) {
        const websites = await this.websitesService.findAll(startedAt, endedAt);
        for (const website of websites) {
          if (!website.endedAt) continue;
          rows.push(
            this.toFlatRow(
              website.id,
              website.websiteTitle ?? website.websiteUrl ?? 'Unknown',
              OverviewSourceType.Website,
              website.startedAt,
              website.endedAt
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
              activeState.endedAt
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

  private toFlatRow(
    id: string,
    category: string,
    sourceType: OverviewSourceType,
    startedAt: string,
    endedAt: string
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
    };
  }
}
