import { Module } from '@nestjs/common';
import { PriceListTemplateService } from './price-list-template.service';
import { PriceListTemplateController } from './price-list-template.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [PriceListTemplateController],
  providers: [
    PriceListTemplateService,
  ],
  exports: [PriceListTemplateService],
})
export class PriceListTemplateModule {}
