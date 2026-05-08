import { Module } from '@nestjs/common';
import { SpotCheckDetailCommentController } from './spot-check-detail-comment.controller';
import { SpotCheckDetailCommentService } from './spot-check-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [SpotCheckDetailCommentController],
  providers: [
    SpotCheckDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [SpotCheckDetailCommentService],
})
export class SpotCheckDetailCommentModule {}
