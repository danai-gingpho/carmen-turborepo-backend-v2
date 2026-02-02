import { Module } from '@nestjs/common';
import { VendorBusinessTypeService } from './vendor_business_type.service';
import { VendorBusinessTypeController } from './vendor_business_type.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { CommonModule } from '@/common/common.module';
import { TenantService } from '@/tenant/tenant.service';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [VendorBusinessTypeController],
  providers: [
    VendorBusinessTypeService,
    TenantService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [VendorBusinessTypeService],
})
export class VendorBusinessTypeModule {}
