import { Module } from '@nestjs/common';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@/common/common.module';
import { envConfig } from '@/libs/config.env';
import { PurchaseRequestLogic } from './logic/purchase-request.logic';
import { NotificationModule } from '@/common';

@Module({
  imports: [
    CommonModule,
    TenantModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.AUTH_SERVICE_HOST,
          port: Number(envConfig.AUTH_SERVICE_PORT),
        },
      },
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
  controllers: [PurchaseRequestController],
  providers: [
    PurchaseRequestService,
    PurchaseRequestLogic,
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
export class PurchaseRequestModule {}
