import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SwitchDatabaseDto {
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Absolute path to the target SQLite database file' })
  path: string;
}
