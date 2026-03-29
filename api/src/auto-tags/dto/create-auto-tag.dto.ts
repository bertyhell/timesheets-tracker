import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { type AutoTagCondition } from '../../types/types';
import { AutoTagConditionDto } from './response-auto-tag.dto';

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
}
