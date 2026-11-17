import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { DatabaseService } from '../database/database.service';
import { DatabaseBackupDto, RestoreDatabaseBackupResultDto } from './dto/database-backup.dto';

/**
 * The tables a restore puts back, in insert order (parents before children).
 *
 * These are the tag and rule tables, the ones the MCP server and the manage screens edit. The
 * event tables (programs, websites, activeStates) are deliberately left alone: a restore must not
 * throw away the activity that was recorded after the backup was taken.
 */
export const RESTORABLE_TABLES = ['tagNames', 'tags', 'autoTags', 'autoNotes'] as const;

/** Tables with a foreign key to tagNames. */
const TABLES_REFERENCING_TAG_NAMES: readonly string[] = ['tags', 'autoTags'];

const BACKUP_FOLDER_NAME = 'timesheets-tracker-backups';
const BACKUP_FILE_PREFIX = 'backup-';
const BACKUP_FILE_EXTENSION = '.sqlite3';
const LABEL_SEPARATOR = '--';
const MAX_LABEL_LENGTH = 60;

/**
 * Only names this service generated are accepted back, which keeps a backup id from ever
 * pointing outside the backup folder.
 */
const BACKUP_ID_REGEX =
  /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z(--[a-z0-9-]+)?\.sqlite3$/;

/** Schema name the backup is attached under while restoring. */
const RESTORE_SOURCE = 'restore_source';

@Injectable()
export class DatabaseBackupsService {
  private readonly logger = new Logger(DatabaseBackupsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /** Backups live next to the database they were taken from, so moving the database moves them. */
  get backupFolder(): string {
    return path.join(path.dirname(this.databaseService.databasePath), BACKUP_FOLDER_NAME);
  }

  /**
   * Writes a consistent copy of the whole database.
   * VACUUM INTO is used rather than a file copy because it reads through the open connection, so
   * the copy cannot catch a half-written page.
   */
  createBackup(label?: string): DatabaseBackupDto {
    fs.mkdirSync(this.backupFolder, { recursive: true });

    const slug = slugify(label);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id =
      BACKUP_FILE_PREFIX + timestamp + (slug ? LABEL_SEPARATOR + slug : '') + BACKUP_FILE_EXTENSION;
    const filePath = path.join(this.backupFolder, id);

    this.databaseService.getDb().prepare('VACUUM INTO ?').run(filePath);
    this.logger.log(`Database backup written to ${filePath}`);

    return this.describe(id);
  }

  /** Newest first. */
  listBackups(): DatabaseBackupDto[] {
    if (!fs.existsSync(this.backupFolder)) {
      return [];
    }
    return fs
      .readdirSync(this.backupFolder)
      .filter((fileName) => BACKUP_ID_REGEX.test(fileName))
      .map((fileName) => this.describe(fileName))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  deleteBackup(id: string): void {
    fs.unlinkSync(this.resolveBackupPath(id));
  }

  /**
   * Puts the tag names, tags, auto tags and auto notes back to how they were in the backup.
   * Everything else, most importantly the recorded events, keeps its current state.
   *
   * A backup of the current state is taken first, so a restore can itself be undone.
   */
  restoreBackup(id: string): RestoreDatabaseBackupResultDto {
    const backupPath = this.resolveBackupPath(id);
    const safetyBackup = this.createBackup('before-restore');

    const db = this.databaseService.getDb();
    db.prepare(`ATTACH DATABASE ? AS ${RESTORE_SOURCE}`).run(backupPath);
    try {
      const restoredRowCounts: Record<string, number> = {};
      db.exec('BEGIN IMMEDIATE');
      try {
        // Children first, so the tagNames delete has nothing left to cascade into.
        for (const table of [...RESTORABLE_TABLES].reverse()) {
          db.exec(`DELETE FROM main."${table}"`);
        }
        for (const table of RESTORABLE_TABLES) {
          restoredRowCounts[table] = this.copyTableFromBackup(table);
        }
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      this.logger.log(`Restored ${RESTORABLE_TABLES.join(', ')} from ${backupPath}`);
      return {
        restoredFrom: this.describe(id),
        safetyBackup,
        restoredRowCounts,
      };
    } finally {
      db.exec(`DETACH DATABASE ${RESTORE_SOURCE}`);
    }
  }

  /**
   * Copies one table over from the attached backup. Only the columns both sides know about are
   * copied, so a backup taken before a migration added a column still restores (the new column
   * gets its default).
   */
  // The SQL here is built from identifiers, never from input: table and schema names are the
  // constants above, and only column names that also exist in the live schema are used.
  private copyTableFromBackup(table: (typeof RESTORABLE_TABLES)[number]): number {
    const db = this.databaseService.getDb();
    const backupColumns = this.getColumns(RESTORE_SOURCE, table);
    if (!backupColumns.length) {
      // The backup predates this table: restoring means "there were none".
      return 0;
    }
    const currentColumns = new Set(this.getColumns('main', table));
    const columns = backupColumns
      .filter((column) => currentColumns.has(column))
      .map((column) => `"${column}"`)
      .join(', ');
    // A tag or auto tag whose tag name is gone (possible in databases written while foreign keys
    // were not enforced) would fail the whole restore on the foreign key, so such rows are left out.
    const onlyWithTagName = TABLES_REFERENCING_TAG_NAMES.includes(table)
      ? ` WHERE "tagNameId" IN (SELECT "id" FROM main."tagNames")`
      : '';
    const result = db
      .prepare(
        `INSERT INTO main."${table}" (${columns}) SELECT ${columns} FROM ${RESTORE_SOURCE}."${table}"${onlyWithTagName}`
      )
      .run();
    return Number(result.changes);
  }

  private getColumns(schema: string, table: string): string[] {
    const rows = this.databaseService
      .getDb()
      .prepare(`PRAGMA ${schema}.table_info("${table}")`)
      .all() as { name: string }[];
    return rows.map((row) => row.name);
  }

  private resolveBackupPath(id: string): string {
    if (!BACKUP_ID_REGEX.test(id)) {
      throw new BadRequestException(`Invalid backup id: ${id}`);
    }
    const filePath = path.join(this.backupFolder, id);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Backup not found: ${id}`);
    }
    return filePath;
  }

  private describe(id: string): DatabaseBackupDto {
    const filePath = path.join(this.backupFolder, id);
    const withoutExtension = id.slice(BACKUP_FILE_PREFIX.length, -BACKUP_FILE_EXTENSION.length);
    const [rawTimestamp, label] = withoutExtension.split(LABEL_SEPARATOR);
    // 2026-11-17T18-44-00-123Z -> 2026-11-17T18:44:00.123Z
    const createdAt = rawTimestamp.replace(
      /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
      '$1T$2:$3:$4.$5Z'
    );
    return {
      id,
      label: label ?? null,
      createdAt,
      sizeBytes: fs.statSync(filePath).size,
      filePath,
    };
  }
}

function slugify(label: string | undefined): string {
  return (label ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LABEL_LENGTH)
    .replace(/-+$/g, '');
}
