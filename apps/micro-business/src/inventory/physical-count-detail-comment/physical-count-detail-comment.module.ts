import { Module } from '@nestjs/common';
import { PhysicalCountDetailCommentController } from './physical-count-detail-comment.controller';
import { PhysicalCountDetailCommentService } from './physical-count-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PhysicalCountDetailCommentController],
  providers: [
    PhysicalCountDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PhysicalCountDetailCommentService],
})
export class PhysicalCountDetailCommentModule {}
