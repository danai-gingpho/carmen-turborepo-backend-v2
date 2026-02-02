import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { CommonModule } from '@/common/common.module';
import { TenantService } from '@/tenant/tenant.service';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [LocationsController],
  providers: [
    LocationsService,
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
  exports: [LocationsService],
})
export class LocationsModule {}
