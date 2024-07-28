import { Inject, Injectable } from '@nestjs/common';
import { type CreateTagDto } from './dto/create-tag.dto';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import type { Tag } from '../types/types';
import { unflatten } from 'nested-objects-util';
import { max, min } from 'date-fns';
import { type UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(rawTag: Record<string, any>): Tag {
    return unflatten(rawTag);
  }

  async findAll(startedAt: string, endedAt: string): Promise<Tag[]> {
    const rawTags = await this.databaseService.exec<Tag>('./src/tags/queries/findAllTags.sql', {
      startedAt,
      endedAt,
    });

    return rawTags.map(this.adapt);
  }

  async findOne(id: string): Promise<Tag> {
    const rawTag = await this.databaseService.exec<Tag>('./src/tags/queries/findOneTag.sql', {
      id,
    });

    return this.adapt(rawTag);
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const values = {
      $id: uuid(),
      $tagNameId: createTagDto.tagNameId,
      $startedAt: min([
        new Date(createTagDto.startedAt),
        new Date(createTagDto.endedAt),
      ]).toISOString(),
      $endedAt: max([
        new Date(createTagDto.startedAt),
        new Date(createTagDto.endedAt),
      ]).toISOString(),
    };
    await this.databaseService.exec('./src/tags/queries/createTag.sql', values);

    return this.findOne(values.$id);
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const values = {
      $id: id,
      $tagNameId: updateTagDto.tagNameId,
      $startedAt: updateTagDto.startedAt,
      $endedAt: updateTagDto.endedAt,
    };
    await this.databaseService.exec('./src/tags/queries/updateTag.sql', values);

    return await this.findOne(values.$id);
  }

  async remove(id: string): Promise<void> {
    await this.databaseService.exec('./src/tags/queries/removeTag.sql', { $id: id });
  }
}
