import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivitiesModule } from './activities/activities.module';
import { DatabaseModule } from './database/database.module';
import { TagsModule } from './tags/tags.module';
import { TagNamesModule } from './tag-names/tag-names.module';
import { AutoTagsModule } from './auto-tags/auto-tags.module';
import { ActiveStatesModule } from './activeStates/active-states.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WebsitesModule } from './websites/websites.module';
import { AutoNotesModule } from './auto-notes/auto-notes.module';
import { resolve } from 'node:path';
import fs from 'fs';
import { ServeStaticModule } from '@nestjs/serve-static';
import { logger } from './shared/logger';
import { CalendarsModule } from './calendars/calendars.module';

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
    ActivitiesModule,
    ActiveStatesModule,
    DatabaseModule,
    TagsModule,
    TagNamesModule,
    AutoTagsModule,
    WebsitesModule,
    AutoNotesModule,
    CalendarsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
