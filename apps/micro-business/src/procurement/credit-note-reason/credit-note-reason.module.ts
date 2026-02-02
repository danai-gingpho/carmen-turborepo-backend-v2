import { TenantService } from '@/tenant/tenant.service';
import { Module } from '@nestjs/common'
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { CreditNoteReasonController } from './credit-note-reason.controller';
import { CreditNoteReasonService } from './credit-note-reason.service';

@Module({
  controllers: [CreditNoteReasonController],
  providers: [
    TenantService,
    CreditNoteReasonService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [CreditNoteReasonService],
})
export class CreditNoteReasonModule {}