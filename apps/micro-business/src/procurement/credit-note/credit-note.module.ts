import { Module } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { CommonModule } from '@/common/common.module';
import { CreditNoteController } from './credit-note.controller';
import { CreditNoteService } from './credit-note.service';
import { CreditNoteLogic } from './credit-note.logic';
import { TenantService } from '@/tenant/tenant.service';
import { NotificationModule } from '@/common';
import { envConfig } from '@/libs/config.env';

@Module({
  imports: [
    CommonModule,
    NotificationModule.forRoot({
      host: envConfig.NOTIFICATION_SERVICE_HOST,
      port: envConfig.NOTIFICATION_SERVICE_PORT,
    }),
  ],
  controllers: [CreditNoteController],
  providers: [
    TenantService,
    CreditNoteService,
    CreditNoteLogic,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
})
export class CreditNoteModule {}
