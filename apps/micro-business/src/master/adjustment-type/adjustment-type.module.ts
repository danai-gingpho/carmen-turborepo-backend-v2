import { Module } from '@nestjs/common';
import { AdjustmentTypeService } from './adjustment-type.service';
import { AdjustmentTypeController } from './adjustment-type.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { CommonModule } from '@/common/common.module';
import { TenantService } from '@/tenant/tenant.service';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [AdjustmentTypeController],
  providers: [
    AdjustmentTypeService,
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
  exports: [AdjustmentTypeService],
})
export class AdjustmentTypeModule {}
