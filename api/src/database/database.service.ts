import { Injectable, type OnModuleInit, Logger } from '@nestjs/common';
import * as path from 'path';
import { logger } from '../shared/logger';
import * as fsPromise from 'fs/promises';
import { Database, Statement, Changes } from 'bun:sqlite';
import { CustomError } from '../shared/CustomError';
import { SeedService } from '../seed/seed.service';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database;
  private databasePath = path.resolve('../timesheets-tracker-database.sqlite3');
  private readonly logger = new Logger(DatabaseService.name);
  private preparedStatementsCache: Record<string, Statement> = {};

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
        this.seedService.seedActivities(this.db),
      ]);
      this.logger.log('Seeders completed successfully');
    }
  }

  private async getStatement(sqlFile: string): Promise<Statement> {
    let sqlQuery = (await fsPromise.readFile(sqlFile)).toString('utf-8');
    logger.debug('[DATABASE]: prepare sql query: ' + JSON.stringify({ sqlQuery }, null, 2));

    let preparedStatement: Statement | undefined = this.preparedStatementsCache[sqlFile];
    if (!preparedStatement) {
      preparedStatement = this.db.prepare(sqlQuery);
      this.preparedStatementsCache[sqlFile] = preparedStatement;
    }

    return preparedStatement;
  }

  public async query<TResult>(sqlFile: string, params?: Record<string, any>): Promise<TResult[]> {
    let sqlQuery: string | null = null;
    try {
      const preparedStatement: Statement = await this.getStatement(sqlFile);
      return preparedStatement.all(params) as TResult[];
    } catch (err) {
      throw new CustomError('Failed to execute SQL query', err, { sqlFile, sqlQuery, params });
    }
  }

  public async mutate(sqlFile: string, params?: Record<string, any>): Promise<Changes> {
    let sqlQuery: string | null = null;
    try {
      const preparedStatement: Statement = await this.getStatement(sqlFile);
      return preparedStatement.run(params);
    } catch (err) {
      throw new CustomError('Failed to execute SQL query', err, { sqlFile, sqlQuery, params });
    }
  }

  /**
   * Create database tables if they do not exist yet
   */
  async createTables(): Promise<void> {
    await this.query('./src/database/queries/create-database-tables.sql');
  }

  async onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }
}
