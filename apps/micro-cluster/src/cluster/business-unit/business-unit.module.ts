import { Module } from '@nestjs/common';
import { BusinessUnitService } from './business-unit.service';
import { BusinessUnitController } from './business-unit.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KEYCLOAK_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.KEYCLOAK_API_SERVICE_HOST,
          port: Number(envConfig.KEYCLOAK_API_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  controllers: [BusinessUnitController],
  providers: [
    BusinessUnitService,
    BackendLogger,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [BusinessUnitService],
})
export class BusinessUnitModule {}
