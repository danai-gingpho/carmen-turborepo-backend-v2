import { Module } from '@nestjs/common';
import { Config_DepartmentsService } from './config_departments.service';
import { Config_DepartmentsController } from './config_departments.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
@Module({
  imports: [
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
  controllers: [Config_DepartmentsController],
  providers: [Config_DepartmentsService],
})
export class Config_DepartmentsModule {}
