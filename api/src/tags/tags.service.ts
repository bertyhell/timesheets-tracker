import { Inject, Injectable } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import type { Tag } from '../types/types';
import { unflatten } from 'nested-objects-util';
import { max, min } from 'date-fns';
import { UpdateTagDto } from './dto/update-tag.dto';
import { findAllTags } from './queries/findAllTags';
import { findOneTag } from './queries/findOneTag';
import { createTag } from './queries/createTag';
import { updateTag } from './queries/updateTag';
import { deleteTag } from './queries/deleteTag';

@Injectable()
export class TagsService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(rawTag: Record<string, any>): Tag {
    return unflatten(rawTag);
  }

  async findAll(startedAt: string, endedAt: string): Promise<Tag[]> {
    const rawTags = findAllTags(this.databaseService.getDb(), {
      startedAt,
      endedAt,
    });

    return rawTags.map(this.adapt);
  }

  async findOne(id: string): Promise<Tag> {
    const rawTag = findOneTag(this.databaseService.getDb(), { id });

    return this.adapt(rawTag);
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const id = uuid();
    await createTag(this.databaseService.getDb(), {
      id,
      tagNameId: createTagDto.tagNameId,
      startedAt: min([new Date(createTagDto.startedAt), new Date(createTagDto.endedAt)]).toISOString(),
      endedAt: max([new Date(createTagDto.startedAt), new Date(createTagDto.endedAt)]).toISOString(),
    });

    return this.findOne(id);
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    await updateTag(
      this.databaseService.getDb(),
      {
        tagNameId: updateTagDto.tagNameId,
        startedAt: updateTagDto.startedAt,
        endedAt: updateTagDto.endedAt,
        note: null,
      },
      { id }
    );

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await deleteTag(this.databaseService.getDb(), { id });
  }
}
