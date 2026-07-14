import { Module } from '@nestjs/common';
import { ProductiveService } from './productive.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  providers: [ProductiveService],
  exports: [ProductiveService],
})
export class ProductiveModule {}
