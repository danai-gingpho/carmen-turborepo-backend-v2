import { Module } from '@nestjs/common';
import { Config_DepartmentUserService } from './config_department-user.service';
import { Config_DepartmentUserController } from './config_department-user.controller';
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
  controllers: [Config_DepartmentUserController],
  providers: [Config_DepartmentUserService],
})
export class Config_DepartmentUserModule {}
