import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { type Activity } from '../../types/types';

export class ResponseActivityDto implements Activity {
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
}
