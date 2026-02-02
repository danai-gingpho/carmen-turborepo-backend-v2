import { Module } from '@nestjs/common';
import { BusinessUnitService } from './business-unit.service';
import { BusinessUnitController } from './business-unit.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { TenantModule } from '@/tenant/tenant.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CLUSTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.CLUSTER_SERVICE_HOST,
          port: Number(envConfig.CLUSTER_SERVICE_PORT),
        },
      },
      {
        name: 'KEYCLOAK_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.KEYCLOAK_API_SERVICE_HOST,
          port: Number(envConfig.KEYCLOAK_API_SERVICE_PORT),
        },
      },
    ]),
    TenantModule,
  ],
  controllers: [BusinessUnitController],
  providers: [
    BusinessUnitService,
    BackendLogger,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [BusinessUnitService],
})
export class BusinessUnitModule {}
