import { Module } from '@nestjs/common';
import { ActiveStatesService } from './active-states.service';
import { ActiveStatesController } from './active-states.controller';
import { DatabaseModule } from '../database/database.module';
import { ActiveStatesListener } from './active-states.listener';

@Module({
  imports: [DatabaseModule],
  controllers: [ActiveStatesController],
  providers: [ActiveStatesService, ActiveStatesListener],
  exports: [ActiveStatesService],
})
export class ActiveStatesModule {}
