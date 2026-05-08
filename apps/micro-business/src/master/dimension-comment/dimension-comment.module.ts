import { Module } from '@nestjs/common';
import { DimensionCommentController } from './dimension-comment.controller';
import { DimensionCommentService } from './dimension-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [DimensionCommentController],
  providers: [
    DimensionCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [DimensionCommentService],
})
export class DimensionCommentModule {}
