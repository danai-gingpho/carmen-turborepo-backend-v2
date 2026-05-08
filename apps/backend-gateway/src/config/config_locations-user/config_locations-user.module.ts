import { Module } from '@nestjs/common';
import { Config_LocationsUserService } from './config_locations-user.service';
import { Config_LocationsUserController } from './config_locations-user.controller';
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
  controllers: [Config_LocationsUserController],
  providers: [Config_LocationsUserService],
})
export class Config_LocationsUserModule {}
