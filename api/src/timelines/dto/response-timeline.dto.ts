import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { type Timeline, TimelineType } from '../../types/types';

export class CalendarEventProviderInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description:
      'A url pointing to the ICS file of the calendar used for fetching events from the calendar',
  })
  icsUrl: string;
}

export class TimelineDto implements Timeline {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the timeline',
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the timeline',
  })
  title: string;

  @IsEnum(TimelineType)
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Type of the timeline',
    enum: TimelineType,
    enumName: 'TimelineType',
  })
  timelineType: TimelineType;

  @IsObject()
  @ApiProperty({
    description:
      'Specific info for getting events for this timeline type. eg: calendar needs a url to ics file, github needs a link to the git folder, ...',
    oneOf: [{ $ref: getSchemaPath(CalendarEventProviderInfoDto) }],
    nullable: true,
  })
  eventProviderInfo: null | CalendarEventProviderInfoDto;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'ISO timestamp at which the timeline was created',
  })
  createdAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'ISO timestamp at which the timeline was last updated',
  })
  updatedAt: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    type: Number,
    description: 'Order in which the timelines are displayed',
  })
  order: number;
}

export class TimelineCountDto {
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    type: Number,
    description: 'Number of timelines that exist',
  })
  count: number;
}
