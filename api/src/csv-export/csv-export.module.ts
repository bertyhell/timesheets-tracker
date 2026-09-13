import { Module } from '@nestjs/common';
import { CsvExportService } from './csv-export.service';
import { CsvExportController } from './csv-export.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CsvExportController],
  providers: [CsvExportService],
  exports: [CsvExportService],
})
export class CsvExportModule {}
