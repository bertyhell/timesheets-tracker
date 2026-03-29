import { Inject, Injectable } from '@nestjs/common';
import type { Website } from '../types/types';
import { DatabaseService } from '../database/database.service';
import { v4 as uuid } from 'uuid';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { unflatten } from 'nested-objects-util';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { findAllWebsites } from './queries/findAllWebsites';
import { findOneWebsite } from './queries/findOneWebsite';
import { findOneWebsiteByStartTime } from './queries/findOneWebsiteByStartTime';
import { createWebsite } from './queries/createWebsite';
import { updateWebsite } from './queries/updateWebsite';
import { deleteWebsite } from './queries/deleteWebsite';

@Injectable()
export class WebsitesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  adapt(rawWebsite: Record<string, any>): Website {
    return unflatten(rawWebsite) as Website;
  }

  async findAll(startedAt: string, endedAt: string): Promise<Website[]> {
    const results = await findAllWebsites(this.databaseService.getDb(), {
      param1: startedAt,
      param2: endedAt,
    });

    return results.map(this.adapt);
  }

  async findOne(id: string): Promise<Website> {
    const result = await findOneWebsite(this.databaseService.getDb(), { param1: id });

    return this.adapt(result);
  }

  async findOneByStartTime(startedAt: string): Promise<Website | null> {
    const result = await findOneWebsiteByStartTime(this.databaseService.getDb(), {
      param1: startedAt,
    });

    if (!result) {
      return null;
    }

    return this.adapt(result);
  }

  async create(website: CreateWebsiteDto): Promise<Website> {
    const id = uuid();
    await createWebsite(this.databaseService.getDb(), {
      param1: id,
      param2: website.websiteTitle,
      param3: website.websiteUrl,
      param4: website.startedAt,
    });

    return this.findOne(id);
  }

  async update(id: string, updateWebsiteDto: UpdateWebsiteDto): Promise<Website> {
    await updateWebsite(
      this.databaseService.getDb(),
      {
        param1: updateWebsiteDto.websiteTitle,
        param2: updateWebsiteDto.websiteUrl,
        param3: updateWebsiteDto.startedAt,
      },
      { param1: id }
    );

    return await this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await deleteWebsite(this.databaseService.getDb(), { param1: id });
  }
}
