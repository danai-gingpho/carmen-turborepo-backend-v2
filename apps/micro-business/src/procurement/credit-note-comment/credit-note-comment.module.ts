import { Module } from '@nestjs/common';
import { CreditNoteCommentController } from './credit-note-comment.controller';
import { CreditNoteCommentService } from './credit-note-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [CreditNoteCommentController],
  providers: [
    CreditNoteCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [CreditNoteCommentService],
})
export class CreditNoteCommentModule {}
