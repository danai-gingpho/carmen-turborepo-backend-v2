import { Module } from '@nestjs/common';
import { Config_DeliveryPointService } from './config_delivery-point.service';
import { Config_DeliveryPointController } from './config_delivery-point.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
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
  ],
  controllers: [Config_DeliveryPointController],
  providers: [Config_DeliveryPointService],
})
export class Config_DeliveryPointModule {}
