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
import { CustomError } from '../shared/CustomError';

@Injectable()
export class WebsitesService {
  constructor(@Inject(DatabaseService) private databaseService: DatabaseService) {}

  adapt(rawWebsite: Record<string, any>): Website {
    return unflatten(rawWebsite) as Website;
  }

  async findAll(startedAt: string, endedAt: string): Promise<Website[]> {
    try {
      const results = await findAllWebsites(this.databaseService.getDb(), {
        startedAt,
        endedAt,
      });

      return results.map(this.adapt);
    } catch (err) {
      const error = new CustomError('Failed to fetch all websites from the database', err, {
        startedAt,
        endedAt,
      });
      console.error(error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Website> {
    try {
      const result = await findOneWebsite(this.databaseService.getDb(), { id });

      return this.adapt(result);
    } catch (err) {
      const error = new CustomError('Failed to fetch one website from the database', err, { id });
      console.error(error);
      throw error;
    }
  }

  async findOneByStartTime(startedAt: string): Promise<Website | null> {
    try {
      const result = await findOneWebsiteByStartTime(this.databaseService.getDb(), {
        startedAt,
      });

      if (!result) {
        return null;
      }

      return this.adapt(result);
    } catch (err) {
      const error = new CustomError(
        'Failed to fetch website by start time from the database',
        err,
        { startedAt }
      );
      console.error(error);
      throw error;
    }
  }

  async create(website: CreateWebsiteDto): Promise<Website> {
    let id: string | null = null;
    try {
      id = uuid();
      await createWebsite(this.databaseService.getDb(), {
        id,
        websiteTitle: website.websiteTitle,
        websiteUrl: website.websiteUrl,
        startedAt: website.startedAt,
      });

      return this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to create a website entry in the database', err, {
        id,
        website,
      });
      console.error(error);
      throw error;
    }
  }

  async update(id: string, updateWebsiteDto: UpdateWebsiteDto): Promise<Website> {
    try {
      await updateWebsite(
        this.databaseService.getDb(),
        {
          websiteTitle: updateWebsiteDto.websiteTitle,
          websiteUrl: updateWebsiteDto.websiteUrl,
          startedAt: updateWebsiteDto.startedAt,
        },
        { id }
      );

      return await this.findOne(id);
    } catch (err) {
      const error = new CustomError('Failed to update website entry in the database', err, {
        id,
        updateWebsiteDto,
      });
      console.error(error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteWebsite(this.databaseService.getDb(), { id });
    } catch (err) {
      const error = new CustomError('Failed to delete website entry from the database', err, { id });
      console.error(error);
      throw error;
    }
  }
}
