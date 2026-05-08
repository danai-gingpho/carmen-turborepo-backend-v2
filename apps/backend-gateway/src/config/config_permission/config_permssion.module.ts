import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices'
import { envConfig } from 'src/libs/config.env'
import { ConfigPermissionController } from './config_permission.controller';
import { ConfigPermissionService } from './config_permission.service';


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
  controllers: [ConfigPermissionController],
  providers: [ConfigPermissionService],
})
export class ConfigPermissionModule { }