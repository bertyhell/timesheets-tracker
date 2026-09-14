import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CsvColumnValue, CsvDelimiter, CsvValueFormat } from '../../types/types';

export class CsvExportColumnDto {
  @IsString()
  @Type(() => String)
  @ApiProperty({ type: String, description: 'Uuid of the column', required: true })
  id: string;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Column name, written into the header row',
    example: 'Hours',
    required: true,
  })
  header: string;

  @IsEnum(CsvColumnValue)
  @ApiProperty({
    enum: CsvColumnValue,
    description: 'Which part of the tag goes in this column',
    required: true,
  })
  value: CsvColumnValue;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    enum: [...Object.values(CsvValueFormat), ''],
    description: 'How the value is rendered. Empty for the text values, which have no format.',
    example: 'duration:HH:mm',
    required: false,
  })
  format: CsvValueFormat | '';

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'Constant written in every row, used only when value is "staticText"',
    required: false,
  })
  staticText: string;
}

export class CsvExportConfigDto {
  @IsEnum(CsvDelimiter)
  @ApiProperty({
    enum: CsvDelimiter,
    description: 'Field separator of the produced file',
    required: true,
  })
  delimiter: CsvDelimiter;

  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: 'Whether to write the column names as a first row',
    required: true,
  })
  includeHeader: boolean;

  @IsString()
  @Type(() => String)
  @ApiProperty({
    type: String,
    description: 'File name suggested when saving. "{date}" is replaced by the exported day.',
    example: 'timesheet-{date}',
    required: true,
  })
  fileNamePattern: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvExportColumnDto)
  @ApiProperty({
    type: [CsvExportColumnDto],
    description: 'The columns of the file, in order from left to right',
    required: true,
  })
  columns: CsvExportColumnDto[];
}
