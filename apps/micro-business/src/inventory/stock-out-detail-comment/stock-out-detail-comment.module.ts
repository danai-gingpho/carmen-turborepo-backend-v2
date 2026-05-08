import { Module } from '@nestjs/common';
import { StockOutDetailCommentController } from './stock-out-detail-comment.controller';
import { StockOutDetailCommentService } from './stock-out-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [StockOutDetailCommentController],
  providers: [
    StockOutDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [StockOutDetailCommentService],
})
export class StockOutDetailCommentModule {}
