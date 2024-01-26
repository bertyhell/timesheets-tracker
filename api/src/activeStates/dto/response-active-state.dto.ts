import { IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActiveState } from '../../types/types';

export class ResponseActiveStateDto implements ActiveState {
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional({
    type: String,
    description: 'id of the activity',
    default: undefined,
  })
  id: string;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'If the operating system is currently being used by the user (true) or the user is idle (false)',
    default: undefined,
  })
  isActive: boolean;

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
