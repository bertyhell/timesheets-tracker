import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { CsvExportController } from './csv-export.controller';
import { CsvExportService } from './csv-export.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CsvExportController],
  providers: [CsvExportService],
  exports: [CsvExportService],
})
export class CsvExportModule {}
