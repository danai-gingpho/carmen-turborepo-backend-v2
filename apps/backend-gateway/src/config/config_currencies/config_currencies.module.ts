import { Module } from '@nestjs/common';
import { Config_CurrenciesService } from './config_currencies.service';
import { Config_CurrenciesController } from './config_currencies.controller';
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
  controllers: [Config_CurrenciesController],
  providers: [Config_CurrenciesService],
})
export class Config_CurrenciesModule {}
