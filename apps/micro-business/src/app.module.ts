import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AuditContextInterceptor, LogEventsModule } from '@repo/log-events-library';
import { TraceContextInterceptor } from '@/common/interceptors/trace-context.interceptor';
import { SentryModule } from '@sentry/nestjs/setup';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

// Authen modules
import { AuthModule } from './authen/auth/auth.module';
import { ApplicationRoleModule } from './authen/role/role.module';
import { PermissionModule } from './authen/permission/permission.module';
import { ApplicationRolePermissionModule } from './authen/role_permission/role_permission.module';
import { UserApplicationRoleModule } from './authen/user_application_role/user_application_role.module';

// Cluster modules — moved to micro-cluster service

// Log modules
import { ActivityLogModule } from './log/activity-log/activity-log.module';

// Notification module removed - now runs as separate micro-notification service

// Inventory modules
import { GoodReceivedNoteModule } from './inventory/good-received-note/good-received-note.module';
import { InventoryTransactionModule } from './inventory/inventory-transaction/inventory-transaction.module';
import { StoreRequisitionModule } from './inventory/store-requisition/store-requisition.module';
import { StockInModule } from './inventory/stock-in/stock-in.module';
import { StockOutModule } from './inventory/stock-out/stock-out.module';
import { InventoryPeriodModule } from './inventory/period/period.module';
import { SpotCheckModule } from './inventory/spot-check/spot-check.module';
import { PhysicalCountModule } from './inventory/physical-count/physical-count.module';
import { PhysicalCountPeriodModule } from './inventory/physical-count-period/physical-count-period.module';

// Master modules
import { AdjustmentTypeModule } from './master/adjustment-type/adjustment-type.module';
import { CheckPriceListModule } from './master/check-price-list/check-price-list.module';
import { CreditTermModule } from './master/credit_term/credit_term.module';
import { CurrenciesModule as MasterCurrenciesModule } from './master/currencies/currencies.module';
import { DeliveryPointModule } from './master/delivery-point/delivery-point.module';
import { DepartmentUserModule } from './master/department-user/department-user.module';
import { DepartmentsModule } from './master/departments/departments.module';
import { ExchangeRateModule } from './master/exchange-rate/exchange-rate.module';
import { ExtraCostTypeModule } from './master/extra_cost_type/extra_cost_type.module';
import { LocationsModule } from './master/locations/locations.module';
import { PriceListModule } from './master/price-list/price-list.module';
import { PriceListTemplateModule } from './master/price-list-template/price-list-template.module';
import { ProductCategoryModule } from './master/product-category/product-category.module';
import { ProductItemGroupModule } from './master/product-item-group/product-item-group.module';
import { ProductSubCategoryModule } from './master/product-sub-category/product-sub-category.module';
import { ProductsModule } from './master/products/products.module';
import { RequestForPricingModule } from './master/request-for-pricing/request-for-pricing.module';
import { RunningCodeModule } from './master/running-code/running-code.module';
import { TaxProfileModule } from './master/tax_profile/tax_profile.module';
import { UnitConversionModule } from './master/unit-conversion/unit-conversion.module';
import { UnitsModule } from './master/units/units.module';
import { VendorBusinessTypeModule } from './master/vendor_business_type/vendor_business_type.module';
import { VendorsModule } from './master/vendors/vendors.module';
import { WorkflowsModule } from './master/workflows/workflows.module';
import { PeriodModule } from './master/period/period.module';
import { RecipeModule } from './master/recipe/recipe.module';
import { RecipeCategoryModule } from './master/recipe-category/recipe-category.module';
import { RecipeCuisineModule } from './master/recipe-cuisine/recipe-cuisine.module';
import { RecipeEquipmentModule } from './master/recipe-equipment/recipe-equipment.module';
import { RecipeEquipmentCategoryModule } from './master/recipe-equipment-category/recipe-equipment-category.module';
import { DashboardModule } from './master/dashboard/dashboard.module';

