import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CustomError } from '../shared/CustomError';
import { Database } from 'bun:sqlite';

@Injectable()
export class SeedService {
  async seedTags(db: Database): Promise<void> {
    let sqlFilePath: string | null = null;
    try {
      sqlFilePath = path.resolve('./src/seed/tags.seed.sql');
      if (!fs.existsSync(sqlFilePath)) {
        return;
      }

      const countResult = db
        .prepare<{ count: number }, []>('./src/tag-names/queries/countTagNames.sql')
        .get();

      if (countResult.count > 0) {
        return;
      }

      const sqlQuery = fs.readFileSync(sqlFilePath, 'utf-8');
      db.run(sqlQuery);
    } catch (err) {
      throw new CustomError('Failed to seed tags', err, {
        sqlFilePath,
      });
    }
  }

  async seedActivities(db: Database): Promise<void> {
    let sqlFilePath: string | null = null;
    try {
      sqlFilePath = path.resolve('./src/seed/activities.seed.sql');
      if (!fs.existsSync(sqlFilePath)) {
        return;
      }

      const countResult = db
        .prepare<{ count: number }, []>('./src/activities/queries/countActivities.sql')
        .get();

      if (countResult.count > 0) {
        return;
      }

      const sqlQuery = fs.readFileSync(sqlFilePath, 'utf-8');
      db.query(sqlQuery);
    } catch (err) {
      throw new CustomError('Failed to seed activities', err, {
        sqlFilePath,
      });
    }
  }
}
