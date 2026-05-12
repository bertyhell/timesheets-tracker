import { Controller, Get, Param, Query } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CalendarEventDto } from './dto/calendar-event.dto';

@ApiTags('calendars')
@Controller('api/calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

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
