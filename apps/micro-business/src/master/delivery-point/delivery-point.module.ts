import { Module } from '@nestjs/common';
import { DeliveryPointService } from './delivery-point.service';
import { DeliveryPointController } from './delivery-point.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [DeliveryPointController],
  providers: [DeliveryPointService],
  exports: [DeliveryPointService],
})
export class DeliveryPointModule {}
