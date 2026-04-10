import { IsArray, IsEnum, IsNumber, IsObject, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    type: String,
    description: 'Conditions for the auto tag',
  })
  booleanOperator: BooleanOperator;

  @IsEnum(ConditionVariable)
  @Type(() => String)
  @ApiProperty({
    type: ConditionVariable,
    description: 'Variable to check',
    default: ConditionVariable.programName,
    enum: ConditionVariable,
    enumName: 'ConditionVariable',
  })
  variable: ConditionVariable;

  @IsEnum(ConditionOperator)
  @Type(() => String)
  @ApiProperty({
    type: ConditionOperator,
    description: 'Operator of the condition',
    default: 'OR',
    enum: ConditionOperator,
    enumName: 'ConditionOperator',
  })
  operator: ConditionOperator;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Piece of text that the variable has to contain',
  })
  value: string;
}

export class AutoTagDto implements AutoTag {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the auto tag',
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Id of the tagName',
  })
  tagNameId: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the tagName',
  })
  title: string;

  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    type: Number,
    description:
      'Priority order in which the auto tags are checked. 0 is checked first, 1 second, ...',
  })
  priority: number;

  @IsArray()
  @Type(() => String)
  @ApiProperty({
    type: AutoTagConditionDto,
    isArray: true,
    description: 'Conditions for the auto tag',
    default: '[]',
  })
  conditions: AutoTagCondition[];

  @IsObject()
  @Type(() => TagNameDto)
  @ApiProperty({
    type: TagNameDto,
    description: 'The tag name object linked to this auto tag',
  })
  tagName: TagName;
}

export class AutoTagCountDto {
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    type: Number,
    description: 'Number of auto tags that exist',
  })
  count: number;
}
