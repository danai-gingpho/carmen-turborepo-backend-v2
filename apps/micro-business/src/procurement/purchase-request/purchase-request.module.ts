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
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';

@Module({
  imports: [
    CommonModule,
    TenantModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
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
  controllers: [PurchaseRequestController],
  providers: [
    PurchaseRequestService,
    PurchaseRequestLogic,
    WorkflowOrchestratorService,
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
