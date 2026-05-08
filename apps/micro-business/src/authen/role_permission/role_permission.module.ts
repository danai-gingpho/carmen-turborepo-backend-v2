import { Module } from '@nestjs/common';
import { ApplicationRolePermissionService } from './role_permission.service';
import { ApplicationRolePermissionController } from './role_permission.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from '@/libs/config.env';

@Module({
  imports: [
    TenantModule,
    ClientsModule.register([
      {
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  controllers: [ApplicationRolePermissionController],
  providers: [
    ApplicationRolePermissionService
  ],
})
export class ApplicationRolePermissionModule {}
