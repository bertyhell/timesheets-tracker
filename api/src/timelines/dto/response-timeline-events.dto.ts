import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsString } from 'class-validator';
import { TimelineType } from '../../types/types';

export class TimelineEventDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Uuid of the timeline',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  id: string;

  @IsObject()
  @Type(() => Object)
  @ApiProperty({
    type: Object,
    description:
      'type specific info for this event. eg: summary of a calendar event or programName of a program event',
    example: {
      programName: 'Visual Studio Code',
      windowName: 'Visual Studio Code: file.js',
    },
    required: true,
  })
  info: Record<string, string | number | boolean>;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Start time in iso format',
    example: '2023-01-01T13:00:00.000Z',
    required: true,
  })
  startedAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'End time in ISO format',
    example: '2023-01-01T14:00:00.000Z',
    required: true,
  })
  endedAt: string;
}

export class TimelineWithEventsDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the timeline',
  })
  id: string;

  @IsEnum(TimelineType)
  @Type(() => String)
  @ApiProperty({
    type: TimelineType,
    description: 'Type of the timeline',
    examples: ['Program', 'Website'],
    enum: TimelineType,
    enumName: 'TimelineType',
  })
  type: TimelineType;

  @IsArray()
  @Type(() => Object)
  @ApiProperty({
    type: TimelineEventDto,
    isArray: true,
    description: 'event that happened at a certain start and endtime and has some info',
  })
  events: TimelineEventDto[];
}
