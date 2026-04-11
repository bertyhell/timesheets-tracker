import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { TimelineType } from '../../types/types';

export class CreateTimelineDto {
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

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description:
      'The information that is needed for this timeline to fetch events. eg: calendar needs a url to ics file, github needs a link to the git folder, ...',
  })
  eventProviderInfo: Record<string, string>;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    type: Number,
    description: 'Order in which the timelines are displayed',
    default: 0,
  })
  order: number;
}
