import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UpdateCalendarDto } from './dto/update-calendar.dto';
import { CalendarDto } from './dto/response-calendar.dto';
import { CalendarEventDto } from './dto/calendar-event.dto';
import type { Calendar, CalendarEvent } from '../types/types';

@ApiTags('calendars')
@Controller('api/calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @ApiOkResponse({
    description: 'Create a calendar',
    type: CalendarDto,
  })
  @Post()
  create(@Body() createCalendarDto: CreateCalendarDto): Promise<Calendar> {
    return this.calendarsService.create(createCalendarDto);
  }

  @ApiOkResponse({
    description: 'Get a list of all calendars',
    type: CalendarDto,
    isArray: true,
  })
  @Get()
  findAll(): Promise<Calendar[]> {
    return this.calendarsService.findAll();
  }

  @ApiOkResponse({
    description: 'Return a single calendar by id',
    type: CalendarDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Calendar> {
    return this.calendarsService.findOne(id);
  }

  @ApiOkResponse({
    description: 'Update a calendar by id',
    type: CalendarDto,
  })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCalendarDto: UpdateCalendarDto): Promise<Calendar> {
    return this.calendarsService.update(id, updateCalendarDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<void> {
    return this.calendarsService.delete(id);
  }

  @ApiOkResponse({
    description: 'Get events from a calendar for a given time range',
    type: CalendarEventDto,
    isArray: true,
  })
  @Get(':id/events')
  @ApiQuery({
    type: 'string',
    name: 'startedAt',
    required: true,
    description: 'Start timestamp in ISO format',
    example: '2026-04-01T00:00:00.000Z',
  })
  @ApiQuery({
    type: 'string',
    name: 'endedAt',
    required: true,
    description: 'End timestamp in ISO format',
    example: '2026-04-30T23:59:59.999Z',
  })
  getEvents(
    @Param('id') id: string,
    @Query('startedAt') startedAt: string,
    @Query('endedAt') endedAt: string
  ): Promise<CalendarEventDto[]> {
    return this.calendarsService.getEvents(id, startedAt, endedAt);
  }
}
