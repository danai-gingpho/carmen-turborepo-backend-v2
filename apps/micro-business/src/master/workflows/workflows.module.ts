import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantModule } from '@/tenant/tenant.module';
import { TenantService } from '@/tenant/tenant.service';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
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
  exports: [WorkflowsService],
})
export class WorkflowsModule { }
