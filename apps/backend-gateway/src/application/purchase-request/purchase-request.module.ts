import { Module } from '@nestjs/common';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestController } from './purchase-request.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

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
  controllers: [PurchaseRequestController],
  providers: [PurchaseRequestService],
})
export class PurchaseRequestModule {}
