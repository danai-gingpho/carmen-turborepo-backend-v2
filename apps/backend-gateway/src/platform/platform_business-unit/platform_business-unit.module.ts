import { Module } from '@nestjs/common';
import { Platform_BusinessUnitService } from './platform_business-unit.service';
import { Platform_BusinessUnitController } from './platform_business-unit.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

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
  controllers: [Platform_BusinessUnitController],
  providers: [Platform_BusinessUnitService],
})
export class Platform_BusinessUnitModule {}
