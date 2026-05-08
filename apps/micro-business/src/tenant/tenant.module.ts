import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    TenantService,
  ],
  exports: ['PRISMA_SYSTEM', 'PRISMA_TENANT', TenantService],
})
export class TenantModule {}
