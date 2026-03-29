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

  async findAll(searchTerm: string | undefined): Promise<TagName[]> {
    const db = this.databaseService.getDb();
    let rawTagNames;
    if (searchTerm) {
      rawTagNames = await findAllTagNamesBySearchTerm(db, { searchTerm });
    } else {
      rawTagNames = await findAllTagNames(db);
    }

    return rawTagNames.map(this.adapt);
  }

  async count(): Promise<number> {
    const db = this.databaseService.getDb();
    const result = await countTagNames(db);

    return result?.count ?? 0;
  }

  async findOne(id: string): Promise<TagName> {
    const db = this.databaseService.getDb();
    const tagName = await findOneTagName(db, { id });

    return this.adapt(tagName);
  }

  async create(tagName: CreateTagNameDto): Promise<TagName> {
    const db = this.databaseService.getDb();
    const id = uuid();
    await createTagName(db, {
      id,
      title: tagName.title,
      code: tagName.code,
      color: tagName.color,
    });

    return await this.findOne(id);
  }

  async update(id: string, updateTagDto: UpdateTagNameDto): Promise<TagName> {
    const db = this.databaseService.getDb();
    await updateTagName(
      db,
      { title: updateTagDto.title, code: updateTagDto.code, color: updateTagDto.color },
      { id }
    );

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const db = this.databaseService.getDb();
    await deleteTagName(db, { id });
  }
}
