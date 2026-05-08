import { Module } from '@nestjs/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { PurchaseRequestTemplateController } from './purchase-request-template.controller';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';

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
  controllers: [PurchaseRequestTemplateController],
  providers: [PurchaseRequestTemplateService],
})
export class PurchaseRequestTemplateModule {}
