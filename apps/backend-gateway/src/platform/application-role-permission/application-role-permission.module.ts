import { Module } from '@nestjs/common';
import { ApplicationRolePermissionService } from './application-role-permission.service';
import { ApplicationRolePermissionController } from './application-role-permission.controller';
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
  controllers: [ApplicationRolePermissionController],
  providers: [ApplicationRolePermissionService],
  exports: [ApplicationRolePermissionService],
})
export class ApplicationRolePermissionModule {}
