import { Module } from '@nestjs/common';
import { ExtraCostDetailCommentController } from './extra-cost-detail-comment.controller';
import { ExtraCostDetailCommentService } from './extra-cost-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [ExtraCostDetailCommentController],
  providers: [
    ExtraCostDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [ExtraCostDetailCommentService],
})
export class ExtraCostDetailCommentModule {}
