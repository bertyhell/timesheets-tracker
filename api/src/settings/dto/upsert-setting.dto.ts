import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString } from 'class-validator';

export class UpsertSettingDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Setting value' })
  value: string;
}
