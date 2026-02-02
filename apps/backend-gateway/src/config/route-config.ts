import { Module } from '@nestjs/common';
import { Config_AdjustmentTypeModule } from './config_adjustment-type/config_adjustment-type.module';
import { Config_CurrenciesModule } from './config_currencies/config_currencies.module';
import { Config_DeliveryPointModule } from './config_delivery-point/config_delivery-point.module';
import { Config_DepartmentsModule } from './config_departments/config_departments.module';
import { Config_ExchangeRateModule } from './config_exchange-rate/config_exchange-rate.module';
import { Config_LocationsModule } from './config_locations/config_locations.module';
import { Config_ProductCategoryModule } from './config_product-category/config_product-category.module';
import { Config_ProductItemGroupModule } from './config_product-item-group/config_product-item-group.module';
import { Config_ProductSubCategoryModule } from './config_product-sub-category/config_product-sub-category.module';
import { Config_ProductsModule } from './config_products/config_products.module';
import { Config_UnitsModule } from './config_units/config_units.module';
import { Config_VendorsModule } from './config_vendors/config_vendors.module';
import { Config_WorkflowsModule } from './config_workflows/config_workflows.module';
import { Config_RunningCodeModule } from './config_running-code/config_running-code.module';
import { Config_VendorBusinessTypeModule } from './config_vendor_business_type/config_vendor_business_type.module';
import { Config_CreditTermModule } from './config_credit_term/config_credit_term.module';
import { Config_ExtraCostTypeModule } from './config_extra_cost_type/config_extra_cost_type.module';
import { Config_TaxProfileModule } from './config_tax_profile/config_tax_profile.module';
import { Config_PriceListModule } from './config_price-list/config_price-list.module';
// import { Config_UserLocationModule } from './config_user-location/config_user-location.module';
// import { Config_UnitCommentModule } from './config_unit_comment/config_unit_comment.module';
import { ConfigCronjobModule } from './config_cronjob/config_cronjob.module';
import { ConfigApplicationRoleModule } from './config_application_role/config_application_role.module';
import { ConfigPermissionModule } from './config_permission/config_permssion.module';
import { ConfigUserApplicationRoleModule } from './config_user_application_role/config_user_application_role.module';

@Module({
  imports: [
    Config_AdjustmentTypeModule,
    Config_CurrenciesModule,
    Config_DeliveryPointModule,
    Config_DepartmentsModule,
    Config_ExchangeRateModule,
    Config_LocationsModule,
    Config_PriceListModule,
    Config_ProductCategoryModule,
    Config_ProductItemGroupModule,
    Config_ProductSubCategoryModule,
    Config_ProductsModule,
    Config_UnitsModule,
    Config_VendorsModule,
    Config_WorkflowsModule,
    Config_RunningCodeModule,
    Config_VendorBusinessTypeModule,
    Config_CreditTermModule,
    Config_ExtraCostTypeModule,
    Config_TaxProfileModule,
    ConfigApplicationRoleModule,
    ConfigPermissionModule,
    ConfigUserApplicationRoleModule,
    // Config_UserLocationModule,
    // Config_UnitCommentModule,
    ConfigCronjobModule,
  ],
  controllers: [],
  providers: [],
})
export class RouteConfigModule { }
