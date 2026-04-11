import { Module } from '@nestjs/common';
import { TagNamesService } from './tag-names.service';
import { TagNamesController } from './tag-names.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TagNamesController],
  providers: [TagNamesService],
  exports: [TagNamesService],
})
export class TagNamesModule {}
