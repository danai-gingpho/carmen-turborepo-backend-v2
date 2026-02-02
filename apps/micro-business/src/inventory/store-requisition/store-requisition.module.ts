import { Module } from '@nestjs/common';
import { StoreRequisitionController } from './store-requisition.controller';
import { StoreRequisitionService } from './store-requisition.service';
import { TenantModule } from '@/tenant/tenant.module';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from '@/libs/config.env';
import { StoreRequisitionLogic } from './logic/store-requisition.logic';
import { NotificationModule } from '@/common';
import {
  MapperLogic,
  DepartmentMapper,
  WorkflowMapper,
  UserMapper,
  ProductMapper,
  LocationMapper,
} from '@/common/mapper';

@Module({
  imports: [
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
  controllers: [StoreRequisitionController],
  providers: [
    StoreRequisitionService,
    StoreRequisitionLogic,
    MapperLogic,
    DepartmentMapper,
    WorkflowMapper,
    UserMapper,
    ProductMapper,
    LocationMapper,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [StoreRequisitionService],
})
export class StoreRequisitionModule {}
