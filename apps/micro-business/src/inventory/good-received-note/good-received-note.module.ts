import { Module } from '@nestjs/common';
import { GoodReceivedNoteService } from './good-received-note.service';
import { GoodReceivedNoteController } from './good-received-note.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantModule } from '@/tenant/tenant.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from '@/libs/config.env';
import { NotificationModule } from '@/common';

@Module({
  imports: [
    TenantModule,
    ClientsModule.register([
      {
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
        },
      },
    ]),
    NotificationModule.forRoot({
      host: envConfig.NOTIFICATION_SERVICE_HOST,
      port: envConfig.NOTIFICATION_SERVICE_PORT,
    }),
  ],
  controllers: [GoodReceivedNoteController],
  providers: [
    GoodReceivedNoteService,
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
