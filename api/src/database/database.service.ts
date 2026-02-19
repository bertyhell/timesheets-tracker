import { Injectable, type OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import { logger } from '../shared/logger';
import * as fsPromise from 'fs/promises';
import { Database } from 'bun:sqlite';
import { CustomError } from '../shared/CustomError';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database;
  private databasePath = path.resolve('../timesheets-tracker-database.sqlite3');

  async onModuleInit(): Promise<void> {
    logger.info('starting database module');
    logger.info('databasePath: ' + this.databasePath);
    this.db = new Database(this.databasePath);
    logger.info('creating database tables');
    await this.createTables();
    logger.info('database module started successfully');
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
        // Bun SQLite expects parameter names with $ prefix in the object keys
        const prefixedParams: Record<string, any> = {};
        for (const [key, value] of Object.entries(params)) {
          prefixedParams[key.startsWith('$') ? key : `$${key}`] = value;
        }
        return stmt.all(prefixedParams) as TResult[];
      }

      return stmt.all() as TResult[];
    } catch (err) {
      throw new CustomError('Failed to execute SQL query', err, { sqlFile, sqlQuery, params });
    }
  }

  /**
   * Create database tables if they do not exist yet
   */
  async createTables(): Promise<void> {
    const sqlFile = path.resolve('./src/database/queries/create-database-tables.sql');
    const sqlQuery = (await fsPromise.readFile(sqlFile)).toString('utf-8');
    this.db.exec(sqlQuery);
  }

  async onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }
}
