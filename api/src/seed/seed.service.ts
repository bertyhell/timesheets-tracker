import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CustomError } from '../shared/CustomError';
import { Database } from 'bun:sqlite';
import { resolveProjectPath } from '../shared/resolve-src-path';

@Injectable()
export class SeedService {
  private async seedFile(db: Database, seedFilePath: string): Promise<void> {
    let sqlFilePath: string | null = null;
    try {
      sqlFilePath = resolveProjectPath(seedFilePath);
      if (!fs.existsSync(sqlFilePath)) {
        return;
      }

      const sqlQuery = fs.readFileSync(sqlFilePath, 'utf-8');
      db.run(sqlQuery);
    } catch (err) {
      throw new CustomError('Failed to seed file', err, {
        sqlFilePath,
      });
    }
  }

  private countEntries(db: Database, sqlCountQueryPath: string): number {
    const sqlQuery = fs.readFileSync(resolveProjectPath(sqlCountQueryPath), 'utf-8');
    return db.prepare<{ count: number }, []>(sqlQuery).get().count;
  }

  async seedTags(db: Database): Promise<void> {
    let sqlFilePath: string | null = null;
    try {
      const count = this.countEntries(db, './src/tag-names/queries/countTagNames.sql');

      if (count > 0) {
        return;
      }

      await this.seedFile(db, './src/seed/tags.seed.sql');
    } catch (err) {
      throw new CustomError('Failed to seed tags', err, {
        sqlFilePath,
      });
    }
  }

  async seedAutoTags(db: Database): Promise<void> {
    let sqlFilePath: string | null = null;
    try {
      const count = this.countEntries(db, './src/auto-tags/queries/countAutoTags.sql');

      if (count > 0) {
        return;
      }

      await this.seedFile(db, './src/seed/auto-tags.seed.sql');
    } catch (err) {
      throw new CustomError('Failed to seed tags', err, {
        sqlFilePath,
      });
    }
  }

  async seedActivities(db: Database): Promise<void> {
    let sqlFilePath: string | null = null;
    try {
      const count = this.countEntries(db, './src/activities/queries/countActivities.sql');

      if (count > 0) {
        return;
      }

      await this.seedFile(db, './src/seed/activities.seed.sql');
    } catch (err) {
      throw new CustomError('Failed to seed activities', err, {
        sqlFilePath,
      });
    }
  }
}
