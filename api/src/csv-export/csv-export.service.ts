import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { findSettingByKey } from '../settings/queries/findSettingByKey';
import { upsertSetting } from '../settings/queries/upsertSetting';
import { SettingKey } from '../settings/settings-key.enum';
import { CsvColumnValue, CsvDelimiter, CsvValueFormat } from '../types/types';
import { CsvExportConfigDto } from './dto/csv-export-config.dto';
import { findCsvExportColumns } from './queries/findCsvExportColumns';
import { replaceCsvExportColumns } from './queries/replaceCsvExportColumns';

/**
 * The Excel CSV integration is a destination, not an event source: it has no credentials and calls
 * no remote API, so its `integrations` row exists only so the Integrations screen can list, edit
 * and remove it alongside the others.
 */
export const CSV_EXPORT_INTEGRATION_TYPE = 'excel-csv';

const DEFAULT_DELIMITER = CsvDelimiter.Comma;
const DEFAULT_INCLUDE_HEADER = true;
const DEFAULT_FILE_NAME_PATTERN = 'timesheet-{date}';

@Injectable()
export class CsvExportService {
  constructor(private readonly databaseService: DatabaseService) {}

  getConfig(): CsvExportConfigDto {
    const db = this.databaseService.getDb();

    const delimiter = findSettingByKey(db, { key: SettingKey.CsvExportDelimiter })?.value;
    const includeHeader = findSettingByKey(db, { key: SettingKey.CsvExportIncludeHeader })?.value;
    const fileNamePattern = findSettingByKey(db, {
      key: SettingKey.CsvExportFileNamePattern,
    })?.value;

    return {
      delimiter: this.parseDelimiter(delimiter),
      // Anything that was never written reads as the default, so a fresh install exports a normal
      // headered file rather than a bare one.
      includeHeader:
        includeHeader === null || includeHeader === undefined
          ? DEFAULT_INCLUDE_HEADER
          : includeHeader === 'true',
      fileNamePattern: fileNamePattern || DEFAULT_FILE_NAME_PATTERN,
      columns: findCsvExportColumns(db).map((column) => ({
        id: column.id,
        header: column.header,
        value: column.value as CsvColumnValue,
        format: column.format as CsvValueFormat | '',
        staticText: column.staticText,
      })),
    };
  }

  saveConfig(dto: CsvExportConfigDto): CsvExportConfigDto {
    const db = this.databaseService.getDb();

    upsertSetting(db, { key: SettingKey.CsvExportDelimiter, value: dto.delimiter });
    upsertSetting(db, {
      key: SettingKey.CsvExportIncludeHeader,
      value: String(dto.includeHeader),
    });
    upsertSetting(db, {
      key: SettingKey.CsvExportFileNamePattern,
      value: dto.fileNamePattern || DEFAULT_FILE_NAME_PATTERN,
    });

    replaceCsvExportColumns(
      db,
      dto.columns.map((column, index) => ({
        // A column added in the browser has no id until it is saved, so one is minted here rather
        // than trusting the client to produce a unique one.
        id: column.id || randomUUID(),
        header: column.header,
        value: column.value,
        format: column.format ?? '',
        staticText: column.staticText ?? '',
        visualOrder: index,
      }))
    );

    return this.getConfig();
  }

  /** Falls back to a comma for an unset or unrecognised stored value. */
  private parseDelimiter(stored: string | null | undefined): CsvDelimiter {
    const known = Object.values(CsvDelimiter) as string[];
    return stored && known.includes(stored) ? (stored as CsvDelimiter) : DEFAULT_DELIMITER;
  }
}
