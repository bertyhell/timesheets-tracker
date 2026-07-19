import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { noop } from 'lodash';
import { DatabaseService } from '../database/database.service';
import { SettingsService } from './settings.service';
import { deleteOldPrograms } from './queries/deleteOldPrograms';
import { deleteOldWebsites } from './queries/deleteOldWebsites';
import { deleteOldActiveStates } from './queries/deleteOldActiveStates';
import { deleteOldTags } from './queries/deleteOldTags';
import { deleteOldCachedNetworkRequests } from './queries/deleteOldCachedNetworkRequests';

@Injectable()
export class PurgeOldEventsListener implements OnApplicationBootstrap {
  private readonly logger = new Logger(PurgeOldEventsListener.name);

  constructor(
    private readonly settingsService: SettingsService,
    private readonly databaseService: DatabaseService
  ) {}

  onApplicationBootstrap(): void {
    // DatabaseService has finished initialising by the time the app has bootstrapped,
    // unlike in the constructor where its connection isn't open yet.
    this.purgeOldEvents().then(noop);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  private async purgeOldEvents(): Promise<void> {
    const cutoffDate = this.settingsService.getDeleteEventsBeforeDate();
    if (!cutoffDate) return;

    const db = this.databaseService.getDb();
    const before = cutoffDate.toISOString();

    const results = {
      programs: deleteOldPrograms(db, { before }).changes,
      websites: deleteOldWebsites(db, { before }).changes,
      activeStates: deleteOldActiveStates(db, { before }).changes,
      tags: deleteOldTags(db, { before }).changes,
      cachedNetworkRequests: deleteOldCachedNetworkRequests(db, { before }).changes,
    };

    this.logger.log(`Purged events before ${before}: ${JSON.stringify(results)}`);
  }
}
