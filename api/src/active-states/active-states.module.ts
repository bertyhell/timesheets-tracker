import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { ActiveStatesController } from './active-states.controller';
import { ActiveStatesListener } from './active-states.listener';
import { ActiveStatesService } from './active-states.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ActiveStatesController],
  providers: [ActiveStatesService, ActiveStatesListener],
  exports: [ActiveStatesService],
})
export class ActiveStatesModule {}
