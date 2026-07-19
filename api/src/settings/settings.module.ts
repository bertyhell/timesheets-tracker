import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { DatabaseModule } from '../database/database.module';
import { PurgeOldEventsListener } from './purge-old-events.listener';

@Module({
  imports: [DatabaseModule],
  controllers: [SettingsController],
  providers: [SettingsService, PurgeOldEventsListener],
})
export class SettingsModule {}
