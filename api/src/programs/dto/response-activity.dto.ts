import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { type Program } from '../../types/types';

export class ResponseProgramDto implements Program {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'id of the activity',
    default: undefined,
  })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Name of the program that is open',
  })
  programName: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Title of the active window',
  })
  windowTitle: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Start time in ISO format',
  })
  startedAt: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'End time in ISO format',
  })
  endedAt: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    required: false,
    description: 'Primary color of the program icon as a CSS hex string',
  })
  iconColor?: string;
}
