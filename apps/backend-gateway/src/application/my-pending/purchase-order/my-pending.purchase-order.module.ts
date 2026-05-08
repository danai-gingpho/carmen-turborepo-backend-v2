import { Module } from '@nestjs/common';
import { MyPendingPurchaseOrderService } from './my-pending.purchase-order.service';
import { MyPendingPurchaseOrderController } from './my-pending.purchase-order.controller';
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
  controllers: [MyPendingPurchaseOrderController],
  providers: [MyPendingPurchaseOrderService],
})
export class MyPendingPurchaseOrderModule {}
