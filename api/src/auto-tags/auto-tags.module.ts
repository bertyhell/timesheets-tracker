import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';
import { AutoTagsController } from './auto-tags.controller';
import { AutoTagsService } from './auto-tags.service';

@Module({
  imports: [DatabaseModule, SettingsModule],
  controllers: [AutoTagsController],
  providers: [AutoTagsService],
  exports: [AutoTagsService],
})
export class AutoTagsModule {}
