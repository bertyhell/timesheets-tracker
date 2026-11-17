import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DatabaseBackupDto {
  @ApiProperty({
    type: String,
    description: 'Identifier of the backup, which is also its file name',
  })
  id: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Short label given when the backup was made, slugified',
  })
  label: string | null;

  @ApiProperty({ type: String, description: 'When the backup was made, ISO format' })
  createdAt: string;

  @ApiProperty({ type: Number, description: 'Size of the backup file in bytes' })
  sizeBytes: number;

  @ApiProperty({ type: String, description: 'Absolute path of the backup file' })
  filePath: string;
}

export class CreateDatabaseBackupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({
    type: String,
    description: 'Optional short label to recognise the backup by, eg: "before cleanup"',
  })
  label?: string;
}

export class RestoreDatabaseBackupResultDto {
  @ApiProperty({ type: DatabaseBackupDto, description: 'The backup that was restored' })
  restoredFrom: DatabaseBackupDto;

  @ApiProperty({
    type: DatabaseBackupDto,
    description: 'Backup of the state right before the restore, so the restore can be undone',
  })
  safetyBackup: DatabaseBackupDto;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Number of rows restored per table',
  })
  restoredRowCounts: Record<string, number>;
}
