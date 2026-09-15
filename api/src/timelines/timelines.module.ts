import { Module } from '@nestjs/common';

import { ActiveStatesModule } from '../active-states/active-states.module';
import { AutoNotesModule } from '../auto-notes/auto-notes.module';
import { AutoTagsModule } from '../auto-tags/auto-tags.module';
import { CalendarsModule } from '../calendars/calendars.module';
import { DatabaseModule } from '../database/database.module';
import { FileEditsModule } from '../file-edits/file-edits.module';
import { GitCommitsModule } from '../git-commits/git-commits.module';
import { JiraModule } from '../jira/jira.module';
import { ProductiveModule } from '../productive/productive.module';
import { ProgramsModule } from '../programs/programs.module';
import { TagNamesModule } from '../tag-names/tag-names.module';
import { TagsModule } from '../tags/tags.module';
import { WebsitesModule } from '../websites/websites.module';
import { TimelinesController } from './timelines.controller';
import { TimelinesService } from './timelines.service';

@Module({
  imports: [
    ActiveStatesModule,
    AutoNotesModule,
    AutoTagsModule,
    CalendarsModule,
    DatabaseModule,
    FileEditsModule,
    GitCommitsModule,
    JiraModule,
    ProductiveModule,
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
