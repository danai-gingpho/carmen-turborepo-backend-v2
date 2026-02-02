import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from '@/libs/config.env';
import { CreditNoteReasonModule } from '@/procurement/credit-note-reason/credit-note-reason.module';

import { MapperLogic } from './mapper.logic';
import { DepartmentMapper } from './department.mapper';
import { WorkflowMapper } from './workflow.mapper';
import { UserMapper } from './user.mapper';
import { ProductMapper } from './product.mapper';
import { LocationMapper } from './localtion.mapper';
import { UnitMapper } from './unit.mapper';
import { CurrencyMapper } from './currency.mapper';
import { VendorMapper } from './vendor.mapper';
import { GoodReceivedNoteMapper } from './good-received-note.mapper';
import { CreditNoteReasonMapper } from './cnReasonMapper';
import { PriceListDetailMapper } from './price-list-detail.mapper';
import { DeliveryPointMapper } from './delivery-point.mapper';
import { TaxProfileMapper } from './tax-profile.mapper';

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
    MapperLogic,
    DepartmentMapper,
    WorkflowMapper,
    UserMapper,
    ProductMapper,
    LocationMapper,
    UnitMapper,
    CurrencyMapper,
    VendorMapper,
    GoodReceivedNoteMapper,
    CreditNoteReasonMapper,
    PriceListDetailMapper,
    DeliveryPointMapper,
    TaxProfileMapper,
  ],
  exports: [MapperLogic],
})
export class MapperModule {}
