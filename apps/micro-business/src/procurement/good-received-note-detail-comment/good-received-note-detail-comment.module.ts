import { Module } from '@nestjs/common';
import { GoodReceivedNoteDetailCommentController } from './good-received-note-detail-comment.controller';
import { GoodReceivedNoteDetailCommentService } from './good-received-note-detail-comment.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

@Module({
  imports: [TenantModule],
  controllers: [GoodReceivedNoteDetailCommentController],
  providers: [
    GoodReceivedNoteDetailCommentService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [GoodReceivedNoteDetailCommentService],
})
export class GoodReceivedNoteDetailCommentModule {}
