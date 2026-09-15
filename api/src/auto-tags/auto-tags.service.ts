import { Inject, Injectable } from '@nestjs/common';
import { partition } from 'lodash';
import { unflatten } from 'nested-objects-util';
import { v4 as uuid } from 'uuid';

import { DatabaseService } from '../database/database.service';
import { SettingsService } from '../settings/settings.service';
import { CustomError } from '../shared/CustomError';
import { TagNameDto } from '../tag-names/dto/response-tag-name.dto';
import { TimelineWithEventsDto } from '../timelines/dto/response-timeline-events.dto';
import { TimelineDto } from '../timelines/dto/response-timeline.dto';
import { AutoTag, BooleanOperator, TimelineType } from '../types/types';
import { CreateAutoTagDto } from './dto/create-auto-tag.dto';
import { AutoTagDto, AutoTagMergeResultDto } from './dto/response-auto-tag.dto';
import { UpdateAutoTagsDto } from './dto/update-auto-tags.dto';
import { calculateAutoTagEvents } from './helpers/auto-tags-analyzer';
import { countAutoTags } from './queries/countAutoTags';
import { createAutoTag } from './queries/createAutoTag';
import { deleteAutoTag } from './queries/deleteAutoTag';
import { findAllAutoTags } from './queries/findAllAutoTags';
import { findAllAutoTagsBySearchTerm } from './queries/findAllAutoTagsBySearchTerm';
import { findOneAutoTag } from './queries/findOneAutoTag';
import { reorderAutoTags, type ReorderAutoTagItem } from './queries/reorderAutoTags';
import { updateAutoTag } from './queries/updateAutoTag';

/**
 * Two rules are merge candidates only when they target the same tag name AND cover the same
 * active period. Merging joins conditions with OR, which has no equivalent for two date ranges,
 * so rules whose periods differ must stay separate instead of losing one of the periods.
 */
export function autoTagMergeGroupKey(
  autoTag: Pick<AutoTag, 'tagNameId' | 'activeFrom' | 'activeUntil'>
): string {
  return [autoTag.tagNameId, autoTag.activeFrom ?? '', autoTag.activeUntil ?? ''].join('|');
}

@Injectable()
export class AutoTagsService {
  constructor(
    @Inject(DatabaseService) private databaseService: DatabaseService,
    @Inject(SettingsService) private settingsService: SettingsService
  ) {}

  adapt(rawAutoTag: Record<string, any>): AutoTag {
    return {
      ...unflatten(rawAutoTag),
      conditions: JSON.parse(rawAutoTag.conditions),
    };
  }

