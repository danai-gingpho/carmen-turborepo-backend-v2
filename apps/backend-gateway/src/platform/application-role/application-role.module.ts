import { Module } from '@nestjs/common';
import { ApplicationRoleService } from './application-role.service';
import { ApplicationRoleController } from './application-role.controller';
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
  controllers: [ApplicationRoleController],
  providers: [ApplicationRoleService],
  exports: [ApplicationRoleService],
})
export class ApplicationRoleModule {}
