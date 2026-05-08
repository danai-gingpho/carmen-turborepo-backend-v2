import { Module } from '@nestjs/common';
import { PhysicalCountPeriodCommentController } from './physical-count-period-comment.controller';
import { PhysicalCountPeriodCommentService } from './physical-count-period-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PhysicalCountPeriodCommentController],
  providers: [
    PhysicalCountPeriodCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PhysicalCountPeriodCommentService],
})
export class PhysicalCountPeriodCommentModule {}
