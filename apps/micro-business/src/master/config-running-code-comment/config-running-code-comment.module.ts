import { Module } from '@nestjs/common';
import { ConfigRunningCodeCommentController } from './config-running-code-comment.controller';
import { ConfigRunningCodeCommentService } from './config-running-code-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [ConfigRunningCodeCommentController],
  providers: [
    ConfigRunningCodeCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [ConfigRunningCodeCommentService],
})
export class ConfigRunningCodeCommentModule {}
