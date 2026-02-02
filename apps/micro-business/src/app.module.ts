import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AuditContextInterceptor } from '@repo/log-events-library';
import { SentryModule } from '@sentry/nestjs/setup';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';

// Authen modules
import { AuthModule } from './authen/auth/auth.module';
import { ApplicationRoleModule } from './authen/role/role.module';
import { PermissionModule } from './authen/permission/permission.module';
import { ApplicationRolePermissionModule } from './authen/role_permission/role_permission.module';
import { UserApplicationRoleModule } from './authen/user_application_role/user_application_role.module';

// Cluster modules
import { ClusterModule } from './cluster/cluster/cluster.module';
import { BusinessUnitModule } from './cluster/business-unit/business-unit.module';
import { CurrenciesModule as ClusterCurrenciesModule } from './cluster/currencies/currencies.module';
import { NewsModule } from './cluster/news/news.module';

// Log modules
import { ActivityLogModule } from './log/activity-log/activity-log.module';

// Notification module
import { NotificationModule } from './notification/notification.module';

// Inventory modules
import { GoodReceivedNoteModule } from './inventory/good-received-note/good-received-note.module';
import { InventoryTransactionModule } from './inventory/inventory-transaction/inventory-transaction.module';
import { StoreRequisitionModule } from './inventory/store-requisition/store-requisition.module';
import { StockInModule } from './inventory/stock-in/stock-in.module';
import { StockOutModule } from './inventory/stock-out/stock-out.module';
import { TransferModule } from './inventory/transfer/transfer.module';

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

// Procurement modules
import { CreditNoteModule } from './procurement/credit-note/credit-note.module';
import { CreditNoteReasonModule } from './procurement/credit-note-reason/credit-note-reason.module';
import { IssueModule } from './procurement/issue/issue.module';
import { PurchaseOrderModule } from './procurement/purchase-order/purchase-order.module';
import { PurchaseRequestModule } from './procurement/purchase-request/purchase-request.module';
import { PurchaseRequestCommentModule } from './procurement/purchase-request-comment/purchase-request-comment.module';
import { PurchaseRequestTemplateModule } from './procurement/purchase-request-template/purchase-request-template.module';

// Shared modules
import { TenantModule } from './tenant/tenant.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Sentry for error tracking
    SentryModule.forRoot(),

    // Shared modules
    TenantModule,
    CommonModule,

    // Authen modules (from micro-authen)
    AuthModule,
    ApplicationRoleModule,
    PermissionModule,
    ApplicationRolePermissionModule,
    UserApplicationRoleModule,

    // Cluster modules (from micro-cluster)
    ClusterModule,
    BusinessUnitModule,
    ClusterCurrenciesModule,
    NewsModule,

    // Log modules (from micro-log)
    ActivityLogModule,

    // Notification module (converted from micro-notification Elysia to NestJS)
    NotificationModule,

    // Inventory modules (from micro-tenant-inventory)
    GoodReceivedNoteModule,
    InventoryTransactionModule,
    StoreRequisitionModule,
    StockInModule,
    StockOutModule,
    TransferModule,

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

    // Procurement modules (from micro-tenant-procurement)
    CreditNoteModule,
    CreditNoteReasonModule,
    IssueModule,
    PurchaseOrderModule,
    PurchaseRequestModule,
    PurchaseRequestCommentModule,
    PurchaseRequestTemplateModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BackendLogger,
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
