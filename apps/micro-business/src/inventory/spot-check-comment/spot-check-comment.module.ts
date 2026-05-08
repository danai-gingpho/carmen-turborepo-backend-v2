import { Module } from '@nestjs/common';
import { SpotCheckCommentController } from './spot-check-comment.controller';
import { SpotCheckCommentService } from './spot-check-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [SpotCheckCommentController],
  providers: [
    SpotCheckCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [SpotCheckCommentService],
})
export class SpotCheckCommentModule {}
