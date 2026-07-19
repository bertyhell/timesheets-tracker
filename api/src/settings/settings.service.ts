import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { DatabaseService } from '../database/database.service';
import { SettingsResponseDto } from './dto/settings-response.dto';
import { SettingDto } from './dto/setting.dto';
import {
  DeleteEventsAfterDto,
  DeleteEventsAfterPreviewDto,
  UpsertDeleteEventsAfterDto,
} from './dto/delete-events-after.dto';
import { SettingKey } from './settings-key.enum';
import { DeleteEventsAfterUnit } from './delete-events-after-unit.enum';
import { findSettingByKey } from './queries/findSettingByKey';
import { upsertSetting } from './queries/upsertSetting';
import { deleteSettingByKey } from './queries/deleteSettingByKey';
import { computeDeleteEventsCutoff } from './helpers/compute-delete-events-cutoff.helper';

@Injectable()
export class SettingsService {
  constructor(private readonly databaseService: DatabaseService) {}

  getSettings(): SettingsResponseDto {
    return { databasePath: this.databaseService.databasePath };
  }

  getSettingByKey(key: string): SettingDto | null {
    const row = findSettingByKey(this.databaseService.getDb(), { key });
    return row ?? null;
  }

  setSettingByKey(key: string, value: string): SettingDto {
    const db = this.databaseService.getDb();
    upsertSetting(db, { key, value });
    return findSettingByKey(db, { key }) as SettingDto;
  }

  getDeleteEventsAfter(): DeleteEventsAfterDto {
    const { numeric, unit } = this.readDeleteEventsAfterSettings();
    return {
      numeric,
      unit,
      cutoffDate: numeric && unit ? computeDeleteEventsCutoff(numeric, unit).toISOString() : null,
    };
  }

  setDeleteEventsAfter(dto: UpsertDeleteEventsAfterDto): DeleteEventsAfterDto {
    const db = this.databaseService.getDb();
    upsertSetting(db, { key: SettingKey.DeleteEventsAfterNumeric, value: String(dto.numeric) });
    upsertSetting(db, { key: SettingKey.DeleteEventsAfterUnit, value: dto.unit });
    return this.getDeleteEventsAfter();
  }

  clearDeleteEventsAfter(): DeleteEventsAfterDto {
    const db = this.databaseService.getDb();
    deleteSettingByKey(db, { key: SettingKey.DeleteEventsAfterNumeric });
    deleteSettingByKey(db, { key: SettingKey.DeleteEventsAfterUnit });
    return this.getDeleteEventsAfter();
  }

  /**
   * Computes the cutoff date for a not-yet-saved numeric/unit combination,
   * so the UI can show it live as the user makes a selection.
   */
  previewDeleteEventsAfter(numericRaw?: string, unitRaw?: string): DeleteEventsAfterPreviewDto {
    const numeric = numericRaw ? Number(numericRaw) : NaN;
    const unit = unitRaw as DeleteEventsAfterUnit;

    if (!numeric || Number.isNaN(numeric) || numeric <= 0 || !Object.values(DeleteEventsAfterUnit).includes(unit)) {
      return { cutoffDate: null };
    }

    return { cutoffDate: computeDeleteEventsCutoff(numeric, unit).toISOString() };
  }

  /**
   * Returns the cutoff date events should be purged before, or null if the
   * delete-events-after setting hasn't been configured yet.
   */
  getDeleteEventsBeforeDate(): Date | null {
    const { numeric, unit } = this.readDeleteEventsAfterSettings();
    if (!numeric || !unit) return null;
    return computeDeleteEventsCutoff(numeric, unit);
  }

  private readDeleteEventsAfterSettings(): {
    numeric: number | null;
    unit: DeleteEventsAfterUnit | null;
  } {
    const db = this.databaseService.getDb();
    const numericRow = findSettingByKey(db, { key: SettingKey.DeleteEventsAfterNumeric });
    const unitRow = findSettingByKey(db, { key: SettingKey.DeleteEventsAfterUnit });

    const numeric = numericRow?.value ? Number(numericRow.value) : null;
    const unit = (unitRow?.value as DeleteEventsAfterUnit) ?? null;

    return { numeric: numeric && !Number.isNaN(numeric) ? numeric : null, unit };
  }

  async switchDatabasePath(newPath: string): Promise<SettingsResponseDto> {
    if (!fs.existsSync(newPath)) {
      throw new NotFoundException(`Database file not found: ${newPath}`);
    }
    this.writeConfig({ databasePath: newPath });
    await this.databaseService.switchDatabase(newPath);
    return { databasePath: newPath };
  }

  async moveDatabaseFile(newPath: string): Promise<SettingsResponseDto> {
    const currentPath = this.databaseService.databasePath;
    if (currentPath === newPath) {
      throw new BadRequestException('New path must differ from the current database path');
    }
    fs.copyFileSync(currentPath, newPath);
    return this.switchDatabasePath(newPath);
  }

  openDatabaseFolder(): void {
    const folder = path.dirname(this.databaseService.databasePath);
    const platform = process.platform;
    if (platform === 'darwin') {
      spawn('open', [folder], { detached: true, stdio: 'ignore' }).unref();
    } else if (platform === 'win32') {
      spawn('explorer', [folder], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [folder], { detached: true, stdio: 'ignore' }).unref();
    }
  }

  private writeConfig(config: { databasePath: string }): void {
    fs.writeFileSync(this.databaseService.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }
}
