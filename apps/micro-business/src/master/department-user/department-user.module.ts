import { Module } from '@nestjs/common';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import { CommonModule } from '@/common/common.module';
import { DepartmentUserController } from './department-user.controller';
import { DepartmentUserService } from './department-user.service';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [DepartmentUserController],
  providers: [
    DepartmentUserService,
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
  exports: [DepartmentUserService],
})
export class DepartmentUserModule { }
