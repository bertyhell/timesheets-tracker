import { ApiProperty } from '@nestjs/swagger';

export type SyncStatusValue = 'synced' | 'partial' | 'failed';

export class SyncStatusEntryDto {
  @ApiProperty({ type: String, description: 'Productive service the entry was booked on' })
  serviceId: string;

  @ApiProperty({ type: String, description: 'Note the entry was booked under, empty when it had none' })
  note: string;

  @ApiProperty({ type: Number, description: 'Duration of the entry in minutes' })
  minutes: number;

  @ApiProperty({ enum: ['created', 'failed'], description: 'Whether Productive accepted this entry' })
  status: 'created' | 'failed';

  @ApiProperty({ type: String, required: false, description: "Productive's reason for rejecting the entry" })
  error?: string;
}

export class SyncStatusDto {
  @ApiProperty({ type: String, description: 'Tag name the status belongs to' })
  tagNameId: string;

  @ApiProperty({
    enum: ['synced', 'partial', 'failed'],
    description: 'synced = every entry landed, partial = some did, failed = none did',
  })
  status: SyncStatusValue;

  @ApiProperty({ type: SyncStatusEntryDto, isArray: true, description: 'The individual entries of the last attempt' })
  entries: SyncStatusEntryDto[];

  @ApiProperty({ type: String, description: 'When the last attempt ran (ISO 8601)' })
  syncedAt: string;
}
