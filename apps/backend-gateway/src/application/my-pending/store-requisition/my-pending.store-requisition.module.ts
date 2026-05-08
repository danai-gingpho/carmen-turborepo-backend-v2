import { Module } from '@nestjs/common';
import { MyPendingStoreRequisitionService } from './my-pending.store-requisition.service';
import { MyPendingStoreRequisitionController } from './my-pending.store-requisition.controller';
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
  controllers: [MyPendingStoreRequisitionController],
  providers: [MyPendingStoreRequisitionService],
})
export class MyPendingStoreRequisitionModule {}
