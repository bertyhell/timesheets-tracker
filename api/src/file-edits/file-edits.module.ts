import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { FileEditsService } from './file-edits.service';

@Module({
  imports: [DatabaseModule],
  providers: [FileEditsService],
  exports: [FileEditsService],
})
export class FileEditsModule {}
