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
import { ApiBody, ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { endOfDay, startOfDay } from 'date-fns';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { ResponseWebsiteDto } from './dto/response-website.dto';
import { ProgramsService } from '../programs/programs.service';
import { compact } from 'lodash';
import { logger } from '../shared/logger';
import { resolveWebsiteEndTimes } from './helpers/resolve-website-end-times';

@ApiTags('websites')
@Controller('api/websites')
export class WebsitesController {
  constructor(
    private readonly websitesService: WebsitesService,
    private readonly programsService: ProgramsService
  ) {}

  @Post()
  @ApiBody({
    type: CreateWebsiteDto,
    required: true,
  })
  async create(@Body() createWebsiteDto: CreateWebsiteDto): Promise<Website | null> {
    logger.info('tracking website: ' + createWebsiteDto.websiteUrl);
    const existingWebsite = await this.websitesService.findOneByStartTime(createWebsiteDto.startedAt);
    if (existingWebsite) {
      // Do not create the same website entry twice
      return null;
    }
    return this.websitesService.create(createWebsiteDto);
  }

  @ApiOkResponse({
    description: 'Get a list of all websites',
    type: ResponseWebsiteDto,
    isArray: true,
  })
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
    // A website event only has a startedAt, so its endedAt is derived from the next boundary
    const websites = await this.websitesService.findAll(startedAt, endedAt);
    const programs = await this.programsService.findAll(startedAt, endedAt);
    return resolveWebsiteEndTimes(websites, programs);
  }

  @Get(':id')
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  async findOne(@Param('id') id: string): Promise<Website> {
    const website = await this.websitesService.findOne(id);
    const nextWebsite = await this.websitesService.findByNextStartedAt(website.startedAt);
    const nextProgram = await this.programsService.findByNextStartedAt(website.startedAt);
    const [resolved] = resolveWebsiteEndTimes(
      compact([website, nextWebsite]),
      compact([nextProgram])
    );
    if (!resolved) {
      throw new NotFoundException("Couldn't determine the endedAt date of this website");
    }
    return resolved;
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
