import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { TimelineType } from '../../types/types';

export class ActiveStateEventInfoDto {
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: 'Whether the user was active during this period',
    example: true,
    required: true,
  })
  isActive: boolean;
}

export class ProgramEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the program that was active',
    example: 'Visual Studio Code',
    required: true,
  })
  programName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the active window within the program',
    example: 'Visual Studio Code: file.js',
    required: true,
  })
  windowTitle: string;
}

export class CalendarEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Summary / title of the calendar event',
    example: 'Team standup',
    required: true,
  })
  summary: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Description of the calendar event',
    example: 'Daily sync with the team',
    required: true,
  })
  description: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Location of the calendar event',
    example: 'Conference room A',
    required: true,
  })
  location: string;

  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: 'Whether this is an all-day event',
    example: false,
    required: true,
  })
  allDay: boolean;
}

export class WebsiteEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'URL of the website that was visited',
    example: 'https://www.google.com',
    required: true,
  })
  websiteUrl: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the website that was visited',
    example: 'Google',
    required: true,
  })
  websiteTitle: string;
}

export class TagEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the tag name associated with this tag event',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  tagNameId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Display name of the tag',
    example: 'Development',
    required: true,
  })
  tagNameName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Color of the tag',
    example: '#FF5733',
    required: true,
  })
  tagNameColor: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Optional short code for the tag',
    example: 'DEV',
    required: false,
    nullable: true,
  })
  tagNameCode?: string;
}

export class AutoTagEventInfoDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the tag name associated with this tag event',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  tagNameId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Display name of the tag',
    example: 'Development',
    required: true,
  })
  tagNameName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Color of the tag',
    example: '#FF5733',
    required: true,
  })
  tagNameColor: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Optional short code for the tag',
    example: 'DEV',
    required: false,
    nullable: true,
  })
  tagNameCode?: string;
}

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
  @ApiProperty({
    description: 'Type-specific info for this event. Varies based on the timeline type.',
    oneOf: [
      { $ref: getSchemaPath(ActiveStateEventInfoDto) },
      { $ref: getSchemaPath(ProgramEventInfoDto) },
      { $ref: getSchemaPath(CalendarEventInfoDto) },
      { $ref: getSchemaPath(WebsiteEventInfoDto) },
      { $ref: getSchemaPath(TagEventInfoDto) },
      { $ref: getSchemaPath(AutoTagEventInfoDto) },
    ],
  })
  info:
    | ActiveStateEventInfoDto
    | ProgramEventInfoDto
    | CalendarEventInfoDto
    | WebsiteEventInfoDto
    | TagEventInfoDto
    | AutoTagEventInfoDto;

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
