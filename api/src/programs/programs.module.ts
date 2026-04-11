import { Module } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { DatabaseModule } from '../database/database.module';
import { ProgramsListener } from './programs.listener';

@Module({
  imports: [DatabaseModule],
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramsListener],
  exports: [ProgramsService],
})
export class ProgramsModule {}
