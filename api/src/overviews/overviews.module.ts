import { Module } from '@nestjs/common';

import { ActiveStatesModule } from '../active-states/active-states.module';
import { DatabaseModule } from '../database/database.module';
import { ProgramsModule } from '../programs/programs.module';
import { TagsModule } from '../tags/tags.module';
import { WebsitesModule } from '../websites/websites.module';
import { OverviewsController } from './overviews.controller';
import { OverviewsService } from './overviews.service';

@Module({
  imports: [DatabaseModule, TagsModule, ProgramsModule, WebsitesModule, ActiveStatesModule],
  controllers: [OverviewsController],
  providers: [OverviewsService],
  exports: [OverviewsService],
})
export class OverviewsModule {}
