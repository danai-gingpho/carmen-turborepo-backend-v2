import { Module } from '@nestjs/common';
import { PricelistCommentController } from './pricelist-comment.controller';
import { PricelistCommentService } from './pricelist-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [PricelistCommentController],
  providers: [
    PricelistCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [PricelistCommentService],
})
export class PricelistCommentModule {}
