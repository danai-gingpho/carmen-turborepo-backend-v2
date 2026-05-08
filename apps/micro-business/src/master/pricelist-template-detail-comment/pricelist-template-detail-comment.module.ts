import { Module } from '@nestjs/common';
import { PricelistTemplateDetailCommentController } from './pricelist-template-detail-comment.controller';
import { PricelistTemplateDetailCommentService } from './pricelist-template-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PricelistTemplateDetailCommentController],
  providers: [
    PricelistTemplateDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PricelistTemplateDetailCommentService],
})
export class PricelistTemplateDetailCommentModule {}
