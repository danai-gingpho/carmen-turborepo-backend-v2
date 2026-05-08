import { Module } from '@nestjs/common';
import { StoreRequisitionDetailCommentController } from './store-requisition-detail-comment.controller';
import { StoreRequisitionDetailCommentService } from './store-requisition-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [StoreRequisitionDetailCommentController],
  providers: [
    StoreRequisitionDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [StoreRequisitionDetailCommentService],
})
export class StoreRequisitionDetailCommentModule {}
