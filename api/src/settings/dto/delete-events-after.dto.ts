import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DeleteEventsAfterUnit } from '../delete-events-after-unit.enum';

export class DeleteEventsAfterDto {
  @ApiProperty({ type: Number, nullable: true, description: 'Numeric amount, e.g. 6' })
  numeric: number | null;

  @ApiProperty({ enum: DeleteEventsAfterUnit, nullable: true, description: 'Unit for the numeric amount' })
  unit: DeleteEventsAfterUnit | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Computed cutoff date: events older than this will be deleted',
  })
  cutoffDate: string | null;
}

export class UpsertDeleteEventsAfterDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({ type: Number, description: 'Numeric amount, e.g. 6' })
  numeric: number;

  @IsEnum(DeleteEventsAfterUnit)
  @ApiProperty({ enum: DeleteEventsAfterUnit, description: 'Unit for the numeric amount' })
  unit: DeleteEventsAfterUnit;
}

export class DeleteEventsAfterPreviewDto {
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Computed cutoff date for the given (not yet saved) numeric/unit combination',
  })
  cutoffDate: string | null;
}
