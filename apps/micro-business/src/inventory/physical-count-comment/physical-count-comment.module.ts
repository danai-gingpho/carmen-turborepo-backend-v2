import { Module } from '@nestjs/common';
import { PhysicalCountCommentController } from './physical-count-comment.controller';
import { PhysicalCountCommentService } from './physical-count-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PhysicalCountCommentController],
  providers: [
    PhysicalCountCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PhysicalCountCommentService],
})
export class PhysicalCountCommentModule {}
