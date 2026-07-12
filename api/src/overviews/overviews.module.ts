import { Module } from '@nestjs/common';
import { OverviewsService } from './overviews.service';
import { OverviewsController } from './overviews.controller';
import { DatabaseModule } from '../database/database.module';
import { TagsModule } from '../tags/tags.module';
import { ProgramsModule } from '../programs/programs.module';
import { WebsitesModule } from '../websites/websites.module';
import { ActiveStatesModule } from '../activeStates/active-states.module';

@Module({
  imports: [DatabaseModule, TagsModule, ProgramsModule, WebsitesModule, ActiveStatesModule],
  controllers: [OverviewsController],
  providers: [OverviewsService],
  exports: [OverviewsService],
})
export class OverviewsModule {}
