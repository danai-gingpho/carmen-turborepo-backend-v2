import { Module } from '@nestjs/common';
import { GoodReceivedNoteModule } from './good-received-note/good-received-note.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { PurchaseRequestModule } from './purchase-request/purchase-request.module';
import { StoreRequisitionModule } from './store-requisition/store-requisition.module';
import { CreditNoteModule } from './credit-note/credit-note.module';
import { UserModule } from './user/user.module';
import { ProductsModule } from './products/products.module';
import { LocationsModule } from './locations/locations.module';
import { WorkflowModule } from './workflow/workflow.module';
import { DepartmentModule } from './department/department.module';
import { UserLocationModule } from './user-location/user-location.module';
import { BusinessUnitModule } from './business-unit/business-unit.module';
import { CreditTermModule } from './credit-term/credit-term.module';
import { PurchaseRequestTemplateModule } from './purchase-request-template/purchase-request-template.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { PriceListModule } from './price-list/price-list.module';
import { PriceListTemplateModule } from './price-list-template/price-list-template.module';
import { CreditNoteReasonModule } from './credit-note-reason/credit-note-reason.module';
import { TaxProfileModule } from './tax-profile/tax-profile.module';
import { UnitConversionModule } from './unit-conversion/unit-conversion.module';
import { MyPendingStoreRequisitionModule } from './my-pending/store-requisition/my-pending.store-requisition.module';
import { MyPendingPurchaseRequestModule } from './my-pending/purchase-request/my-pending.purchase-request.module';
import { ApplicationRoleModule } from '../platform/application-role/application-role.module';
import { ApplicationPermissionModule } from '../platform/application-permission/application-permission.module';
import { ApplicationRolePermissionModule } from '../platform/application-role-permission/application-role-permission.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { DocumentManagementModule } from './document-management/document-management.module';
import { NewsModule } from './news/news.module';
import { PurchaseRequestCommentModule } from './purchase-request-comment/purchase-request-comment.module';
import { PhysicalCountModule } from './physical-count/physical-count.module';
import { SpotCheckModule } from './spot-check/spot-check.module';
import { StockInModule } from './stock-in/stock-in.module';
import { StockInDetailModule } from './stock-in-detail/stock-in-detail.module';
import { StockOutModule } from './stock-out/stock-out.module';
import { StockOutDetailModule } from './stock-out-detail/stock-out-detail.module';
import { TransferModule } from './transfer/transfer.module';
import { TransferDetailModule } from './transfer-detail/transfer-detail.module';
import { InventoryAdjustmentModule } from './inventory-adjustment/inventory-adjustment.module';
import { PeriodModule } from './period/period.module';
import { PhysicalCountPeriodModule } from './physical-count-period/physical-count-period.module';
@Module({
  imports: [
    ApplicationRoleModule,
    ApplicationPermissionModule,
    ApplicationRolePermissionModule,
    BusinessUnitModule,
    MyPendingStoreRequisitionModule,
    MyPendingPurchaseRequestModule,
    CreditNoteModule,
    CreditTermModule,
    GoodReceivedNoteModule,
    PurchaseOrderModule,
    PurchaseRequestModule,
    StoreRequisitionModule,
    ProductsModule,
    UserModule,
    LocationsModule,
    WorkflowModule,
    DepartmentModule,
    UserLocationModule,
    TaxProfileModule,
    PurchaseRequestTemplateModule,
    CurrenciesModule,
    PriceListModule,
    PriceListTemplateModule,
    CreditNoteReasonModule,
    UnitConversionModule,
    ActivityLogModule,
    DocumentManagementModule,
    NewsModule,
    PurchaseRequestCommentModule,
    PhysicalCountModule,
    SpotCheckModule,
    StockInModule,
    StockInDetailModule,
    StockOutModule,
    StockOutDetailModule,
    TransferModule,
    TransferDetailModule,
    InventoryAdjustmentModule,
    PeriodModule,
    PhysicalCountPeriodModule,
  ],
  controllers: [],
  providers: [],
})
export class RouteApplicationModule { }
