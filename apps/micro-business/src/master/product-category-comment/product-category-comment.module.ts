import { Module } from '@nestjs/common';
import { ProductCategoryCommentController } from './product-category-comment.controller';
import { ProductCategoryCommentService } from './product-category-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [ProductCategoryCommentController],
  providers: [
    ProductCategoryCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [ProductCategoryCommentService],
})
export class ProductCategoryCommentModule {}
