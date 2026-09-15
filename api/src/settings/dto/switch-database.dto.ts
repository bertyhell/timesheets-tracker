import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SwitchDatabaseDto {
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Absolute path to the target SQLite database file' })
  path: string;
}
