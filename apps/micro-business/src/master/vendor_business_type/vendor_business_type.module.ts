import { Module } from '@nestjs/common';
import { VendorBusinessTypeService } from './vendor_business_type.service';
import { VendorBusinessTypeController } from './vendor_business_type.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [VendorBusinessTypeController],
  providers: [VendorBusinessTypeService],
  exports: [VendorBusinessTypeService],
})
export class VendorBusinessTypeModule {}
