import { TenantModule } from '@/tenant/tenant.module';
import { Module } from '@nestjs/common'
import { CreditNoteReasonController } from './credit-note-reason.controller';
import { CreditNoteReasonService } from './credit-note-reason.service';

@Module({
  imports: [TenantModule],
  controllers: [CreditNoteReasonController],
  providers: [CreditNoteReasonService],
  exports: [CreditNoteReasonService],
})
export class CreditNoteReasonModule {}