import { Module } from '@nestjs/common';
import { AutoTagsService } from './auto-tags.service';
import { AutoTagsController } from './auto-tags.controller';
import { DatabaseModule } from '../database/database.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [DatabaseModule, SettingsModule],
  controllers: [AutoTagsController],
  providers: [AutoTagsService],
  exports: [AutoTagsService],
})
export class AutoTagsModule {}
