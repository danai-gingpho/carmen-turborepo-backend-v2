import { Module } from '@nestjs/common';
import { WorkflowCommentController } from './workflow-comment.controller';
import { WorkflowCommentService } from './workflow-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [WorkflowCommentController],
  providers: [
    WorkflowCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [WorkflowCommentService],
})
export class WorkflowCommentModule {}
