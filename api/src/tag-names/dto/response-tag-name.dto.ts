import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { type TagName } from '../../types/types';

export class TagNameDto implements TagName {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Id of the tag',
    default: undefined,
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Name of the tag',
    default: undefined,
  })
  title: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Timesheet code for this tag (optional)',
    default: undefined,
  })
  code: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Hex code of the color to give tags with this tag name',
    default: undefined,
  })
  color: string;
}
