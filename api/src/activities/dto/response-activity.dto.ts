import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { type Activity } from '../../types/types';

export class ResponseActivityDto implements Activity {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'id of the activity',
    default: undefined,
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Name of the program that is open',
    default: undefined,
  })
  programName: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Title of the active window',
    default: undefined,
  })
  windowTitle: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'Start time in ISO format',
    default: undefined,
  })
  startedAt: string;

  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'End time in ISO format',
    default: undefined,
  })
  endedAt: string;
}
