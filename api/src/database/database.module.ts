import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { SeedModule } from '../seed/seed.module';

@Module({
  controllers: [],
  providers: [DatabaseService],
  exports: [DatabaseService],
  imports: [SeedModule],
})
export class DatabaseModule {}
