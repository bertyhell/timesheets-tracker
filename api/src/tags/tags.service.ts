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
import { updateTagTime } from './queries/updateTagTime';
import { deleteTag } from './queries/deleteTag';
import { CustomError } from '../shared/CustomError';

@Injectable()
export class TagsService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(rawTag: Record<string, any>): Tag {
    return unflatten(rawTag);
  }

  async findAll(startedAt: string, endedAt: string): Promise<Tag[]> {
    try {
      const rawTags = findAllTags(this.databaseService.getDb(), {
        startedAt,
        endedAt,
      });

      return rawTags.map(this.adapt);
    } catch (err) {
      const error = new CustomError('Failed to fetch all tags from the database', err, {
        startedAt,
        endedAt,
      });
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Tag> {
    try {
      const rawTag = findOneTag(this.databaseService.getDb(), { id });

      return this.adapt(rawTag);
    } catch (err) {
      const error = new CustomError('Failed to fetch one tag from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async create(createTagDto: CreateTagDto): Promise<Tag> {
    let id: string | null = null;
    try {
      id = uuid();
      await createTag(this.databaseService.getDb(), {
        id,
        tagNameId: createTagDto.tagNameId,
        startedAt: min([
          new Date(createTagDto.startedAt),
          new Date(createTagDto.endedAt),
        ]).toISOString(),
        endedAt: max([
          new Date(createTagDto.startedAt),
          new Date(createTagDto.endedAt),
        ]).toISOString(),
      });

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create a tag entry in the database', err, {
        id,
        createTagDto,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    try {
      if (updateTagDto.tagNameId == null) {
        // Only time fields are being updated (e.g. from a resize drag)
        await updateTagTime(
          this.databaseService.getDb(),
          {
            startedAt: updateTagDto.startedAt,
            endedAt: updateTagDto.endedAt,
          },
          { id }
        );
      } else {
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
      }

      return await this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update tag entry in the database', err, {
        id,
        updateTagDto,
      });
      console.error(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await deleteTag(this.databaseService.getDb(), { id });
    } catch (err) {
      const error = new CustomError('Failed to delete tag entry from the database', err, { id });
      console.error(error);
      throw error;
    }
  }
}
