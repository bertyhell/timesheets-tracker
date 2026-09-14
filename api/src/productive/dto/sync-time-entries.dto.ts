import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class SyncTimeEntryDto {
  @IsString()
  @ApiProperty({
    type: String,
    description:
      'Client-generated id, echoed back on the result so each outcome can be matched to its entry',
  })
  id: string;

  @IsString()
  @ApiProperty({ type: String, description: 'Productive service ID to track time on' })
  serviceId: string;

  @IsInt()
  @Min(0)
  @ApiProperty({ type: Number, description: 'Duration of the entry in minutes' })
  minutes: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ type: String, required: false, description: 'Note / description for the entry' })
  note?: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    type: String,
    isArray: true,
    description:
      'Tag names whose time this entry covers. Entries that merge several tags report their outcome to each of them.',
  })
  tagNameIds: string[];
}

export class SyncTimeEntriesDto {
  @IsString()
  @ApiProperty({ type: String, description: 'Date to track the time on (yyyy-MM-dd)' })
  date: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncTimeEntryDto)
  @ApiProperty({ type: SyncTimeEntryDto, isArray: true, description: 'Time entries to create' })
  entries: SyncTimeEntryDto[];
}

export class SyncEntryResultDto {
  @ApiProperty({ type: String, description: 'The id supplied on the matching request entry' })
  id: string;

  @ApiProperty({
    enum: ['created', 'failed'],
    description: 'Whether Productive accepted this entry',
  })
  status: 'created' | 'failed';

  @ApiProperty({
    type: String,
    required: false,
    description: "Productive's reason for rejecting the entry",
  })
  error?: string;
}

export class SyncTimeEntriesResultDto {
  @ApiProperty({ type: Number, description: 'Number of time entries created in Productive' })
  created: number;

  @ApiProperty({ type: Number, description: 'Number of time entries Productive rejected' })
  failed: number;

  @ApiProperty({
    type: SyncEntryResultDto,
    isArray: true,
    description: 'Per-entry outcome, in request order',
  })
  results: SyncEntryResultDto[];
}
