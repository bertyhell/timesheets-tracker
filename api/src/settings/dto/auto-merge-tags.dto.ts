import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Effective value when the setting has never been saved (the historical hardcoded threshold). */
export const DEFAULT_AUTO_MERGE_TAGS_MINUTES = 5;
export const MAX_AUTO_MERGE_TAGS_MINUTES = 8 * 60;

export class AutoMergeTagsDto {
  @ApiProperty({
    type: Number,
    description: 'Auto tags resolving to the same tag are merged when less than this many minutes apart. 0 disables merging.',
  })
  minutes: number;
}

export class UpsertAutoMergeTagsDto {
  @IsInt()
  @Min(0)
  @Max(MAX_AUTO_MERGE_TAGS_MINUTES)
  @Type(() => Number)
  @ApiProperty({
    type: Number,
    description: 'Merge gap in minutes, between 0 (no merge) and 480 (8 hours)',
  })
  minutes: number;
}
