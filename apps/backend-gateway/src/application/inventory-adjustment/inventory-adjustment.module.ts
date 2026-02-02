import { Module } from '@nestjs/common';
import { InventoryAdjustmentService } from './inventory-adjustment.service';
import { InventoryAdjustmentController } from './inventory-adjustment.controller';
import { envConfig } from 'src/libs/config.env';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';

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
  controllers: [InventoryAdjustmentController],
  providers: [InventoryAdjustmentService],
})
export class InventoryAdjustmentModule {}
