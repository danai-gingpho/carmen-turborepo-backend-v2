import { Module } from '@nestjs/common';
import { Config_ProductLocationService } from './config_product-location.service';
import { Config_ProductLocationController } from './config_product-location.controller';
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
  controllers: [Config_ProductLocationController],
  providers: [Config_ProductLocationService],
})
export class Config_ProductLocationModule {}
