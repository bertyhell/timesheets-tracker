import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class CalendarEventDto {
  @IsString()
  @ApiProperty({
    type: String,
    description: 'Event ID',
  })
  id: string;

  @IsString()
  @ApiProperty({
    type: String,
    description: 'Event summary/title',
  })
  summary: string;

  @IsString()
  @ApiProperty({
    type: String,
    description: 'Event description',
  })
  description: string;

  @IsString()
  @ApiProperty({
    type: String,
    description: 'Event location',
  })
  location: string;

  @IsString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Event start time in ISO format',
  })
  startedAt: string;

  @IsString()
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Event end time in ISO format',
  })
  endedAt: string;

  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: 'Whether the event is an all-day event',
  })
  allDay: boolean;
}
