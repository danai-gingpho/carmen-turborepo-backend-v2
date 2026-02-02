import { Module } from '@nestjs/common';
import { PurchaseRequestCommentController } from './purchase-request-comment.controller';
import { PurchaseRequestCommentService } from './purchase-request-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PurchaseRequestCommentController],
  providers: [
    PurchaseRequestCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PurchaseRequestCommentService],
})
export class PurchaseRequestCommentModule {}
