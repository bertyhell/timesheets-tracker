import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import fs from 'fs';
import { resolve } from 'node:path';

import { ActiveStatesModule } from './active-states/active-states.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutoNotesModule } from './auto-notes/auto-notes.module';
import { AutoTagsModule } from './auto-tags/auto-tags.module';
import { CalendarsModule } from './calendars/calendars.module';
import { CsvExportModule } from './csv-export/csv-export.module';
import { DatabaseModule } from './database/database.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { OverviewsModule } from './overviews/overviews.module';
import { ProgramsModule } from './programs/programs.module';
import { SettingsModule } from './settings/settings.module';
import { logger } from './shared/logger';
import { TagNamesModule } from './tag-names/tag-names.module';
import { TagsModule } from './tags/tags.module';
import { TimelinesModule } from './timelines/timelines.module';
import { WebsitesModule } from './websites/websites.module';

let clientDistFolder: string;
if (fs.existsSync(resolve('./client/index.html'))) {
  // Running api from inside monorepo dist/api folder
  clientDistFolder = resolve('./client');
} else {
  // Running api from inside api folder
  clientDistFolder = resolve('../client/dist');
}
logger.info('client folder: ' + clientDistFolder);

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: clientDistFolder,
    }),
    ScheduleModule.forRoot(),
    ProgramsModule,
    ActiveStatesModule,
    DatabaseModule,
    TagsModule,
    TagNamesModule,
    AutoTagsModule,
    WebsitesModule,
    AutoNotesModule,
    CalendarsModule,
    TimelinesModule,
    SettingsModule,
    OverviewsModule,
    IntegrationsModule,
    CsvExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
