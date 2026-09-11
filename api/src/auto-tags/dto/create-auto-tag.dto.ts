import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { type AutoTagCondition } from '../../types/types';
import { AutoTagConditionDto } from './response-auto-tag.dto';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateAutoTagDto {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Id of the tagName',
    default: undefined,
  })
  tagNameId: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Name of the tagName',
    default: undefined,
  })
  title: string;

  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({
    type: Number,
    description: 'Priority order in which the auto tags are checked',
    default: 0,
  })
  priority: number;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: AutoTagConditionDto,
    description: 'Conditions for the auto tag',
    isArray: true,
    default: [],
  })
  conditions: AutoTagCondition[];

  @IsOptional()
  @IsString()
  @Matches(DATE_ONLY_REGEX)
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'First day (yyyy-MM-dd, inclusive) on which the auto tag applies. Omit or null for no start bound.',
    default: null,
  })
  activeFrom?: string | null;

  @IsOptional()
  @IsString()
  @Matches(DATE_ONLY_REGEX)
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description:
      'Last day (yyyy-MM-dd, inclusive) on which the auto tag applies. Omit or null for no end bound.',
    default: null,
  })
  activeUntil?: string | null;
}
