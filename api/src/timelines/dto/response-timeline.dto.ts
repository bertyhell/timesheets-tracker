import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { type Timeline, TimelineType } from '../../types/types';

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
  @Type(() => Object)
  @ApiProperty({
    type: Object,
    description:
      'Specific info for getting events for this timeline type. eg: calendar needs a url to ics file, github needs a link to the git folder, ...',
  })
  eventProviderInfo: Record<string, string>;

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
