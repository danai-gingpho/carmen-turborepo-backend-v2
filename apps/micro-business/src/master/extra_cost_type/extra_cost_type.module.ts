import { Module } from '@nestjs/common';
import { ExtraCostTypeService } from './extra_cost_type.service';
import { ExtraCostTypeController } from './extra_cost_type.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [ExtraCostTypeController],
  providers: [ExtraCostTypeService],
  exports: [ExtraCostTypeService],
})
export class ExtraCostTypeModule {}
