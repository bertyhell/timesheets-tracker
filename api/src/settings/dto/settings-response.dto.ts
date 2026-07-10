import { ApiProperty } from '@nestjs/swagger';

export class SettingsResponseDto {
  @ApiProperty({ type: String, description: 'Absolute path to the SQLite database file' })
  databasePath: string;
}
