import { IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { type ActiveState } from '../../types/types';

export class ResponseActiveStateDto implements ActiveState {
  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'id of the activity',
  })
  id: string;

  @IsBoolean()
  @Type(() => Boolean)
  @ApiProperty({
    type: Boolean,
    description:
      'If the operating system is currently being used by the user (true) or the user is idle (false)',
  })
  isActive: boolean;

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
