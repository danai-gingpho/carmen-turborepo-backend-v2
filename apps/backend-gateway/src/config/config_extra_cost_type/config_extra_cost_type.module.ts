import { Module } from '@nestjs/common';
import { Config_ExtraCostTypeService } from './config_extra_cost_type.service';
import { Config_ExtraCostTypeController } from './config_extra_cost_type.controller';
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
  controllers: [Config_ExtraCostTypeController],
  providers: [Config_ExtraCostTypeService],
})
export class Config_ExtraCostTypeModule {}
