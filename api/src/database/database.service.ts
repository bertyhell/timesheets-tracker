import { Injectable, type OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromise from 'fs/promises';
import { DatabaseSync, StatementSync } from 'node:sqlite';
import { CustomError } from '../shared/CustomError';
import { SeedService } from '../seed/seed.service';
import { resolve } from 'node:path';
import { DbQueryParams } from './database.types';
import { resolveProjectPath } from '../shared/resolve-src-path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: DatabaseSync;
  private databasePath = path.resolve('./timesheets-tracker-database.sqlite3');
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly seedService: SeedService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('starting database module');
    this.logger.log('databasePath: ' + this.databasePath);
    this.db = new DatabaseSync(this.databasePath);
    this.logger.log('creating database tables');
    await this.createTables();
    this.logger.log('database module started successfully');

    const seedAtStartup = process.env.SEED_AT_STARTUP;
    if (seedAtStartup === 'true') {
      this.logger.log('SEED_AT_STARTUP is set, running seeders...');
      await Promise.all([
        this.seedService.seedTags(this.db),
        this.seedService.seedAutoTags(this.db),
        this.seedService.seedPrograms(this.db),
      ]);
      this.logger.log('Seeders completed successfully');
    }
  }

  private async getQueryFromFile(sqlFile: string): Promise<string> {
    const sqlFilePath = resolveProjectPath(sqlFile);
    const sqlQuery = (await fsPromise.readFile(sqlFilePath)).toString('utf-8');
    return sqlQuery.replace(/\s*[\r\n]\s*/g, ' ').trim();
  }

  public async query<TResult>(sqlFile: string, params?: DbQueryParams): Promise<TResult[]> {
    let sqlQuery: string | null = null;
    try {
      sqlQuery = await this.getQueryFromFile(sqlFile);
      const statement = this.db.prepare(sqlQuery);
      return statement.all(params as any) as TResult[];
    } catch (err) {
      const error = new CustomError('Failed to execute SQL query', err, {
        sqlFile,
        sqlQuery,
        params,
      });
      console.error(error);
      throw error;
    }
  }

  public async mutate(
    sqlFile: string,
    params?: DbQueryParams
  ): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    let sqlQuery: string | null = null;
    try {
      sqlQuery = await this.getQueryFromFile(sqlFile);
      const statement: StatementSync = this.db.prepare(sqlQuery);
      return statement.run(params as any) as { changes: number; lastInsertRowid: number | bigint };
    } catch (err) {
      throw new CustomError('Failed to execute SQL query', err, { sqlFile, sqlQuery, params });
    }
  }

  /**
   * Create database tables if they do not exist yet.
   * Uses db.exec() (not db.query()) because the SQL file contains
   * multiple statements and node:sqlite's prepare() only prepares the first one.
   */
  async createTables(): Promise<void> {
    const sqlFilePath = resolveProjectPath('./src/database/queries/create-database-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf-8');
    this.db.exec(sql);
    this.runMigrations();
  }

  /**
   * Runs all pending SQL migration files from the migrations folder.
   * Tracks executed migrations in an `executed_migrations` table so each file runs exactly once.
   */
  private runMigrations(): void {
    const db = this.db;

    db.exec(`
      CREATE TABLE IF NOT EXISTS executed_migrations (
        filename TEXT PRIMARY KEY NOT NULL,
        executed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const migrationsDir = resolveProjectPath('./src/database/queries/migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const executed = new Set(
      (db.prepare('SELECT filename FROM executed_migrations').all() as { filename: string }[]).map(
        (row) => row.filename
      )
    );

    for (const file of files) {
      if (executed.has(file)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      db.exec(sql);
      db.prepare('INSERT INTO executed_migrations (filename) VALUES (?)').run(file);
      this.logger.log(`Migration applied: ${file}`);
    }
  }

  public getDb(): DatabaseSync {
    return this.db;
  }

  async onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }
}
