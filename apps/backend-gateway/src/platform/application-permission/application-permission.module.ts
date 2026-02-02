import { Module } from '@nestjs/common';
import { ApplicationPermissionService } from './application-permission.service';
import { ApplicationPermissionController } from './application-permission.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.AUTH_SERVICE_HOST,
          port: Number(envConfig.AUTH_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [ApplicationPermissionController],
  providers: [ApplicationPermissionService],
  exports: [ApplicationPermissionService],
})
export class ApplicationPermissionModule {}
