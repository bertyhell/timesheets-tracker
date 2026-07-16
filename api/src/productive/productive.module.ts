import { Module } from '@nestjs/common';
import { ProductiveService } from './productive.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [IntegrationsModule, DatabaseModule],
  providers: [ProductiveService],
  exports: [ProductiveService],
})
export class ProductiveModule {}
