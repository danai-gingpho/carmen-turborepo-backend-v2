import { Module } from '@nestjs/common';
import { UnitConversionController } from './unit-conversion.controller';
import { UnitConversionService } from './unit-conversion.service';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  controllers: [UnitConversionController],
  providers: [
    UnitConversionService,
    TenantService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'TENANT_SERVICE',
      useValue: TenantService,
    },

  ],
})
export class UnitConversionModule {}
