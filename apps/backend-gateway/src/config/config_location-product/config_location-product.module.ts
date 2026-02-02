import { Module } from '@nestjs/common';
import { Config_LocationProductService } from './config_location-product.service';
import { Config_LocationProductController } from './config_location-product.controller';
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
  controllers: [Config_LocationProductController],
  providers: [Config_LocationProductService],
})
export class Config_LocationProductModule {}
