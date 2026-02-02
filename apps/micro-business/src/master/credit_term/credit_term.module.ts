import { Module } from '@nestjs/common';
import { CreditTermService } from './credit_term.service';
import { CreditTermController } from './credit_term.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [CreditTermController],
  providers: [
    CreditTermService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [CreditTermService],
})
export class CreditTermModule {}
