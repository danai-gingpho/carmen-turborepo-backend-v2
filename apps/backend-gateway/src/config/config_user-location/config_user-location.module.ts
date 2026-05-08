import { Module } from '@nestjs/common';
import { Config_UserLocationService } from './config_user-location.service';
import { Config_UserLocationController } from './config_user-location.controller';
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
  controllers: [Config_UserLocationController],
  providers: [Config_UserLocationService],
})
export class Config_UserLocationModule {}
