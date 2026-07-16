import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class SyncTimeEntryDto {
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

export class SyncTimeEntriesResultDto {
  @ApiProperty({ type: Number, description: 'Number of time entries created in Productive' })
  created: number;
}
