import { Module } from '@nestjs/common';
import { JiraService } from './jira.service';
import { JiraController } from './jira.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { DatabaseModule } from '../database/database.module';
import { WebsitesModule } from '../websites/websites.module';
import { ProgramsModule } from '../programs/programs.module';

@Module({
  imports: [IntegrationsModule, DatabaseModule, WebsitesModule, ProgramsModule],
  controllers: [JiraController],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}
