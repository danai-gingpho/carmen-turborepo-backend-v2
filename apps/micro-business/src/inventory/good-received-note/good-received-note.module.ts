import { Module } from '@nestjs/common';
import { GoodReceivedNoteService } from './good-received-note.service';
import { GoodReceivedNoteLogic } from './good-received-note.logic';
import { GoodReceivedNoteController } from './good-received-note.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantModule } from '@/tenant/tenant.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from '@/libs/config.env';
import { NotificationModule } from '@/common';
import { InventoryTransactionModule } from '@/inventory/inventory-transaction/inventory-transaction.module';

@Module({
  imports: [
    TenantModule,
    InventoryTransactionModule,
    ClientsModule.register([
      {
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
    ]),
    NotificationModule.forRoot({
      host: envConfig.NOTIFICATION_SERVICE_HOST,
      port: envConfig.NOTIFICATION_SERVICE_TCP_PORT,
    }),
  ],
  controllers: [GoodReceivedNoteController],
  providers: [
    GoodReceivedNoteService,
    GoodReceivedNoteLogic,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [GoodReceivedNoteService],
})
export class GoodReceivedNoteModule {}
