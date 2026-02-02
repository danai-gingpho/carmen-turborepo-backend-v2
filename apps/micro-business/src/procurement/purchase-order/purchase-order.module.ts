import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';
import { NotificationModule } from '@/common';
import { envConfig } from '@/libs/config.env';

@Module({
  imports: [
    TenantModule,
    CommonModule,
    NotificationModule.forRoot({
      host: envConfig.NOTIFICATION_SERVICE_HOST,
      port: envConfig.NOTIFICATION_SERVICE_PORT,
    }),
  ],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
