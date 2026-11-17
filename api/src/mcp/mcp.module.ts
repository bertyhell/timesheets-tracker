import { Module } from '@nestjs/common';

import { AutoNotesModule } from '../auto-notes/auto-notes.module';
import { AutoTagsModule } from '../auto-tags/auto-tags.module';
import { DatabaseBackupsModule } from '../database-backups/database-backups.module';
import { DatabaseModule } from '../database/database.module';
import { TagNamesModule } from '../tag-names/tag-names.module';
import { TagsModule } from '../tags/tags.module';
import { TimelinesModule } from '../timelines/timelines.module';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

@Module({
  imports: [
    AutoNotesModule,
    AutoTagsModule,
    DatabaseBackupsModule,
    DatabaseModule,
    TagNamesModule,
    TagsModule,
    TimelinesModule,
  ],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
