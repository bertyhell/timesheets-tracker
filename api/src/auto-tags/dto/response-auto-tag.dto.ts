import { IsArray, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AutoTagCondition,
  BooleanOperator,
  ConditionOperator,
  ConditionVariable,
  TagName,
} from '../../types/types';
import { TagNameDto } from '../../tag-names/dto/response-tag-name.dto';

export class AutoTagConditionDto {
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
    type: String,
    description: 'Variable to check',
    default: ConditionVariable.programName,
    enum: ConditionOperator,
  })
  variable: ConditionVariable | null;

  @IsEnum(ConditionOperator)
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Operator of the condition',
    default: 'OR',
    enum: ConditionOperator,
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

export class AutoTagDto {
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
