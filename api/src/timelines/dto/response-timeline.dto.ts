import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
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

export class GitCommitEventProviderInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Absolute path to the folder that contains git repositories to scan for commits',
    example: '/home/user/projects',
  })
  folderPath: string;
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
    oneOf: [
      { $ref: getSchemaPath(CalendarEventProviderInfoDto) },
      { $ref: getSchemaPath(GitCommitEventProviderInfoDto) },
    ],
    nullable: true,
  })
  eventProviderInfo: null | CalendarEventProviderInfoDto | GitCommitEventProviderInfoDto;

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
    description: 'Visual order in which the timelines are displayed',
  })
  visualOrder: number;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Hex color code for this timeline',
    nullable: true,
    required: false,
  })
  color: string | null;
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
