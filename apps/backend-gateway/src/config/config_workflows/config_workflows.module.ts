import { Module } from '@nestjs/common';
import { Config_WorkflowsService } from './config_workflows.service';
import { Config_WorkflowsController } from './config_workflows.controller';
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
  controllers: [Config_WorkflowsController],
  providers: [Config_WorkflowsService],
})
export class Config_WorkflowsModule {}
