import { Module } from '@nestjs/common';
import { DepartmentCommentController } from './department-comment.controller';
import { DepartmentCommentService } from './department-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [DepartmentCommentController],
  providers: [
    DepartmentCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [DepartmentCommentService],
})
export class DepartmentCommentModule {}
