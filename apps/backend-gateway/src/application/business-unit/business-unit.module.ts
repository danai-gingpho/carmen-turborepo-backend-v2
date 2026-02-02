import { Module } from '@nestjs/common';
import { BusinessUnitService } from './business-unit.service';
import { BusinessUnitController } from './business-unit.controller';
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
  controllers: [BusinessUnitController],
  providers: [BusinessUnitService],
})
export class BusinessUnitModule {}
