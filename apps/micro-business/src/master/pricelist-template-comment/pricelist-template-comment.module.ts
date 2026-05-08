import { Module } from '@nestjs/common';
import { PricelistTemplateCommentController } from './pricelist-template-comment.controller';
import { PricelistTemplateCommentService } from './pricelist-template-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PricelistTemplateCommentController],
  providers: [
    PricelistTemplateCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PricelistTemplateCommentService],
})
export class PricelistTemplateCommentModule {}
