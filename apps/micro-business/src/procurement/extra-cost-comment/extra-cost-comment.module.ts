import { Module } from '@nestjs/common';
import { ExtraCostCommentController } from './extra-cost-comment.controller';
import { ExtraCostCommentService } from './extra-cost-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [ExtraCostCommentController],
  providers: [
    ExtraCostCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [ExtraCostCommentService],
})
export class ExtraCostCommentModule {}
