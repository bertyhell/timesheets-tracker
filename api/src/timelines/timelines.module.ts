import { Module } from '@nestjs/common';
import { TimelinesService } from './timelines.service';
import { TimelinesController } from './timelines.controller';
import { DatabaseModule } from '../database/database.module';
import { CalendarsModule } from '../calendars/calendars.module';
import { ProgramsModule } from '../programs/programs.module';
import { WebsitesModule } from '../websites/websites.module';
import { TagsModule } from '../tags/tags.module';
import { AutoNotesModule } from '../auto-notes/auto-notes.module';
import { AutoTagsModule } from '../auto-tags/auto-tags.module';
import { ActiveStatesModule } from '../activeStates/active-states.module';
import { TagNamesModule } from '../tag-names/tag-names.module';
import { GitCommitsModule } from '../git-commits/git-commits.module';

@Module({
  imports: [
    ActiveStatesModule,
    AutoNotesModule,
    AutoTagsModule,
    CalendarsModule,
    DatabaseModule,
    GitCommitsModule,
    ProgramsModule,
    TagsModule,
    WebsitesModule,
    TagNamesModule,
  ],
  controllers: [TimelinesController],
  providers: [TimelinesService],
  exports: [TimelinesService],
})
export class TimelinesModule {}
