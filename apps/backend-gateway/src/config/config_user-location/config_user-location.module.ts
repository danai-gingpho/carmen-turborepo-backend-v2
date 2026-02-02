import { Module } from '@nestjs/common';
import { Config_UserLocationService } from './config_user-location.service';
import { Config_UserLocationController } from './config_user-location.controller';
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
  controllers: [Config_UserLocationController],
  providers: [Config_UserLocationService],
})
export class Config_UserLocationModule {}
