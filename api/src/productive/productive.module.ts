import { Module } from '@nestjs/common';
import { ProductiveService } from './productive.service';
import { ProductiveController } from './productive.controller';
import { IntegrationsModule } from '../integrations/integrations.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [IntegrationsModule, DatabaseModule],
  controllers: [ProductiveController],
  providers: [ProductiveService],
  exports: [ProductiveService],
})
export class ProductiveModule {}
