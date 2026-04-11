import { Module } from '@nestjs/common';
import { WebsitesService } from './websites.service';
import { WebsitesController } from './websites.controller';
import { DatabaseModule } from '../database/database.module';
import { ProgramsModule } from '../programs/programs.module';

@Module({
  imports: [DatabaseModule, ProgramsModule],
  controllers: [WebsitesController],
  providers: [WebsitesService],
  exports: [WebsitesService],
})
export class WebsitesModule {}
