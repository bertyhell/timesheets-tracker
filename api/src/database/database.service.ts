import { Injectable, type OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { logger } from '../shared/logger';
import * as fsPromise from 'fs/promises';
import * as fs from 'fs';

import initSqlJs, { type Database } from 'sql.js/dist/sql-wasm.js';
import { CustomError } from '../shared/CustomError';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database;

  async onModuleInit(): Promise<void> {
    logger.info('starting database module');
    let databasePath: string | null = path.resolve('timesheets-tracker-database.sqlite3');
    if (!fs.existsSync(databasePath)) {
      databasePath = path.resolve('../timesheets-tracker-database.sqlite3');
    }
    logger.info('databasePath: ' + databasePath);
    const fileBuffer = fs.readFileSync(databasePath);
    initSqlJs().then(async (SQL) => {
      this.db = new SQL.Database(fileBuffer);
      logger.info('creating database tables');
      await this.createTables();
      logger.info('database module started successfully');
    });
  }

  public async exec<TResult>(sqlFile: string, params?: Record<string, any>): Promise<TResult[]> {
    try {
      const sqlQuery: string = (await fsPromise.readFile(sqlFile)).toString('utf-8');
      logger.debug(
        '[DATABASE]: executing sql query: ' + JSON.stringify({ sqlQuery, params }, null, 2)
      );
      const results = this.db.exec(sqlQuery, params);
      if (!results.length) {
        return [];
      }
      const columns = results[0].columns;
      return results.map((result) => {
        return Object.fromEntries(
          columns.map((column, index) => {
            return [column, result.values[index]];
          })
        );
      }) as TResult[];
    } catch (err) {
      throw new CustomError('Failed to execute SQL query', err, { sqlFile, params });
    }
  }

  /**
   * Create database tables if they do not exist yet
   */
  async createTables(): Promise<void> {
    await this.exec(path.resolve('./src/database/queries/create-database-tables.sql'));
  }
}
