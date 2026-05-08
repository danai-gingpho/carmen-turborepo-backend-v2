import { Module } from '@nestjs/common';
import { Config_ProductItemGroupService } from './config_product-item-group.service';
import { Config_ProductItemGroupController } from './config_product-item-group.controller';
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
  controllers: [Config_ProductItemGroupController],
  providers: [Config_ProductItemGroupService],
})
export class Config_ProductItemGroupModule {}
