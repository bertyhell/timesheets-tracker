import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ConditionVariable } from '../../types/types';

export class CreateAutoNoteDto {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Name of the autoNote',
  })
  title: string;

  @IsString()
  @Type(() => String)
  @IsArray()
  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description:
      'ids of the tags this autoNote is linked to. Value is semicolon separated. null for all tags',
    default: undefined,
  })
  tagNameIds: string[] | null;

  @IsEnum(ConditionVariable)
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description:
      'What the content of the autoNote should be equal to. eg: programName, ProgramTitle, websiteTitle, websiteUrl',
  })
  variable: ConditionVariable;

  @IsString()
  @Type(() => String)
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
    description:
      'The regex to extract some part of the above variable. (.*) to take the whole variable. eg: jira.com/issue/(ABC-[0-9]+)',
  })
  extractRegex: string;

  @IsString()
  @Type(() => String)
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
    description: 'The regex match group to keep. eg: $1, empty string to take the whole variable',
  })
  extractRegexReplacement: string;
}
