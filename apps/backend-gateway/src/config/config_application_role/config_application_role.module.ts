import { Module } from '@nestjs/common'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { envConfig } from 'src/libs/config.env'
import { ConfigApplicationRoleService } from './config_application_role.service'
import { ConfigApplicationRoleController } from './config_application_role.controller'


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
  controllers: [ConfigApplicationRoleController],
  providers: [ConfigApplicationRoleService],
})
export class ConfigApplicationRoleModule { }