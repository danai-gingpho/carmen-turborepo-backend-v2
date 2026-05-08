import { Module } from '@nestjs/common';
import { GoodReceivedNoteModule } from './good-received-note/good-received-note.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { PurchaseRequestModule } from './purchase-request/purchase-request.module';
import { StoreRequisitionModule } from './store-requisition/store-requisition.module';
import { CreditNoteModule } from './credit-note/credit-note.module';
import { UserModule } from './user/user.module';
import { ProductsModule } from './products/products.module';
import { CostModule } from './cost/cost.module';
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
import { MyPendingPurchaseOrderModule } from './my-pending/purchase-order/my-pending.purchase-order.module';
import { MyApproveModule } from './my-pending/my-approve/my-approve.module';
import { ApplicationRoleModule } from '../platform/application-role/application-role.module';
import { ApplicationPermissionModule } from '../platform/application-permission/application-permission.module';
import { ApplicationRolePermissionModule } from '../platform/application-role-permission/application-role-permission.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { DocumentManagementModule } from './document-management/document-management.module';
import { NewsModule } from './news/news.module';
import { PurchaseRequestCommentModule } from './purchase-request-comment/purchase-request-comment.module';
import { CreditNoteCommentModule } from './credit-note-comment/credit-note-comment.module';
import { CreditNoteDetailCommentModule } from './credit-note-detail-comment/credit-note-detail-comment.module';
import { ExtraCostCommentModule } from './extra-cost-comment/extra-cost-comment.module';
import { ExtraCostDetailCommentModule } from './extra-cost-detail-comment/extra-cost-detail-comment.module';
import { GoodReceivedNoteCommentModule } from './good-received-note-comment/good-received-note-comment.module';
import { GoodReceivedNoteDetailCommentModule } from './good-received-note-detail-comment/good-received-note-detail-comment.module';
import { PurchaseOrderCommentModule } from './purchase-order-comment/purchase-order-comment.module';
import { PurchaseOrderDetailCommentModule } from './purchase-order-detail-comment/purchase-order-detail-comment.module';
import { PurchaseRequestDetailCommentModule } from './purchase-request-detail-comment/purchase-request-detail-comment.module';
import { PurchaseRequestTemplateCommentModule } from './purchase-request-template-comment/purchase-request-template-comment.module';
import { RequestForPricingCommentModule } from './request-for-pricing-comment/request-for-pricing-comment.module';
import { RequestForPricingDetailCommentModule } from './request-for-pricing-detail-comment/request-for-pricing-detail-comment.module';
import { PhysicalCountCommentModule } from './physical-count-comment/physical-count-comment.module';
import { PhysicalCountDetailCommentModule } from './physical-count-detail-comment/physical-count-detail-comment.module';
import { PhysicalCountPeriodCommentModule } from './physical-count-period-comment/physical-count-period-comment.module';
import { SpotCheckCommentModule } from './spot-check-comment/spot-check-comment.module';
import { SpotCheckDetailCommentModule } from './spot-check-detail-comment/spot-check-detail-comment.module';
import { StockInCommentModule } from './stock-in-comment/stock-in-comment.module';
import { StockInDetailCommentModule } from './stock-in-detail-comment/stock-in-detail-comment.module';
import { StockOutCommentModule } from './stock-out-comment/stock-out-comment.module';
import { StockOutDetailCommentModule } from './stock-out-detail-comment/stock-out-detail-comment.module';
import { StoreRequisitionCommentModule } from './store-requisition-comment/store-requisition-comment.module';
import { StoreRequisitionDetailCommentModule } from './store-requisition-detail-comment/store-requisition-detail-comment.module';
import { ConfigRunningCodeCommentModule } from './config-running-code-comment/config-running-code-comment.module';
import { CreditTermCommentModule } from './credit-term-comment/credit-term-comment.module';
import { CurrencyCommentModule } from './currency-comment/currency-comment.module';
import { DeliveryPointCommentModule } from './delivery-point-comment/delivery-point-comment.module';
import { DepartmentCommentModule } from './department-comment/department-comment.module';
import { DimensionCommentModule } from './dimension-comment/dimension-comment.module';
import { ExchangeRateCommentModule } from './exchange-rate-comment/exchange-rate-comment.module';
import { LocationCommentModule } from './location-comment/location-comment.module';
import { PeriodCommentModule } from './period-comment/period-comment.module';
import { PricelistCommentModule } from './pricelist-comment/pricelist-comment.module';
import { PricelistDetailCommentModule } from './pricelist-detail-comment/pricelist-detail-comment.module';
import { PricelistTemplateCommentModule } from './pricelist-template-comment/pricelist-template-comment.module';
import { PricelistTemplateDetailCommentModule } from './pricelist-template-detail-comment/pricelist-template-detail-comment.module';
import { ProductCommentModule } from './product-comment/product-comment.module';
import { ProductCategoryCommentModule } from './product-category-comment/product-category-comment.module';
import { ProductItemGroupCommentModule } from './product-item-group-comment/product-item-group-comment.module';
import { ProductSubCategoryCommentModule } from './product-sub-category-comment/product-sub-category-comment.module';
import { TaxProfileCommentModule } from './tax-profile-comment/tax-profile-comment.module';
import { UnitCommentModule } from './unit-comment/unit-comment.module';
import { VendorCommentModule } from './vendor-comment/vendor-comment.module';
import { VendorBusinessTypeCommentModule } from './vendor-business-type-comment/vendor-business-type-comment.module';
import { WorkflowCommentModule } from './workflow-comment/workflow-comment.module';
import { PhysicalCountModule } from './physical-count/physical-count.module';
import { SpotCheckModule } from './spot-check/spot-check.module';
import { StockInModule } from './stock-in/stock-in.module';
import { StockInDetailModule } from './stock-in-detail/stock-in-detail.module';
import { StockOutModule } from './stock-out/stock-out.module';
import { StockOutDetailModule } from './stock-out-detail/stock-out-detail.module';
import { InventoryAdjustmentModule } from './inventory-adjustment/inventory-adjustment.module';
import { InventoryTransactionModule } from './inventory-transaction/inventory-transaction.module'; // ⚠️ TEST ONLY — DELETE when GRN approve integration is verified
import { PeriodModule } from './period/period.module';
import { PhysicalCountPeriodModule } from './physical-count-period/physical-count-period.module';
import { VendorProductModule } from './vendor-product/vendor-product.module';
import { ReportModule } from './report/report.module';
import { DashboardModule } from './dashboard/dashboard.module';
@Module({
  imports: [
    ApplicationRoleModule,
    ApplicationPermissionModule,
    ApplicationRolePermissionModule,
    BusinessUnitModule,
    MyPendingStoreRequisitionModule,
    MyPendingPurchaseRequestModule,
    MyPendingPurchaseOrderModule,
    MyApproveModule,
    CreditNoteModule,
    CreditTermModule,
    GoodReceivedNoteModule,
    PurchaseOrderModule,
    PurchaseRequestModule,
    StoreRequisitionModule,
    ProductsModule,
    CostModule,
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
    CreditNoteCommentModule,
    CreditNoteDetailCommentModule,
    ExtraCostCommentModule,
    ExtraCostDetailCommentModule,
    GoodReceivedNoteCommentModule,
    GoodReceivedNoteDetailCommentModule,
    PurchaseOrderCommentModule,
    PurchaseOrderDetailCommentModule,
    PurchaseRequestDetailCommentModule,
    PurchaseRequestTemplateCommentModule,
    RequestForPricingCommentModule,
    RequestForPricingDetailCommentModule,
    PhysicalCountCommentModule,
    PhysicalCountDetailCommentModule,
    PhysicalCountPeriodCommentModule,
    SpotCheckCommentModule,
    SpotCheckDetailCommentModule,
    StockInCommentModule,
    StockInDetailCommentModule,
    StockOutCommentModule,
    StockOutDetailCommentModule,
    StoreRequisitionCommentModule,
    StoreRequisitionDetailCommentModule,
    ConfigRunningCodeCommentModule,
    CreditTermCommentModule,
    CurrencyCommentModule,
    DeliveryPointCommentModule,
    DepartmentCommentModule,
    DimensionCommentModule,
    ExchangeRateCommentModule,
    LocationCommentModule,
    PeriodCommentModule,
    PricelistCommentModule,
    PricelistDetailCommentModule,
    PricelistTemplateCommentModule,
    PricelistTemplateDetailCommentModule,
    ProductCommentModule,
    ProductCategoryCommentModule,
    ProductItemGroupCommentModule,
    ProductSubCategoryCommentModule,
    TaxProfileCommentModule,
    UnitCommentModule,
    VendorCommentModule,
    VendorBusinessTypeCommentModule,
    WorkflowCommentModule,
    PhysicalCountModule,
    SpotCheckModule,
    StockInModule,
    StockInDetailModule,
    StockOutModule,
    StockOutDetailModule,
    InventoryAdjustmentModule,
    InventoryTransactionModule, // ⚠️ TEST ONLY — DELETE when GRN approve integration is verified
    PeriodModule,
    PhysicalCountPeriodModule,
    VendorProductModule,
    ReportModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class RouteApplicationModule { }
