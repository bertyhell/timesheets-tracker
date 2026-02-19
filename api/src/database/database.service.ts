import { Injectable, type OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { logger } from '../shared/logger';
import * as fsPromise from 'fs/promises';
import * as fs from 'fs';

import initSqlJs, { type Database } from 'sql.js/dist/sql-wasm.js';
import { CustomError } from '../shared/CustomError';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database;
  private databasePath = path.resolve('../timesheets-tracker-database.sqlite3');

  async onModuleInit(): Promise<void> {
    logger.info('starting database module');
    if (!fs.existsSync(this.databasePath)) {
      fs.writeFileSync(this.databasePath, '', { encoding: 'utf8' });
    }
    logger.info('databasePath: ' + this.databasePath);
    const fileBuffer = fs.readFileSync(this.databasePath);
    initSqlJs().then(async (SQL) => {
      this.db = new SQL.Database(fileBuffer);
      logger.info('creating database tables');
      await this.createTables();
      this.saveToDisk();
      logger.info('database module started successfully');
    });
  }

  public async exec<TResult>(sqlFile: string, params?: Record<string, any>): Promise<TResult[]> {
    let sqlQuery: string | null = null;
    try {
      sqlQuery = (await fsPromise.readFile(sqlFile)).toString('utf-8');
      logger.debug(
        '[DATABASE]: executing sql query: ' + JSON.stringify({ sqlQuery, params }, null, 2)
      );
      const stmt = this.db.prepare(sqlQuery);
      if (params) {
        stmt.bind(params);
      }

      const results: TResult[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as TResult);
      }

      stmt.free();
      return results;
    } catch (err) {
      throw new CustomError('Failed to execute SQL query', err, { sqlFile, sqlQuery, params });
    }
  }

  /**
   * Create database tables if they do not exist yet
   */
  async createTables(): Promise<void> {
    await this.exec(path.resolve('./src/database/queries/create-database-tables.sql'));
  }

  private saveToDisk() {
    if (!this.db) {
      return;
    }
    const data: Uint8Array = this.db.export();
    fs.writeFileSync(this.databasePath, data);
  }

  // Save every 10 seconds
  @Cron(CronExpression.EVERY_10_SECONDS)
  handleCron() {
    this.saveToDisk();
  }

  // Also flush on shutdown
  async onModuleDestroy() {
    this.saveToDisk();
  }
}
