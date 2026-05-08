import { Module } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { PriceListLogic } from './price-list.logic';
import { PriceListController } from './price-list.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [PriceListController],
  providers: [PriceListService, PriceListLogic],
})
export class PriceListModule {}
