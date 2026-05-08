import { Module } from '@nestjs/common';
import { RequestForPricingDetailCommentController } from './request-for-pricing-detail-comment.controller';
import { RequestForPricingDetailCommentService } from './request-for-pricing-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [RequestForPricingDetailCommentController],
  providers: [
    RequestForPricingDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [RequestForPricingDetailCommentService],
})
export class RequestForPricingDetailCommentModule {}
