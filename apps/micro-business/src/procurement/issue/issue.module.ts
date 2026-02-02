import { TenantService } from '@/tenant/tenant.service';
import { Module } from '@nestjs/common'
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';

@Module({
  controllers: [IssueController],
  providers: [
    TenantService,
    IssueService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [IssueService],
})
export class IssueModule {}
