import { CreateAutoTagDto } from './dto/create-auto-tag.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { AutoTag, TimelineType } from '../types/types';
import { unflatten } from 'nested-objects-util';
import { UpdateAutoTagsDto } from './dto/update-auto-tags.dto';
import { findAllAutoTags } from './queries/findAllAutoTags';
import { findAllAutoTagsBySearchTerm } from './queries/findAllAutoTagsBySearchTerm';
import { countAutoTags } from './queries/countAutoTags';
import { findOneAutoTag } from './queries/findOneAutoTag';
import { createAutoTag } from './queries/createAutoTag';
import { updateAutoTag } from './queries/updateAutoTag';
import { deleteAutoTag } from './queries/deleteAutoTag';
import { reorderAutoTags, type ReorderAutoTagItem } from './queries/reorderAutoTags';
import { TimelineDto } from '../timelines/dto/response-timeline.dto';
import { calculateAutoTagEvents } from './helpers/auto-tags-analyzer';
import { partition } from 'lodash';
import { AutoTagDto } from './dto/response-auto-tag.dto';
import { TagNameDto } from '../tag-names/dto/response-tag-name.dto';
import { TimelineWithEventsDto } from '../timelines/dto/response-timeline-events.dto';
import { CustomError } from '../shared/CustomError';

@Injectable()
export class AutoTagsService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

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
      const tagTimelines = otherTimelines.filter((timeline) => timeline.type === TimelineType.Tag);
      autoTagTimelines.forEach((autoTagTimeline) => {
        const autoTagEvents = calculateAutoTagEvents(
          timelinesForAutoTagAnalysis,
          autoTags,
          autoTagTimeline,
          allTagNames,
          undefined,
          tagTimelines
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
