import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { DatabaseBackupsController } from './database-backups.controller';
import { DatabaseBackupsService } from './database-backups.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DatabaseBackupsController],
  providers: [DatabaseBackupsService],
  exports: [DatabaseBackupsService],
})
export class DatabaseBackupsModule {}
