import { Module } from '@nestjs/common';
import { Config_VendorBusinessTypeService } from './config_vendor_business_type.service';
import { Config_VendorBusinessTypeController } from './config_vendor_business_type.controller';
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

  controllers: [Config_VendorBusinessTypeController],
  providers: [Config_VendorBusinessTypeService],
})
export class Config_VendorBusinessTypeModule {}
