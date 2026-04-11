import { Module } from '@nestjs/common';
import { TimelinesService } from './timelines.service';
import { TimelinesController } from './timelines.controller';
import { DatabaseModule } from '../database/database.module';
import { CalendarsModule } from '../calendars/calendars.module';
import { ProgramsModule } from '../programs/programs.module';
import { WebsitesModule } from '../websites/websites.module';
import { TagsModule } from '../tags/tags.module';
import { AutoTagsModule } from '../auto-tags/auto-tags.module';
import { ActiveStatesModule } from '../activeStates/active-states.module';

@Module({
  imports: [
    ActiveStatesModule,
    AutoTagsModule,
    CalendarsModule,
    DatabaseModule,
    ProgramsModule,
    TagsModule,
    WebsitesModule,
  ],
  controllers: [TimelinesController],
  providers: [TimelinesService],
  exports: [TimelinesService],
})
export class TimelinesModule {}
