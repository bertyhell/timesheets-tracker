import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { ProgramsController } from './programs.controller';
import { ProgramsListener } from './programs.listener';
import { ProgramsService } from './programs.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramsListener],
  exports: [ProgramsService],
})
export class ProgramsModule {}
