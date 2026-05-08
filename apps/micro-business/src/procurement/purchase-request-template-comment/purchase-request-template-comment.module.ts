import { Module } from '@nestjs/common';
import { PurchaseRequestTemplateCommentController } from './purchase-request-template-comment.controller';
import { PurchaseRequestTemplateCommentService } from './purchase-request-template-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PurchaseRequestTemplateCommentController],
  providers: [
    PurchaseRequestTemplateCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PurchaseRequestTemplateCommentService],
})
export class PurchaseRequestTemplateCommentModule {}
