import { Injectable } from '@nestjs/common';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { CreatePurchaseRequestTemplate } from './dto/purchase-requesr-template.dto';
import { UpdatePurchaseRequestTemplate } from './dto/update-purchase-request-template.dto';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Injectable()
export class PurchaseRequestTemplateLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestTemplateLogic.name,
  );
  constructor(
    private readonly mapperLogic: MapperLogic,
    private readonly purchaseRequestTemplateService: PurchaseRequestTemplateService,
  ) { }

  async create(
    data: CreatePurchaseRequestTemplate,
    user_id: string,
    bu_code: string,
  ) {
    this.logger.debug(
      { function: 'create', data, user_id, bu_code },
      PurchaseRequestTemplateLogic.name,
    );

    const populateData: any = await this.populateData(data, user_id, bu_code);
    const purchaseRequestTemplate: Partial<CreatePurchaseRequestTemplate> = {
      department_id: populateData?.department_id?.id,
      department_name: populateData?.department_id?.name,
      workflow_id: populateData?.workflow_id?.id,
      workflow_name: populateData?.workflow_id?.name
    };

    // Always merge the populated department/workflow names
    data = {
      ...data,
      ...JSON.parse(JSON.stringify(purchaseRequestTemplate)),
    };

    if (data.purchase_request_template_detail?.add?.length) {
      data.purchase_request_template_detail.add =
        data.purchase_request_template_detail.add.map((detail) =>
          this.mapDetailFields(detail, populateData),
        );
    }

    await this.purchaseRequestTemplateService.initializePrismaService(bu_code, user_id);
    this.purchaseRequestTemplateService.userId = user_id;
    this.purchaseRequestTemplateService.bu_code = bu_code;
    return this.purchaseRequestTemplateService.create(data);
  }

  async update(
    data: UpdatePurchaseRequestTemplate,
    user_id: string,
    bu_code: string,
  ) {
    this.logger.debug(
      { function: 'update', data, user_id, bu_code },
      PurchaseRequestTemplateLogic.name,
    );
    await this.purchaseRequestTemplateService.initializePrismaService(bu_code, user_id);
    this.purchaseRequestTemplateService.userId = user_id;
    this.purchaseRequestTemplateService.bu_code = bu_code;
    // ดึงข้อมูลล่าสุดจาก database
    const currentTemplate = await this.purchaseRequestTemplateService.findOne(data.id);

    if (!currentTemplate) {
      throw new Error('Purchase request template not found');
    }

    const populateData: any = await this.populateData(data, user_id, bu_code);
    const purchaseRequestTemplate: Partial<UpdatePurchaseRequestTemplate> = {
      department_id: populateData?.department_id?.id,
      department_name: populateData?.department_id?.name,
      workflow_id: populateData?.workflow_id?.id,
      workflow_name: populateData?.workflow_id?.name,
    };

    // Always merge the populated department/workflow names
    data = {
      ...data,
      ...JSON.parse(JSON.stringify(purchaseRequestTemplate)),
    };

    if (data.purchase_request_template_detail?.add?.length) {
      data.purchase_request_template_detail.add =
        data.purchase_request_template_detail.add.map((detail) =>
          this.mapDetailFields(detail, populateData),
        );
    }

    if (data.purchase_request_template_detail?.update?.length) {
      data.purchase_request_template_detail.update =
        data.purchase_request_template_detail.update.map((detail) =>
          this.mapDetailFields(detail, populateData),
        );
    }

    return this.purchaseRequestTemplateService.update(data);
  }

  private async populateData(
    data: CreatePurchaseRequestTemplate | UpdatePurchaseRequestTemplate,
    user_id: string,
    tenant_id: string,
    oldDoc: any = {},
  ) {
    this.logger.debug(
      { function: 'populateData', data, user_id, tenant_id, oldDoc },
      PurchaseRequestTemplateLogic.name,
    );
    const product_ids = [];
    const unit_ids = [];
    const currency_ids = [];
    const location_ids = [];
    const delivery_point_ids = [];

    const populateLiast = {
      department_id: data.department_id,
      workflow_id: data.workflow_id,
    };

    if (data.purchase_request_template_detail?.add?.length) {
      for (const detail of data.purchase_request_template_detail.add) {
        if (detail.product_id) {
          product_ids.push(detail.product_id);
        }
        if (detail.requested_unit_id) {
          unit_ids.push(detail.requested_unit_id);
        }
        if (detail.foc_unit_id) {
          unit_ids.push(detail.foc_unit_id);
        }
        if (detail.inventory_unit_id) {
          unit_ids.push(detail.inventory_unit_id);
        }
        if (detail.currency_id) {
          currency_ids.push(detail.currency_id);
        }
        if (detail.location_id) {
          location_ids.push(detail.location_id);
        }
        if (detail.delivery_point_id) {
          delivery_point_ids.push(detail.delivery_point_id);
        }
      }
    }

    if (
      'purchase_request_template_detail' in data &&
      (data as UpdatePurchaseRequestTemplate).purchase_request_template_detail
        ?.update?.length
    ) {
      for (const detail of (data as UpdatePurchaseRequestTemplate)
        .purchase_request_template_detail.update) {
        if (detail.product_id) {
          product_ids.push(detail.product_id);
        }
        if (detail.requested_unit_id) {
          unit_ids.push(detail.requested_unit_id);
        }
        if (detail.foc_unit_id) {
          unit_ids.push(detail.foc_unit_id);
        }
        if (detail.inventory_unit_id) {
          unit_ids.push(detail.inventory_unit_id);
        }
        if (detail.currency_id) {
          currency_ids.push(detail.currency_id);
        }
        if (detail.location_id) {
          location_ids.push(detail.location_id);
        }
        if (detail.delivery_point_id) {
          delivery_point_ids.push(detail.delivery_point_id);
        }
      }
    }

    Object.assign(populateLiast, {
      product_ids,
      unit_ids,
      currency_ids,
      location_ids,
      delivery_point_ids,
    });

    const populateData = await this.mapperLogic.populate(
      populateLiast,
      user_id,
      tenant_id,
    );

    return populateData;
  }

  private mapDetailFields(detail: any, populateData: any) {
    const product = populateData?.product_ids?.find(
      (product) => product?.id === detail?.product_id,
    );
    const requestedUnit = populateData?.unit_ids?.find(
      (unit) => unit?.id === detail?.requested_unit_id,
    );
    const focUnit = populateData?.unit_ids?.find(
      (unit) => unit?.id === detail?.foc_unit_id,
    );
    const inventoryUnit = populateData?.unit_ids?.find(
      (unit) => unit?.id === detail?.inventory_unit_id,
    );
    const currency = populateData?.currency_ids?.find(
      (currency) => currency?.id === detail?.currency_id,
    );
    const location = populateData?.location_ids?.find(
      (location) => location?.id === detail?.location_id,
    );
    const deliveryPoint = populateData?.delivery_point_ids?.find(
      (dp) => dp?.id === detail?.delivery_point_id,
    );

    return JSON.parse(
      JSON.stringify({
        ...detail,
        product_name: product?.name,
        product_local_name: product?.local_name,
        requested_unit_name: requestedUnit?.name,
        foc_unit_name: focUnit?.name,
        inventory_unit_name: inventoryUnit?.name,
        currency_name: currency?.name,
        exchange_rate: currency?.exchange_rate,
        exchange_rate_date: currency?.exchange_rate_at,
        location_name: location?.name,
        location_code: location?.code,
        delivery_point_name: deliveryPoint?.name,
      }),
    );
  }
}
