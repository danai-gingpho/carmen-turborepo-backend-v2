import { Module } from '@nestjs/common';
import { Config_PriceListService } from './config_price-list.service';
import { Config_PriceListController } from './config_price-list.controller';
import { ClientsModule } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { Transport } from '@nestjs/microservices';

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
  controllers: [Config_PriceListController],
  providers: [Config_PriceListService],
})
export class Config_PriceListModule {}
