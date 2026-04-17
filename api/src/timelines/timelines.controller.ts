import { Controller, Get, Post, Body, Query, Param, Patch, Delete } from '@nestjs/common';
import { CreateTimelineDto } from './dto/create-timeline.dto';
import { ApiExtraModels, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TimelinesService } from './timelines.service';
import {
  CalendarEventProviderInfoDto,
  TimelineCountDto,
  TimelineDto,
} from './dto/response-timeline.dto';
import { type Timeline } from '../types/types';
import { UpdateTimelineDto } from './dto/update-timeline.dto';
import {
  ActiveStateEventInfoDto,
  AutoTagEventInfoDto,
  CalendarEventInfoDto,
  ProgramEventInfoDto,
  TagEventInfoDto,
  TimelineWithEventsDto,
  WebsiteEventInfoDto,
} from './dto/response-timeline-events.dto';

@ApiExtraModels(
  ActiveStateEventInfoDto,
  ProgramEventInfoDto,
  CalendarEventInfoDto,
  WebsiteEventInfoDto,
  TagEventInfoDto,
  AutoTagEventInfoDto,
  CalendarEventProviderInfoDto
)
@ApiTags('timelines')
@Controller('api/timelines')
export class TimelinesController {
  constructor(private readonly timelinesService: TimelinesService) {}

  @ApiOkResponse({
    description: 'Create a timeline that displays events from a specific event provider',
    type: TimelineDto,
  })
  @Post()
  create(@Body() createTimelineDto: CreateTimelineDto) {
    return this.timelinesService.create(createTimelineDto);
  }

  @ApiOkResponse({
    description:
      'Get a list of timelines optionally filtered by a term that should occur in the title of the timeline',
    type: TimelineDto,
    isArray: true,
  })
  @Get()
  @ApiQuery({ name: 'term', required: false, type: 'string' })
  findAll(@Query('term') term?: string) {
    return this.timelinesService.findAll(term);
  }

  @ApiOkResponse({
    description:
      'Get a list of timelines with their events that happened within the specified time interval for all timelines that exist or one specific one',
    type: TimelineWithEventsDto,
    isArray: true,
  })
  @Get('/events')
  @ApiQuery({ name: 'startedAt', required: true, type: 'string' })
  @ApiQuery({ name: 'endedAt', required: true, type: 'string' })
  @ApiQuery({ name: 'term', required: false, type: 'string' })
  @ApiQuery({ name: 'timelineIds', required: false, type: 'string', isArray: true })
  findAllEvents(
    @Query('startedAt') startedAt?: string,
    @Query('endedAt') endedAt?: string,
    @Query('term') term?: string,
    @Query('timelineIds') timelineIds?: string[]
  ) {
    return this.timelinesService.findAllEvents(startedAt, endedAt, term, timelineIds);
  }

  @ApiOkResponse({
    description: 'Returns the number of timelines that exist',
    type: TimelineCountDto,
  })
  @Get('/count')
  async count(): Promise<TimelineCountDto> {
    return {
      count: await this.timelinesService.count(),
    };
  }

  @ApiOkResponse({
    description: 'Return a single timeline by id',
    type: TimelineDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timelinesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimelineDto: UpdateTimelineDto): Promise<Timeline> {
    return this.timelinesService.update(id, updateTimelineDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.timelinesService.delete(id);
  }
}
