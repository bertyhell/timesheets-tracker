import { Module } from '@nestjs/common';
import { AutoTagsService } from './auto-tags.service';
import { AutoTagsController } from './auto-tags.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AutoTagsController],
  providers: [AutoTagsService],
  exports: [AutoTagsService],
})
export class AutoTagsModule {}
