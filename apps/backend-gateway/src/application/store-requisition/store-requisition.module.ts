import { Module } from '@nestjs/common';
import { StoreRequisitionService } from './store-requisition.service';
import { StoreRequisitionController } from './store-requisition.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.INVENTORY_SERVICE_HOST,
          port: Number(envConfig.INVENTORY_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [StoreRequisitionController],
  providers: [StoreRequisitionService],
})
export class StoreRequisitionModule {}
