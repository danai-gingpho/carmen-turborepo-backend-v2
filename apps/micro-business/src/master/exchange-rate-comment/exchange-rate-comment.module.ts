import { Module } from '@nestjs/common';
import { ExchangeRateCommentController } from './exchange-rate-comment.controller';
import { ExchangeRateCommentService } from './exchange-rate-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [ExchangeRateCommentController],
  providers: [
    ExchangeRateCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [ExchangeRateCommentService],
})
export class ExchangeRateCommentModule {}