// Procurement modules
import { CreditNoteModule } from './procurement/credit-note/credit-note.module';
import { CreditNoteReasonModule } from './procurement/credit-note-reason/credit-note-reason.module';
import { IssueModule } from './procurement/issue/issue.module';
import { PurchaseOrderModule } from './procurement/purchase-order/purchase-order.module';
import { PurchaseRequestModule } from './procurement/purchase-request/purchase-request.module';
import { PurchaseRequestCommentModule } from './procurement/purchase-request-comment/purchase-request-comment.module';
import { GoodReceivedNoteCommentModule } from './procurement/good-received-note-comment/good-received-note-comment.module';
import { ConfigRunningCodeCommentModule } from './master/config-running-code-comment/config-running-code-comment.module';
import { CreditNoteCommentModule } from './procurement/credit-note-comment/credit-note-comment.module';
import { CreditNoteDetailCommentModule } from './procurement/credit-note-detail-comment/credit-note-detail-comment.module';
import { CreditTermCommentModule } from './master/credit-term-comment/credit-term-comment.module';
import { CurrencyCommentModule } from './master/currency-comment/currency-comment.module';
import { DeliveryPointCommentModule } from './master/delivery-point-comment/delivery-point-comment.module';
import { DepartmentCommentModule } from './master/department-comment/department-comment.module';
import { DimensionCommentModule } from './master/dimension-comment/dimension-comment.module';
import { ExchangeRateCommentModule } from './master/exchange-rate-comment/exchange-rate-comment.module';
import { ExtraCostCommentModule } from './procurement/extra-cost-comment/extra-cost-comment.module';
import { ExtraCostDetailCommentModule } from './procurement/extra-cost-detail-comment/extra-cost-detail-comment.module';
import { GoodReceivedNoteDetailCommentModule } from './procurement/good-received-note-detail-comment/good-received-note-detail-comment.module';
import { LocationCommentModule } from './master/location-comment/location-comment.module';
import { PeriodCommentModule } from './master/period-comment/period-comment.module';
import { PhysicalCountCommentModule } from './inventory/physical-count-comment/physical-count-comment.module';
import { PhysicalCountDetailCommentModule } from './inventory/physical-count-detail-comment/physical-count-detail-comment.module';
import { PhysicalCountPeriodCommentModule } from './inventory/physical-count-period-comment/physical-count-period-comment.module';
import { PricelistCommentModule } from './master/pricelist-comment/pricelist-comment.module';
import { PricelistDetailCommentModule } from './master/pricelist-detail-comment/pricelist-detail-comment.module';
import { PricelistTemplateCommentModule } from './master/pricelist-template-comment/pricelist-template-comment.module';
import { PricelistTemplateDetailCommentModule } from './master/pricelist-template-detail-comment/pricelist-template-detail-comment.module';
import { ProductCategoryCommentModule } from './master/product-category-comment/product-category-comment.module';
import { ProductCommentModule } from './master/product-comment/product-comment.module';
import { ProductItemGroupCommentModule } from './master/product-item-group-comment/product-item-group-comment.module';
import { ProductSubCategoryCommentModule } from './master/product-sub-category-comment/product-sub-category-comment.module';
import { PurchaseOrderCommentModule } from './procurement/purchase-order-comment/purchase-order-comment.module';
import { PurchaseOrderDetailCommentModule } from './procurement/purchase-order-detail-comment/purchase-order-detail-comment.module';
import { PurchaseRequestDetailCommentModule } from './procurement/purchase-request-detail-comment/purchase-request-detail-comment.module';
import { PurchaseRequestTemplateCommentModule } from './procurement/purchase-request-template-comment/purchase-request-template-comment.module';
import { RequestForPricingCommentModule } from './procurement/request-for-pricing-comment/request-for-pricing-comment.module';
import { RequestForPricingDetailCommentModule } from './procurement/request-for-pricing-detail-comment/request-for-pricing-detail-comment.module';
import { SpotCheckCommentModule } from './inventory/spot-check-comment/spot-check-comment.module';
import { SpotCheckDetailCommentModule } from './inventory/spot-check-detail-comment/spot-check-detail-comment.module';
import { StockInCommentModule } from './inventory/stock-in-comment/stock-in-comment.module';
import { StockInDetailCommentModule } from './inventory/stock-in-detail-comment/stock-in-detail-comment.module';
import { StockOutCommentModule } from './inventory/stock-out-comment/stock-out-comment.module';
import { StockOutDetailCommentModule } from './inventory/stock-out-detail-comment/stock-out-detail-comment.module';
import { StoreRequisitionCommentModule } from './inventory/store-requisition-comment/store-requisition-comment.module';
import { StoreRequisitionDetailCommentModule } from './inventory/store-requisition-detail-comment/store-requisition-detail-comment.module';
import { TaxProfileCommentModule } from './master/tax-profile-comment/tax-profile-comment.module';
import { UnitCommentModule } from './master/unit-comment/unit-comment.module';
import { VendorBusinessTypeCommentModule } from './master/vendor-business-type-comment/vendor-business-type-comment.module';
import { VendorCommentModule } from './master/vendor-comment/vendor-comment.module';
import { WorkflowCommentModule } from './master/workflow-comment/workflow-comment.module';
import { PurchaseRequestTemplateModule } from './procurement/purchase-request-template/purchase-request-template.module';

