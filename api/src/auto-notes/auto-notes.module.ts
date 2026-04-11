import { Module } from '@nestjs/common';
import { AutoNotesService } from './auto-notes.service';
import { AutoNotesController } from './auto-notes.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AutoNotesController],
  providers: [AutoNotesService],
  exports: [AutoNotesService],
})
export class AutoNotesModule {}
