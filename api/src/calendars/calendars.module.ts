import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { CalendarsService } from './calendars.service';

@Module({
  imports: [DatabaseModule],
  providers: [CalendarsService],
  exports: [CalendarsService],
})
export class CalendarsModule {}