  async findAll(searchTerm: string | undefined): Promise<AutoTag[]> {
    try {
      const db = this.databaseService.getDb();
      let rawAutoTags: Record<string, any>[];
      if (searchTerm) {
        rawAutoTags = await findAllAutoTagsBySearchTerm(db, { searchTerm });
      } else {
        rawAutoTags = await findAllAutoTags(db);
      }
      return rawAutoTags.map(this.adapt);
    } catch (err) {
      const error = new CustomError('Failed to fetch all auto-tags from the database', err, {
        searchTerm,
      });
      console.error(error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = await countAutoTags(db);
      return result?.count ?? 0;
    } catch (err) {
      const error = new CustomError('Failed to count auto-tags in the database', err, {});
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<AutoTag> {
    try {
      const db = this.databaseService.getDb();
      const autoTag = await findOneAutoTag(db, { id });

      return this.adapt(autoTag);
    } catch (err) {
      const error = new CustomError('Failed to fetch one auto-tag from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async create(autoTag: CreateAutoTagDto): Promise<AutoTag> {
    let id: string | null = null;
    try {
      const db = this.databaseService.getDb();
      id = uuid();
      await createAutoTag(db, {
        id,
        title: autoTag.title,
        tagNameId: autoTag.tagNameId,
        priority: autoTag.priority,
        conditions: JSON.stringify(autoTag.conditions),
        activeFrom: autoTag.activeFrom || null,
        activeUntil: autoTag.activeUntil || null,
      });

      return this.findOne(id); // is already adapted
    } catch (err) {
      const error = new CustomError('Failed to create an auto-tag entry in the database', err, {
        id,
        autoTag,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, updateAutoTagDto: UpdateAutoTagsDto): Promise<AutoTag> {
    try {
      const db = this.databaseService.getDb();
      const existing = await this.findOne(id);
      await updateAutoTag(
        db,
        {
          title: updateAutoTagDto.title ?? existing.title,
          tagNameId: updateAutoTagDto.tagNameId ?? existing.tagNameId,
          priority: updateAutoTagDto.priority ?? existing.priority,
          conditions: JSON.stringify(updateAutoTagDto.conditions ?? existing.conditions),
          // `undefined` means "not part of this patch"; an explicit null clears the bound.
          activeFrom:
            updateAutoTagDto.activeFrom === undefined
              ? (existing.activeFrom ?? null)
              : updateAutoTagDto.activeFrom || null,
          activeUntil:
            updateAutoTagDto.activeUntil === undefined
              ? (existing.activeUntil ?? null)
              : updateAutoTagDto.activeUntil || null,
        },
        { id }
      );

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update auto-tag entry in the database', err, {
        id,
        updateAutoTagDto,
      });
      console.error(error);
      throw error;
    }
  }

  async mergeDuplicates(): Promise<AutoTagMergeResultDto> {
    try {
      const autoTags = await this.findAll(undefined);

      const grouped = new Map<string, AutoTag[]>();
      for (const tag of autoTags) {
        if (!tag.tagNameId) continue;
        // The active period is part of what makes two rules duplicates. Conditions can be OR'd
        // together but two date ranges cannot, so rules that differ in their period are left
        // alone rather than merged into one whose period only matches some of them.
        const groupKey = autoTagMergeGroupKey(tag);
        if (!grouped.has(groupKey)) grouped.set(groupKey, []);
        grouped.get(groupKey)!.push(tag);
      }

      const duplicateGroups = Array.from(grouped.values()).filter((g) => g.length > 1);

      for (const group of duplicateGroups) {
        const sorted = group.slice().sort((a, b) => a.priority - b.priority);
        const [base, ...rest] = sorted;

        const mergedConditions = [...(base.conditions ?? [])];
        for (const tag of rest) {
          const conditions = tag.conditions ?? [];
          conditions.forEach((cond, i) => {
            mergedConditions.push(
              i === 0 ? { ...cond, booleanOperator: BooleanOperator.OR } : cond
            );
          });
        }

        await this.update(base.id, { id: base.id, conditions: mergedConditions });
        for (const tag of rest) {
          await this.delete(tag.id);
        }
      }

      return { mergedGroups: duplicateGroups.length };
    } catch (err) {
      const error = new CustomError('Failed to merge duplicate auto-tags', err, {});
      console.error(error);
      throw error;
    }
  }

  async reorder(items: ReorderAutoTagItem[]): Promise<void> {
    try {
      const db = this.databaseService.getDb();
      reorderAutoTags(db, items);
    } catch (err) {
      const error = new CustomError('Failed to reorder auto-tags in the database', err, { items });
      console.error(error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const db = this.databaseService.getDb();
      deleteAutoTag(db, { id });
    } catch (err) {
      const error = new CustomError('Failed to delete auto-tag entry from the database', err, {
        id,
      });
      console.error(error);
      throw error;
    }
  }

  public analyseEvents(
    timelines: TimelineWithEventsDto[],
    autoTags: AutoTagDto[],
    allTagNames: TagNameDto[]
  ): TimelineWithEventsDto[] {
    try {
      const [autoTagTimelines, otherTimelines] = partition(
        timelines,
        (timeline) => timeline.type === TimelineType.AutoTag
      );
      const timelinesForAutoTagAnalysis = otherTimelines.filter(
        (timeline) => timeline.type !== TimelineType.Tag
      );
      const combineGapMinutes = this.settingsService.getAutoMergeTagsMinutes();
      autoTagTimelines.forEach((autoTagTimeline) => {
        const autoTagEvents = calculateAutoTagEvents(
          timelinesForAutoTagAnalysis,
          autoTags,
          autoTagTimeline,
          allTagNames,
          undefined,
          combineGapMinutes
        );
        autoTagTimeline.events = autoTagEvents;
      });
      return timelines;
    } catch (err) {
      const error = new CustomError('Failed to analyse auto-tag events', err, {
        timelines,
        autoTags,
        allTagNames,
      });
      console.error(error);
      throw error;
    }
  }
}
