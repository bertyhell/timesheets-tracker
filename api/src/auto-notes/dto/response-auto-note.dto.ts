import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { type ConditionVariable, type AutoNote } from '../../types/types';

export class AutoNoteDto implements AutoNote {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the autoNote rule',
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the autoNote',
  })
  title: string;

  @IsString()
  @Type(() => String)
  @IsArray()
  @ApiProperty({
    type: String,
    isArray: true,
    description:
      'ids of the tags this autoNote is linked to. Value is semicolon separated. null for all tags',
  })
  tagNameIds: string[] | null;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description:
      'What the content of the autoNote should be equal to. eg: programName, ProgramTitle, websiteTitle, websiteUrl',
  })
  variable: ConditionVariable;

  @IsString()
  @Type(() => String)
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    required: false,
    description:
      'The regex to extract some part of the above variable. null to take the whole variable',
  })
  extractRegex: string | null;

  @IsString()
  @Type(() => String)
  @IsOptional()
  @ApiPropertyOptional({
    type: String,
    required: false,
    description:
      'The regex match group to keep. eg: "(phone|cell): ([0-9]+)" => $2 would keep the phone number digits',
  })
  extractRegexReplacement: string | null;
}
