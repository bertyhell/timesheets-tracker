import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { ProgramsModule } from '../programs/programs.module';
import { WebsitesController } from './websites.controller';
import { WebsitesService } from './websites.service';

@Module({
  imports: [DatabaseModule, ProgramsModule],
  controllers: [WebsitesController],
  providers: [WebsitesService],
  exports: [WebsitesService],
})
export class WebsitesModule {}
