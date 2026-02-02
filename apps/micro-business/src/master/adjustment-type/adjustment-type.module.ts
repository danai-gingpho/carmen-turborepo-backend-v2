import { Module } from '@nestjs/common';
import { AdjustmentTypeService } from './adjustment-type.service';
import { AdjustmentTypeController } from './adjustment-type.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [AdjustmentTypeController],
  providers: [AdjustmentTypeService],
  exports: [AdjustmentTypeService],
})
export class AdjustmentTypeModule {}
