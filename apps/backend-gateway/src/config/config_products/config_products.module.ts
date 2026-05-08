import { Module } from '@nestjs/common';
import { Config_ProductsService } from './config_products.service';
import { Config_ProductsController } from './config_products.controller';
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
  controllers: [Config_ProductsController],
  providers: [Config_ProductsService],
})
export class Config_ProductsModule {}
