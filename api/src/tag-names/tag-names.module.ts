import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { TagNamesController } from './tag-names.controller';
import { TagNamesService } from './tag-names.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TagNamesController],
  providers: [TagNamesService],
  exports: [TagNamesService],
})
export class TagNamesModule {}
