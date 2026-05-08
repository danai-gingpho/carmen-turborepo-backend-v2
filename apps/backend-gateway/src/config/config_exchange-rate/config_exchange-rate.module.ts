import { Module } from '@nestjs/common';
import { Config_ExchangeRateService } from './config_exchange-rate.service';
import { Config_ExchangeRateController } from './config_exchange-rate.controller';
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
  controllers: [Config_ExchangeRateController],
  providers: [Config_ExchangeRateService],
})
export class Config_ExchangeRateModule {}
