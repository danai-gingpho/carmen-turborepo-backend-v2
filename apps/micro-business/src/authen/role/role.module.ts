import { Module } from '@nestjs/common';
import { ApplicationRoleService } from './role.service';
import { ApplicationRoleController } from './role.controller';
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
  controllers: [ApplicationRoleController],
  providers: [
    ApplicationRoleService
  ],
})
export class ApplicationRoleModule {}
