import { Module } from '@nestjs/common';
import { MyPendingPurchaseRequestService } from './my-pending.purchase-request.service';
import { MyPendingPurchaseRequestController } from './my-pending.purchase-request.controller';
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
  controllers: [MyPendingPurchaseRequestController],
  providers: [MyPendingPurchaseRequestService],
})
export class MyPendingPurchaseRequestModule {}
