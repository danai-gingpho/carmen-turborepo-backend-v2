import { Module } from '@nestjs/common';
import { CreditTermCommentController } from './credit-term-comment.controller';
import { CreditTermCommentService } from './credit-term-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [CreditTermCommentController],
  providers: [
    CreditTermCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [CreditTermCommentService],
})
export class CreditTermCommentModule {}
