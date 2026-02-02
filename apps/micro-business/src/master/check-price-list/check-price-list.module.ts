import { Module } from '@nestjs/common';
import { CheckPriceListService } from './check-price-list.service';
import { CheckPriceListController } from './check-price-list.controller';
import { TenantModule } from '@/tenant/tenant.module';

@Module({
  imports: [
    TenantModule,
  ],
  controllers: [CheckPriceListController],
  providers: [CheckPriceListService],
  exports: [CheckPriceListService],
})
export class CheckPriceListModule {}
