import { Module } from '@nestjs/common';
import { Config_VendorsService } from './config_vendors.service';
import { Config_VendorsController } from './config_vendors.controller';
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
  controllers: [Config_VendorsController],
  providers: [Config_VendorsService],
})
export class Config_VendorsModule {}
