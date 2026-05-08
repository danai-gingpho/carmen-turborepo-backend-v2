import { Module } from '@nestjs/common';
import { Config_DeliveryPointService } from './config_delivery-point.service';
import { Config_DeliveryPointController } from './config_delivery-point.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BUSINESS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  controllers: [Config_DeliveryPointController],
  providers: [Config_DeliveryPointService],
})
export class Config_DeliveryPointModule {}
