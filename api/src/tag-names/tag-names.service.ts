import { CreateTagNameDto } from './dto/create-tag-name.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import type { TagName } from '../types/types';
import { UpdateTagNameDto } from './dto/update-tag-name.dto';
import { findAllTagNames } from './queries/findAllTagNames';
import { findAllTagNamesBySearchTerm } from './queries/findAllTagNamesBySearchTerm';
import { countTagNames } from './queries/countTagNames';
import { findOneTagName } from './queries/findOneTagName';
import { createTagName } from './queries/createTagName';
import { updateTagName } from './queries/updateTagName';
import { deleteTagName } from './queries/deleteTagName';
import { TagNameDto } from './dto/response-tag-name.dto';
import { CustomError } from '../shared/CustomError';

@Injectable()
export class TagNamesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(rawTagName: Record<string, any>): TagName {
    return {
      id: rawTagName.id,
      title: rawTagName.title,
      code: rawTagName.code,
      color: rawTagName.color,
    };
  }

  async findAll(searchTerm: string | undefined): Promise<TagNameDto[]> {
    try {
      const db = this.databaseService.getDb();
      let rawTagNames;
      if (searchTerm) {
        rawTagNames = await findAllTagNamesBySearchTerm(db, { searchTerm });
      } else {
        rawTagNames = await findAllTagNames(db);
      }

      return rawTagNames.map(this.adapt);
    } catch (err) {
      const error = new CustomError('Failed to fetch all tag-names from the database', err, {
        searchTerm,
      });
      console.error(error);
      throw error;
    }
  }

  async count(): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = await countTagNames(db);

      return result?.count ?? 0;
    } catch (err) {
      const error = new CustomError('Failed to count tag-names in the database', err, {});
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<TagName> {
    try {
      const db = this.databaseService.getDb();
      const tagName = await findOneTagName(db, { id });

      return this.adapt(tagName);
    } catch (err) {
      const error = new CustomError('Failed to fetch one tag-name from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async create(tagName: CreateTagNameDto): Promise<TagName> {
    let id: string | null = null;
    try {
      const db = this.databaseService.getDb();
      id = uuid();
      await createTagName(db, {
        id,
        title: tagName.title,
        code: tagName.code ?? null,
        color: tagName.color,
      });

      return await this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create a tag-name entry in the database', err, {
        id,
        tagName,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, updateTagDto: UpdateTagNameDto): Promise<TagName> {
    try {
      const db = this.databaseService.getDb();
      await updateTagName(
        db,
        { title: updateTagDto.title, code: updateTagDto.code, color: updateTagDto.color },
        { id }
      );

      return await this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update tag-name entry in the database', err, {
        id,
        updateTagDto,
      });
      console.error(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const db = this.databaseService.getDb();
      await deleteTagName(db, { id });
    } catch (err) {
      const error = new CustomError('Failed to delete tag-name entry from the database', err, {
        id,
      });
      console.error(error);
      throw error;
    }
  }
}
