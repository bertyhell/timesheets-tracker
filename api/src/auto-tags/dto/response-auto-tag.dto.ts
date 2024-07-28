import { IsArray, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  type AutoTag,
  type AutoTagCondition,
  type BooleanOperator,
  ConditionOperator,
  ConditionVariable,
  type TagName,
} from '../../types/types';
import { TagNameDto } from '../../tag-names/dto/response-tag-name.dto';

export class AutoTagConditionDto implements AutoTagCondition {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Conditions for the auto tag',
    default: '[]',
  })
  booleanOperator: BooleanOperator;

  @IsEnum(ConditionVariable)
  @Type(() => String)
  @ApiPropertyOptional({
    type: ConditionVariable,
    description: 'Variable to check',
    default: ConditionVariable.programName,
    enum: ConditionVariable,
    nullable: true,
  })
  variable: ConditionVariable | null;

  @IsEnum(ConditionOperator)
  @Type(() => String)
  @ApiPropertyOptional({
    type: ConditionOperator,
    description: 'Operator of the condition',
    default: 'OR',
    enum: ConditionOperator,
    nullable: true,
  })
  operator: ConditionOperator | null;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Piece of text that the variable has to contain',
  })
  value: string;
}

export class AutoTagDto implements AutoTag {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Id of the auto tag',
    default: undefined,
  })
  id: string;

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
  name: string;

  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({
    type: Number,
    description:
      'Priority order in which the auto tags are checked. 0 is checked first, 1 second, ...',
    default: 0,
  })
  priority: number;

  @IsArray()
  @Type(() => String)
  @ApiPropertyOptional({
    type: AutoTagConditionDto,
    isArray: true,
    description: 'Conditions for the auto tag',
    default: '[]',
  })
  conditions: AutoTagCondition[];

  @IsObject()
  @Type(() => TagNameDto)
  @ApiPropertyOptional({
    type: String,
    description: 'The tag name linked to this auto tag',
    default: undefined,
  })
  tagName: TagName;
}

export class AutoTagCountDto {
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({
    type: Number,
    description: 'Number of auto tags that exist',
  })
  count: number;
}
