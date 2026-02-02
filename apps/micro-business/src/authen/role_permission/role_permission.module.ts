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
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
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
