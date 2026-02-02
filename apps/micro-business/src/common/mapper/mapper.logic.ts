import { Injectable } from '@nestjs/common';
import { DepartmentMapper } from './department.mapper';
import { WorkflowMapper } from './workflow.mapper';
import { UserMapper } from './user.mapper';
import { ProductMapper } from './product.mapper';
import { UnitMapper } from './unit.mapper';
// import { TaxTypeInventoryMapper } from './tax-type-inventory.mapper';
import { CurrencyMapper } from './currency.mapper';
import { VendorMapper } from './vendor.mapper';
import { LocationMapper } from './localtion.mapper';
import { GoodReceivedNoteMapper } from './good-received-note.mapper';
import { CreditNoteReasonMapper } from './cnReasonMapper';
import { PriceListDetailMapper } from './price-list-detail.mapper';
import { DeliveryPointMapper } from './delivery-point.mapper';
import { TaxProfileMapper } from './tax-profile.mapper';

@Injectable()
export class MapperLogic {
  constructor(
    private readonly departmentMapper: DepartmentMapper,
    private readonly workflowMapper: WorkflowMapper,
    private readonly userMapper: UserMapper,
    private readonly productMapper: ProductMapper,
    private readonly unitMapper: UnitMapper,
    private readonly currencyMapper: CurrencyMapper,
    // private readonly taxTypeInventoryMapper: TaxTypeInventoryMapper,
    private readonly vendorMapper: VendorMapper,
    private readonly locationMapper: LocationMapper,
    private readonly goodReceivedNoteMapper: GoodReceivedNoteMapper,
    private readonly creditNoteReasonMapper: CreditNoteReasonMapper,
    private readonly priceListDetailMapper: PriceListDetailMapper,
    private readonly deliveryPointMapper: DeliveryPointMapper,
    private readonly taxProfileMapper: TaxProfileMapper,
  ) { }

  deadValue = null

  populateMapper = {
    department_id: this.departmentMapper,
    workflow_id: this.workflowMapper,
    requestor_id: this.userMapper,
    product_ids: this.productMapper,
    unit_ids: this.unitMapper,
    currency_ids: this.currencyMapper,
    vendor_ids: this.vendorMapper,
    location_ids: this.locationMapper,
    grn_id: this.goodReceivedNoteMapper,
    cn_reason_id: this.creditNoteReasonMapper,
    user_id: this.userMapper,
    pricelist_detail_ids: this.priceListDetailMapper,
    delivery_point_ids: this.deliveryPointMapper,
    tax_profile_ids: this.taxProfileMapper
  };

  async populate(data: any, user_id: string, bu_code: string) {
    const result = {};
    for (const key in data) {
      this.deadValue = key
      if (
        (key.includes('_id') && data[key]) ||
        (key.includes('_ids') && data[key].length > 0)
      ) {
        const id = data[key];
        const mapper = this.populateMapper[key];
        if (mapper) {
          const res = await mapper.fetch(id, user_id, bu_code);
          Object.assign(result, { [key]: res });
        }
      }
    }

    return result;
  }
}
