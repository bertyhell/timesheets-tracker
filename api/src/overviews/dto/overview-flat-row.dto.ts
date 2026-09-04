import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { type OverviewFlatRow, OverviewSourceType } from '../../types/types';

export class OverviewFlatRowDto implements OverviewFlatRow {
  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Id of the underlying source row (tag/program/website/active-state)' })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Display label: tag title, program name, website title, or Active/Inactive',
  })
  category: string;

  @IsEnum(OverviewSourceType)
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Which database-backed timeline type this row came from',
    enum: OverviewSourceType,
    enumName: 'OverviewSourceType',
  })
  sourceType: OverviewSourceType;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'ISO timestamp the underlying event started' })
  startedAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'ISO timestamp the underlying event ended' })
  endedAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: "Day bucket, 'yyyy-MM-dd'" })
  date: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: "Week bucket, e.g. \"2026-W07\"" })
  week: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: "Month bucket, 'yyyy-MM'" })
  month: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({ type: Number, description: 'Duration of the event in hours' })
  durationHours: number;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Domain (hostname) parsed from the website URL; only present for Website-sourced rows',
    default: undefined,
  })
  websiteDomain?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Title of the website page; only present for Website-sourced rows. Same value as category for Website rows, exposed under an explicit name for discoverability.',
    default: undefined,
  })
  websiteTitle?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Title of the tag name (tag.tagName.title); only present for Tag-sourced rows. Same value as category for Tag rows, exposed under an explicit name for discoverability.',
    default: undefined,
  })
  tagName?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Timesheet billing code of the tag; only present for Tag-sourced rows',
    default: undefined,
  })
  tagCode?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description:
      'Configured color of the tag, so charts can use the same colors as the timelines; only present for Tag-sourced rows',
    default: undefined,
  })
  tagColor?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Name of the program; only present for Program-sourced rows. Same value as category for Program rows, exposed under an explicit name for discoverability.',
    default: undefined,
  })
  programName?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Window title of the program; only present for Program-sourced rows',
    default: undefined,
  })
  windowTitle?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: "'Active' or 'Inactive'; only present for ActiveState-sourced rows. Same value as category for ActiveState rows, exposed under an explicit name for discoverability.",
    default: undefined,
  })
  activeState?: string;
}
