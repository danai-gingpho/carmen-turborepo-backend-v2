import { Module } from '@nestjs/common';
import { PurchaseRequestDetailCommentController } from './purchase-request-detail-comment.controller';
import { PurchaseRequestDetailCommentService } from './purchase-request-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PurchaseRequestDetailCommentController],
  providers: [
    PurchaseRequestDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PurchaseRequestDetailCommentService],
})
export class PurchaseRequestDetailCommentModule {}
