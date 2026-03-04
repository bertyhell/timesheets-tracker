import { CreateTagNameDto } from './dto/create-tag-name.dto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import type { TagName } from '../types/types';
import { UpdateTagNameDto } from './dto/update-tag-name.dto';

@Injectable()
export class TagNamesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  private adapt(rawTagName: Record<string, any>): TagName {
    return {
      id: rawTagName.id,
      name: rawTagName.name,
      code: rawTagName.code,
      color: rawTagName.color,
    };
  }

  async findAll(searchTerm: string | undefined): Promise<TagName[]> {
    let rawTagNames: TagName[];
    if (searchTerm) {
      rawTagNames = await this.databaseService.query<TagName>(
        './src/tag-names/queries/findAllTagNamesBySearchTerm.sql'
      );
    } else {
      rawTagNames = await this.databaseService.query<TagName>(
        './src/tag-names/queries/findAllTagNames.sql'
      );
    }

    return rawTagNames.map(this.adapt);
  }

  async count(): Promise<number> {
    const result = (
      await this.databaseService.query<{ count: number }>(
        './src/tag-names/queries/countTagNames.sql'
      )
    )[0];

    return result.count;
  }

  async findOne(id: string): Promise<TagName> {
    const tagNames = await this.databaseService.query<TagName>(
      './src/tag-names/queries/findOneTagName.sql',
      { id }
    );

    return this.adapt(tagNames[0]);
  }

  async create(tagName: CreateTagNameDto): Promise<TagName> {
    const values = {
      id: uuid(),
      name: tagName.name,
      code: tagName.code,
      color: tagName.color,
    };
    await this.databaseService.mutate('./src/tag-names/queries/createTagName.sql', values);

    return await this.findOne(values.id);
  }

  async update(id: string, updateTagDto: UpdateTagNameDto): Promise<TagName> {
    const values = {
      id: id,
      name: updateTagDto.name,
      code: updateTagDto.code,
      color: updateTagDto.color,
    };
    await this.databaseService.mutate('./src/tag-names/queries/updateTagName.sql', values);

    return await this.findOne(values.id);
  }

  async remove(id: string): Promise<void> {
    await this.databaseService.mutate('./src/tag-names/queries/removeTagName.sql', { id: id });
  }
}
