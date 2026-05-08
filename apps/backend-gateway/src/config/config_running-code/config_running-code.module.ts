import { Module } from '@nestjs/common';
import { Config_RunningCodeService } from './config_running-code.service';
import { Config_RunningCodeController } from './config_running-code.controller';
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
  controllers: [Config_RunningCodeController],
  providers: [Config_RunningCodeService],
})
export class Config_RunningCodeModule {}
