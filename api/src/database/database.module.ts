import { Module } from '@nestjs/common';

import { SeedModule } from '../seed/seed.module';
import { DatabaseService } from './database.service';

@Module({
  controllers: [],
  providers: [DatabaseService],
  exports: [DatabaseService],
  imports: [SeedModule],
})
export class DatabaseModule {}
