import { Module } from '@nestjs/common';
import { Config_AdjustmentTypeService } from './config_adjustment-type.service';
import { Config_AdjustmentTypeController } from './config_adjustment-type.controller';
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
  controllers: [Config_AdjustmentTypeController],
  providers: [Config_AdjustmentTypeService],
})
export class Config_AdjustmentTypeModule {}
