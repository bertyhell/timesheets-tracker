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
import { TimelineDto } from '../timelines/dto/response-timeline.dto';
import { calculateAutoTagEvents } from './helpers/auto-tags-analyzer';
import { partition } from 'lodash';
import { AutoTagDto } from './dto/response-auto-tag.dto';
import { TagNameDto } from '../tag-names/dto/response-tag-name.dto';
import { TimelineWithEventsDto } from '../timelines/dto/response-timeline-events.dto';

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
    const db = this.databaseService.getDb();
    let rawAutoTags: Record<string, any>[];
    if (searchTerm) {
      rawAutoTags = await findAllAutoTagsBySearchTerm(db, { searchTerm });
    } else {
      rawAutoTags = await findAllAutoTags(db);
    }
    return rawAutoTags.map(this.adapt);
  }

  async count(): Promise<number> {
    const db = this.databaseService.getDb();
    const result = await countAutoTags(db);
    return result?.count ?? 0;
  }

  async findOne(id: string): Promise<AutoTag> {
    const db = this.databaseService.getDb();
    const autoTag = await findOneAutoTag(db, { id });

    return this.adapt(autoTag);
  }

  async create(autoTag: CreateAutoTagDto): Promise<AutoTag> {
    const db = this.databaseService.getDb();
    const id = uuid();
    await createAutoTag(db, {
      id,
      title: autoTag.title,
      tagNameId: autoTag.tagNameId,
      priority: autoTag.priority,
      conditions: JSON.stringify(autoTag.conditions),
    });

    return this.findOne(id); // is already adapted
  }

  async update(id: string, updateAutoTagDto: UpdateAutoTagsDto): Promise<AutoTag> {
    const db = this.databaseService.getDb();
    await updateAutoTag(
      db,
      {
        title: updateAutoTagDto.title,
        tagNameId: updateAutoTagDto.tagNameId,
        priority: updateAutoTagDto.priority,
        conditions: JSON.stringify(updateAutoTagDto.conditions),
      },
      { id }
    );

    return this.findOne(id);
  }

  async delete(id: string) {
    const db = this.databaseService.getDb();
    deleteAutoTag(db, { id });
  }

  public analyseEvents(
    timelines: TimelineWithEventsDto[],
    autoTags: AutoTagDto[],
    allTagNames: TagNameDto[]
  ): TimelineWithEventsDto[] {
    const [autoTagTimelines, otherTimelines] = partition(
      timelines,
      (timeline) => timeline.type === TimelineType.AutoTag
    );
    const timelinesForAutoTagAnalysis = otherTimelines.filter(
      (timeline) => timeline.type !== TimelineType.Tag
    );
    autoTagTimelines.forEach((autoTagTimeline) => {
      const autoTagEvents = calculateAutoTagEvents(
        timelinesForAutoTagAnalysis,
        autoTags,
        autoTagTimeline,
        allTagNames
      );
      autoTagTimeline.events = autoTagEvents;
    });
    return timelines;
  }
}
