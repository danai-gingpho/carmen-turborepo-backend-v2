import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { ConfigUserApplicationRoleService } from './config_user_application_role.service';
import { ConfigUserApplicationRoleController } from './config_user_application_role.controller';

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
  controllers: [ConfigUserApplicationRoleController],
  providers: [ConfigUserApplicationRoleService],
})
export class ConfigUserApplicationRoleModule { }
