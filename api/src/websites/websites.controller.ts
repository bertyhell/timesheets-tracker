import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { WebsitesService } from './websites.service';
import type { Website } from '../types/types';
import { ApiBody, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { endOfDay, startOfDay } from 'date-fns';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { ActivitiesService } from '../activities/activities.service';
import { compact, uniqBy } from 'lodash';
import { logger } from '../shared/logger';

@ApiTags('websites')
@Controller('api/websites')
export class WebsitesController {
  constructor(
    private readonly websitesService: WebsitesService,
    private readonly activitiesService: ActivitiesService
  ) {}

  @Post()
  @ApiBody({
    type: CreateWebsiteDto,
    required: true,
  })
  async create(@Body() createWebsiteDto: CreateWebsiteDto): Promise<Website | null> {
    logger.info('tracking website: ' + createWebsiteDto.websiteUrl);
    const existingWebsite = this.websitesService.findOneByStartTime(createWebsiteDto.startedAt);
    if (existingWebsite) {
      // Do not create the same website entry twice
      return null;
    }
    return this.websitesService.create(createWebsiteDto);
  }

  @Get()
  @ApiQuery({
    type: 'string',
    name: 'startedAt',
    required: true,
    example: startOfDay(new Date()).toISOString(),
  })
  @ApiQuery({
    type: 'string',
    name: 'endedAt',
    required: true,
    example: endOfDay(new Date()).toISOString(),
  })
  async findAll(
    @Query('startedAt') startedAt: string,
    @Query('endedAt') endedAt: string
  ): Promise<Website[]> {
    // Set endedAt to the startedAt of the next program entry
    const websites = await this.websitesService.findAll(startedAt, endedAt);
    const programs = await this.activitiesService.findAll(startedAt, endedAt);
    return compact(
      uniqBy(
        websites.map((website) => {
          const nextProgram = programs.find((program) => program.startedAt > website.startedAt);
          if (!nextProgram) {
            return null;
          }
          return {
            ...website,
            endedAt: nextProgram.startedAt,
          };
        }),
        (event) => event.startedAt
      )
    );
  }

  @Get(':id')
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  async findOne(@Param('id') id: string): Promise<Website> {
    const website = await this.websitesService.findOne(id);
    const nextProgram = await this.activitiesService.findByNextStartedAt(website.startedAt);
    if (!nextProgram) {
      throw new NotFoundException("Couldn't determine the endedAt date of this website");
    }
    website.endedAt = nextProgram.endedAt;
    return website;
  }

  @Delete()
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.websitesService.delete(id);
  }
}
