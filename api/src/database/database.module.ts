import { Module } from '@nestjs/common';

import { SeedModule } from '../seed/seed.module';
import { CachedNetworkRequestsService } from './cached-network-requests.service';
import { DatabaseService } from './database.service';

@Module({
  controllers: [],
  providers: [DatabaseService, CachedNetworkRequestsService],
  exports: [DatabaseService, CachedNetworkRequestsService],
  imports: [SeedModule],
})
export class DatabaseModule {}
