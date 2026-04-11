import { Injectable, type OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';
import * as fsPromise from 'fs/promises';
import { Database, Statement, Changes } from 'bun:sqlite';
import { CustomError } from '../shared/CustomError';
import { SeedService } from '../seed/seed.service';
import { resolve } from 'node:path';
import { DbQueryParams } from './database.types';
import { resolveProjectPath } from '../shared/resolve-src-path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database;
  private databasePath = path.resolve('./timesheets-tracker-database.sqlite3');
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly seedService: SeedService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('starting database module');
    this.logger.log('databasePath: ' + this.databasePath);
    this.db = new Database(this.databasePath);
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
      const statement = this.db.query(sqlQuery);
      return statement.all(params) as TResult[];
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

  public async mutate(sqlFile: string, params?: DbQueryParams): Promise<Changes> {
    let sqlQuery: string | null = null;
    try {
      sqlQuery = await this.getQueryFromFile(sqlFile);
      const statement: Statement = this.db.query(sqlQuery);
      return statement.run(params);
    } catch (err) {
      throw new CustomError('Failed to execute SQL query', err, { sqlFile, sqlQuery, params });
    }
  }

  /**
   * Create database tables if they do not exist yet
   */
  async createTables(): Promise<void> {
    await this.mutate('./src/database/queries/create-database-tables.sql');
  }

  public getDb(): Database {
    return this.db;
  }

  async onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }
}
