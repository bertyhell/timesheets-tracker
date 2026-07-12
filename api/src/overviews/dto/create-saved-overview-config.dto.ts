import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { DateRangeMode, OverviewSourceType } from '../../types/types';

export class CreateSavedOverviewConfigDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of this overview, shown in the Overviews nav',
  })
  name: string;

  @IsEnum(DateRangeMode)
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Which date range this overview loads by default',
    enum: DateRangeMode,
    enumName: 'DateRangeMode',
  })
  dateRangeMode: DateRangeMode;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Explicit range start, only used when dateRangeMode is "custom"',
    required: false,
    nullable: true,
  })
  customStartedAt?: string | null;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Explicit range end, only used when dateRangeMode is "custom"',
    required: false,
    nullable: true,
  })
  customEndedAt?: string | null;

  @IsArray()
  @IsEnum(OverviewSourceType, { each: true })
  @ApiProperty({
    type: String,
    isArray: true,
    description: 'Which database-backed timeline types are included in this overview',
    enum: OverviewSourceType,
    enumName: 'OverviewSourceType',
  })
  sourceTypes: OverviewSourceType[];

  @IsObject()
  @ApiProperty({
    type: Object,
    description:
      'react-pivottable state (rows, cols, vals, aggregatorName, rendererName, valueFilter, sorters, derivedAttributes)',
  })
  pivotState: Record<string, any>;
}