// Shared modules
import { TenantModule } from './tenant/tenant.module';
import { CommonModule } from './common/common.module';
import { AppConfigModule } from './app-config/app-config.module';
import { SqlQueryModule } from './sql-query/sql-query.module';

@Module({
  imports: [
    // Sentry for error tracking
    SentryModule.forRoot(),

    // Log events module for manual audit logging (login/logout, etc.)
    LogEventsModule.forRoot({
      logDirectory: process.env.AUDIT_LOG_DIR || './logs/audit',
      filePrefix: 'business-audit',
      rotationStrategy: 'daily',
      bufferSize: 100,
      flushIntervalMs: 5000,
      excludeModels: ['_prisma_migrations', 'tb_activity'],
      sensitiveFields: ['password', 'hash', 'token', 'secret', 'api_key'],
      saveToDatabase: false,
      saveToFile: true,
    }),

    // Shared modules
    TenantModule,
    CommonModule,
    AppConfigModule,
    SqlQueryModule,

    // Authen modules (from micro-authen)
    AuthModule,
    ApplicationRoleModule,
    PermissionModule,
    ApplicationRolePermissionModule,
    UserApplicationRoleModule,

    // Cluster modules — moved to micro-cluster service

    // Log modules (from micro-log)
    ActivityLogModule,

    // Notification module removed - now runs as separate micro-notification service on port 5006

    // Inventory modules (from micro-tenant-inventory)
    GoodReceivedNoteModule,
    InventoryTransactionModule,
    StoreRequisitionModule,
    StockInModule,
    StockOutModule,
    InventoryPeriodModule,
    SpotCheckModule,
    PhysicalCountModule,
    PhysicalCountPeriodModule,

    // Master modules (from micro-tenant-master)
    AdjustmentTypeModule,
    CheckPriceListModule,
    CreditTermModule,
    MasterCurrenciesModule,
    DeliveryPointModule,
    DepartmentUserModule,
    DepartmentsModule,
    ExchangeRateModule,
    ExtraCostTypeModule,
    LocationsModule,
    PriceListModule,
    PriceListTemplateModule,
    ProductCategoryModule,
    ProductItemGroupModule,
    ProductSubCategoryModule,
    ProductsModule,
    RequestForPricingModule,
    RunningCodeModule,
    TaxProfileModule,
    UnitConversionModule,
    UnitsModule,
    VendorBusinessTypeModule,
    VendorsModule,
    WorkflowsModule,
    PeriodModule,
    RecipeModule,
    RecipeCategoryModule,
    RecipeCuisineModule,
    RecipeEquipmentModule,
    RecipeEquipmentCategoryModule,
    DashboardModule,

    // Procurement modules (from micro-tenant-procurement)
    CreditNoteModule,
    CreditNoteReasonModule,
    IssueModule,
    PurchaseOrderModule,
    PurchaseRequestModule,
    PurchaseRequestCommentModule,
    PurchaseRequestTemplateModule,
    GoodReceivedNoteCommentModule,
    ConfigRunningCodeCommentModule,
    CreditNoteCommentModule,
    CreditNoteDetailCommentModule,
    CreditTermCommentModule,
    CurrencyCommentModule,
    DeliveryPointCommentModule,
    DepartmentCommentModule,
    DimensionCommentModule,
    ExchangeRateCommentModule,
    ExtraCostCommentModule,
    ExtraCostDetailCommentModule,
    GoodReceivedNoteDetailCommentModule,
    LocationCommentModule,
    PeriodCommentModule,
    PhysicalCountCommentModule,
    PhysicalCountDetailCommentModule,
    PhysicalCountPeriodCommentModule,
    PricelistCommentModule,
    PricelistDetailCommentModule,
    PricelistTemplateCommentModule,
    PricelistTemplateDetailCommentModule,
    ProductCategoryCommentModule,
    ProductCommentModule,
    ProductItemGroupCommentModule,
    ProductSubCategoryCommentModule,
    PurchaseOrderCommentModule,
    PurchaseOrderDetailCommentModule,
    PurchaseRequestDetailCommentModule,
    PurchaseRequestTemplateCommentModule,
    RequestForPricingCommentModule,
    RequestForPricingDetailCommentModule,
    SpotCheckCommentModule,
    SpotCheckDetailCommentModule,
    StockInCommentModule,
    StockInDetailCommentModule,
    StockOutCommentModule,
    StockOutDetailCommentModule,
    StoreRequisitionCommentModule,
    StoreRequisitionDetailCommentModule,
    TaxProfileCommentModule,
    UnitCommentModule,
    VendorBusinessTypeCommentModule,
    VendorCommentModule,
    WorkflowCommentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BackendLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: TraceContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
})
export class AppModule {}
