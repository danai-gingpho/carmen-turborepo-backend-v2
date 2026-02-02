import { Module } from '@nestjs/common';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { PurchaseRequestTemplateController } from './purchase-request-template.controller';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROCUREMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.PROCUREMENT_SERVICE_HOST,
          port: Number(envConfig.PROCUREMENT_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [PurchaseRequestTemplateController],
  providers: [PurchaseRequestTemplateService],
})
export class PurchaseRequestTemplateModule {}
