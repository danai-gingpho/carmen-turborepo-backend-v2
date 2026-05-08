import { Module } from '@nestjs/common';
import { Config_UnitsService } from './config_units.service';
import { Config_UnitsController } from './config_units.controller';
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
  controllers: [Config_UnitsController],
  providers: [Config_UnitsService],
})
export class Config_UnitsModule {}
