import { Module } from '@nestjs/common';
import { MyPendingPurchaseRequestService } from './my-pending.purchase-request.service';
import { MyPendingPurchaseRequestController } from './my-pending.purchase-request.controller';
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
  controllers: [MyPendingPurchaseRequestController],
  providers: [MyPendingPurchaseRequestService],
})
export class MyPendingPurchaseRequestModule {}
