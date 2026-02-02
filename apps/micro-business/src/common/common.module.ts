import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from './libs/config.env';
import { CommonLogic } from './common.logic';
import { MapperLogic } from './mapper/mapper.logic';
import { DepartmentMapper } from './mapper/department.mapper';
import { WorkflowMapper } from './mapper/workflow.mapper';
import { ProductMapper } from './mapper/product.mapper';
import { UserMapper } from './mapper/user.mapper';
import { PriceListMapper } from './mapper/price-list.mapper';
import { VendorMapper } from './mapper/vendor.mapper';
import { CurrencyMapper } from './mapper/currency.mapper';
// import { TaxTypeInventoryMapper } from './mapper/tax-type-inventory.mapper';
import { UnitMapper } from './mapper/unit.mapper';
import { InventoryTransactionMapper } from './mapper/inventory-transaction.mapper';
import { LocationMapper } from './mapper/localtion.mapper';
import { CreditNoteReasonMapper } from './mapper/cnReasonMapper';
import { GoodReceivedNoteMapper } from './mapper/good-received-note.mapper';
import { CreditNoteReasonModule } from '@/procurement/credit-note-reason/credit-note-reason.module';
import { PriceListDetailMapper } from './mapper/price-list-detail.mapper';
import { DeliveryPointMapper } from './mapper/delivery-point.mapper';
import { TaxProfileMapper } from './mapper/tax-profile.mapper';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.AUTH_SERVICE_HOST,
          port: Number(envConfig.AUTH_SERVICE_PORT),
        },
      },
      {
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
        },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.INVENTORY_SERVICE_HOST,
          port: Number(envConfig.INVENTORY_SERVICE_PORT),
        },
      },
    ]),
    CreditNoteReasonModule,
  ],
  providers: [
    CommonLogic,
    MapperLogic,
    DepartmentMapper,
    WorkflowMapper,
    UserMapper,
    ProductMapper,
    PriceListMapper,
    VendorMapper,
    CurrencyMapper,
    // TaxTypeInventoryMapper,
    UnitMapper,
    InventoryTransactionMapper,
    LocationMapper,
    GoodReceivedNoteMapper,
    CreditNoteReasonMapper,
    PriceListDetailMapper,
    DeliveryPointMapper,
    TaxProfileMapper
  ],
  exports: [CommonLogic, MapperLogic],
})
export class CommonModule {}
