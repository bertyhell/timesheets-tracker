import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AutoNotesController } from './auto-notes.controller';
import { AutoNotesService } from './auto-notes.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AutoNotesController],
  providers: [AutoNotesService],
  exports: [AutoNotesService],
})
export class AutoNotesModule {}
