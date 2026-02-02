import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant/dist';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from '@/libs/config.env';

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
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    TenantService,
  ],
  exports: ['PRISMA_SYSTEM', 'PRISMA_TENANT', TenantService],
})
export class TenantModule {}
