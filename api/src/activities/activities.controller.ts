import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import type { Activity } from '../types/types';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { endOfDay, startOfDay } from 'date-fns';
import { ResponseActivityDto } from './dto/response-activity.dto';

@ApiTags('activities')
@Controller('api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: Activity) {
    return this.activitiesService.create(createActivityDto);
  }

  @ApiOkResponse({
    description: 'Get a list of all activities',
    type: ResponseActivityDto,
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
  findAll(
    @Query('startedAt') startedAt: string,
    @Query('endedAt') endedAt: string
  ): Promise<Activity[]> {
    return this.activitiesService.findAll(startedAt, endedAt);
  }

  @Get(':id')
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  findOne(@Param('id') id: string): Promise<Activity> {
    return this.activitiesService.findOne(id);
  }

  @Delete()
  @ApiParam({
    type: 'string',
    name: 'id',
    required: true,
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.activitiesService.delete(id);
  }
}
