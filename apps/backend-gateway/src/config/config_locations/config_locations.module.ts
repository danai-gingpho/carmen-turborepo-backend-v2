import { Module } from '@nestjs/common';
import { Config_LocationsService } from './config_locations.service';
import { Config_LocationsController } from './config_locations.controller';
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
  controllers: [Config_LocationsController],
  providers: [Config_LocationsService],
})
export class Config_LocationsModule {}
