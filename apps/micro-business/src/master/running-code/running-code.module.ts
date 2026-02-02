import { Module } from '@nestjs/common';
import { RunningCodeService } from './running-code.service';
import { RunningCodeController } from './running-code.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';

@Module({
  imports: [TenantModule],
  controllers: [RunningCodeController],
  providers: [
    RunningCodeService,
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
  exports: [RunningCodeService],
})
export class RunningCodeModule {}
