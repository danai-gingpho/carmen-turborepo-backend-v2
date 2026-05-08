import { Module } from '@nestjs/common';
import { StoreRequisitionCommentController } from './store-requisition-comment.controller';
import { StoreRequisitionCommentService } from './store-requisition-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [StoreRequisitionCommentController],
  providers: [
    StoreRequisitionCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [StoreRequisitionCommentService],
})
export class StoreRequisitionCommentModule {}
