import { CreateAutoTagDto } from './dto/create-auto-tag.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import type { AutoTag } from '../types/types';
import { unflatten } from 'nested-objects-util';
import { UpdateAutoTagsDto } from './dto/update-auto-tags.dto';
import { findAllAutoTags } from './queries/findAllAutoTags';
import { findAllAutoTagsBySearchTerm } from './queries/findAllAutoTagsBySearchTerm';
import { countAutoTags } from './queries/countAutoTags';
import { findOneAutoTag } from './queries/findOneAutoTag';
import { createAutoTag } from './queries/createAutoTag';
import { updateAutoTag } from './queries/updateAutoTag';
import { deleteAutoTag } from './queries/deleteAutoTag';

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
      rawAutoTags = await findAllAutoTagsBySearchTerm(db, { param1: searchTerm });
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
    const autoTag = await findOneAutoTag(db, { param1: id });

    return this.adapt(autoTag);
  }

  async create(autoTag: CreateAutoTagDto): Promise<AutoTag> {
    const db = this.databaseService.getDb();
    const id = uuid();
    await createAutoTag(db, {
      param1: id,
      param2: autoTag.name,
      param3: autoTag.tagNameId,
      param4: autoTag.priority,
      param5: JSON.stringify(autoTag.conditions),
    });

    return this.findOne(id); // is already adapted
  }

  async update(id: string, updateAutoTagDto: UpdateAutoTagsDto): Promise<AutoTag> {
    const db = this.databaseService.getDb();
    await updateAutoTag(
      db,
      {
        param1: updateAutoTagDto.name,
        param2: updateAutoTagDto.tagNameId,
        param3: updateAutoTagDto.priority,
        param4: JSON.stringify(updateAutoTagDto.conditions),
      },
      { param1: id }
    );

    return this.findOne(id);
  }

  async delete(id: string) {
    const db = this.databaseService.getDb();
    await deleteAutoTag(db, { param1: id });
  }
}
