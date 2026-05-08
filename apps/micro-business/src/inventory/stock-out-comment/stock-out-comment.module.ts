import { Module } from '@nestjs/common';
import { StockOutCommentController } from './stock-out-comment.controller';
import { StockOutCommentService } from './stock-out-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [StockOutCommentController],
  providers: [
    StockOutCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [StockOutCommentService],
})
export class StockOutCommentModule {}
