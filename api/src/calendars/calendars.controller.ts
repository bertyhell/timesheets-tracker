import { Controller, Get, Query } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('calendars')
@Controller('api/calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get('parse')
  @ApiQuery({
    type: 'string',
    name: 'url',
    required: true,
    description: 'URL to the iCalendar (.ics) file',
  })
  @ApiQuery({
    type: 'string',
    name: 'start',
    required: true,
    description: 'Start timestamp in ISO format',
    example: '2026-04-01T00:00:00.000Z',
  })
  @ApiQuery({
    type: 'string',
    name: 'end',
    required: true,
    description: 'End timestamp in ISO format',
    example: '2026-04-30T23:59:59.999Z',
  })
  parseEvents(
    @Query('url') url: string,
    @Query('start') start: string,
    @Query('end') end: string
  ) {
    return this.calendarsService.parseEvents(url, start, end);
  }
}
