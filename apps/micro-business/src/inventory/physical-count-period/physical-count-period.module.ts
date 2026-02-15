import { Module } from '@nestjs/common';
import { PhysicalCountPeriodService } from './physical-count-period.service';
import { PhysicalCountPeriodController } from './physical-count-period.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantModule } from '@/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [PhysicalCountPeriodController],
  providers: [
    PhysicalCountPeriodService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [PhysicalCountPeriodService],
})
export class PhysicalCountPeriodModule {}
