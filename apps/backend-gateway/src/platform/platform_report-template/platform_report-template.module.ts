import { Module } from '@nestjs/common';
import { Platform_ReportTemplateService } from './platform_report-template.service';
import { Platform_ReportTemplateController } from './platform_report-template.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CLUSTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.CLUSTER_SERVICE_HOST,
          port: Number(envConfig.CLUSTER_SERVICE_TCP_PORT),
        },
      },
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
  controllers: [Platform_ReportTemplateController],
  providers: [Platform_ReportTemplateService],
})
export class Platform_ReportTemplateModule {}
