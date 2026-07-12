import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsString } from 'class-validator';
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
}
