import { Module } from '@nestjs/common';
import { PurchaseOrderCommentController } from './purchase-order-comment.controller';
import { PurchaseOrderCommentService } from './purchase-order-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PurchaseOrderCommentController],
  providers: [
    PurchaseOrderCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PurchaseOrderCommentService],
})
export class PurchaseOrderCommentModule {}
