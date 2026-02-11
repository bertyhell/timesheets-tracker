import {  CreateAutoTagDto } from './dto/create-auto-tag.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import type { AutoTag } from '../types/types';
import { unflatten } from 'nested-objects-util';
import { UpdateAutoTagsDto } from './dto/update-auto-tags.dto';

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
    let rawAutoTags: Record<string, string>[];
    if (searchTerm) {
      rawAutoTags = await this.databaseService.exec(
        './src/auto-tags/queries/findAllAutoTagsBySearchTerm.sql',
        {
          $searchTerm: searchTerm,
        }
      );
    } else {
      rawAutoTags = await this.databaseService.exec('./src/auto-tags/queries/findAllAutoTags.sql');
    }
    return rawAutoTags.map(this.adapt);
  }

  async count(): Promise<number> {
    const result = (
      await this.databaseService.exec<{ count: number }>(
        './src/auto-tags/queries/countAutoTags.sql'
      )
    )[0];
    return result.count;
  }

  async findOne(id: string): Promise<AutoTag> {
    const autoTags = await this.databaseService.exec<AutoTag>(
      './src/auto-tags/queries/findOneAutoTag.sql',
      {
        id,
      }
    );

    return this.adapt(autoTags[0]);
  }

  async create(autoTag: CreateAutoTagDto): Promise<AutoTag> {
    const values = {
      $id: uuid(),
      $name: autoTag.name,
      $tagNameId: autoTag.tagNameId,
      $priority: autoTag.priority,
      $conditions: JSON.stringify(autoTag.conditions),
    };
    await this.databaseService.exec('./src/auto-tags/queries/createAutoTag.sql', values);

    return this.findOne(values.$id); // is already adapted
  }

  async update(id: string, updateAutoTagDto: UpdateAutoTagsDto): Promise<AutoTag> {
    const values = {
      $id: id,
      $name: updateAutoTagDto.name,
      $tagNameId: updateAutoTagDto.tagNameId,
      $priority: updateAutoTagDto.priority,
      $conditions: JSON.stringify(updateAutoTagDto.conditions),
    };
    await this.databaseService.exec('./src/auto-tags/queries/updateAutoTag.sql', values);

    return this.findOne(values.$id);
  }

  async delete(id: string) {
    await this.databaseService.exec('./src/auto-tags/queries/deleteAutoTag.sql', { $id: id });
  }
}
