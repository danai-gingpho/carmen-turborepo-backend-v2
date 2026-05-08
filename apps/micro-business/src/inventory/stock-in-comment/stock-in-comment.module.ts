import { Module } from '@nestjs/common';
import { StockInCommentController } from './stock-in-comment.controller';
import { StockInCommentService } from './stock-in-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [StockInCommentController],
  providers: [
    StockInCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [StockInCommentService],
})
export class StockInCommentModule {}
