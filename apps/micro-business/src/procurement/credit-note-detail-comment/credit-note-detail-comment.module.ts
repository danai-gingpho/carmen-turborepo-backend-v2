import { Module } from '@nestjs/common';
import { CreditNoteDetailCommentController } from './credit-note-detail-comment.controller';
import { CreditNoteDetailCommentService } from './credit-note-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [CreditNoteDetailCommentController],
  providers: [
    CreditNoteDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [CreditNoteDetailCommentService],
})
export class CreditNoteDetailCommentModule {}
