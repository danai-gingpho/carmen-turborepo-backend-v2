import { Module } from '@nestjs/common';
import { CommonModule } from '@/common/common.module';
import { CreditNoteController } from './credit-note.controller';
import { CreditNoteService } from './credit-note.service';
import { CreditNoteLogic } from './credit-note.logic';
import { TenantModule } from '@/tenant/tenant.module';
import { NotificationModule } from '@/common';
import { envConfig } from '@/libs/config.env';

@Module({
  imports: [
    TenantModule,
    CommonModule,
    NotificationModule.forRoot({
      host: envConfig.NOTIFICATION_SERVICE_HOST,
      port: envConfig.NOTIFICATION_SERVICE_PORT,
    }),
  ],
  controllers: [CreditNoteController],
  providers: [CreditNoteService, CreditNoteLogic],
})
export class CreditNoteModule {}
