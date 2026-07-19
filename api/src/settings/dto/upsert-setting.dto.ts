import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertSettingDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Setting value' })
  value: string;
}
