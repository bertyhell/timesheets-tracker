import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ProductiveController } from './productive.controller';
import { ProductiveService } from './productive.service';

@Module({
  imports: [IntegrationsModule, DatabaseModule],
  controllers: [ProductiveController],
  providers: [ProductiveService],
  exports: [ProductiveService],
})
export class ProductiveModule {}
