import { Injectable } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Result } from '@/common';

@Injectable()
export class PriceListLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListLogic.name,
  );

  constructor(
    private readonly priceListService: PriceListService,
    private readonly mapperLogic: MapperLogic,
  ) {}

  async create(
    data: Record<string, any>,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    await this.priceListService.initializePrismaService(tenant_id, user_id);
    this.priceListService.userId = user_id;
    this.priceListService.bu_code = tenant_id;

    // Extract IDs from payload for bulk population
    const extractIds = this.populateData(data);
    const foreignValue: Record<string, any> = await this.mapperLogic.populate(
      extractIds,
      user_id,
      tenant_id,
    );

    // Enrich header with foreign values
    const enrichedData = this.enrichHeader(data, foreignValue);

    // Enrich details
    if (enrichedData.pricelist_detail?.add) {
      enrichedData.pricelist_detail.add = enrichedData.pricelist_detail.add.map(
        (detail: Record<string, any>) =>
          this.enrichDetail(detail, foreignValue),
      );
    }

    this.logger.debug(
      { function: 'create', enrichedData, user_id, tenant_id },
      PriceListLogic.name,
    );

    return this.priceListService.create(enrichedData);
  }

  async update(
    data: Record<string, any>,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    await this.priceListService.initializePrismaService(tenant_id, user_id);
    this.priceListService.userId = user_id;
    this.priceListService.bu_code = tenant_id;

    // Extract IDs from payload for bulk population
    const extractIds = this.populateData(data);
    const foreignValue: Record<string, any> = await this.mapperLogic.populate(
      extractIds,
      user_id,
      tenant_id,
    );

    // Enrich header with foreign values
    const enrichedData = this.enrichHeader(data, foreignValue);

    // Enrich add details
    if (enrichedData.pricelist_detail?.add) {
      enrichedData.pricelist_detail.add = enrichedData.pricelist_detail.add.map(
        (detail: Record<string, any>) =>
          this.enrichDetail(detail, foreignValue),
      );
    }

    // Enrich update details
    if (enrichedData.pricelist_detail?.update) {
      enrichedData.pricelist_detail.update =
        enrichedData.pricelist_detail.update.map(
          (detail: Record<string, any>) =>
            this.enrichDetail(detail, foreignValue),
        );
    }

    this.logger.debug(
      { function: 'update', enrichedData, user_id, tenant_id },
      PriceListLogic.name,
    );

    return this.priceListService.update(enrichedData);
  }

  private populateData(data: Record<string, any>): Record<string, any> {
    const vendor_ids: string[] = [];
    const currency_ids: string[] = [];
    const product_ids: string[] = [];
    const unit_ids: string[] = [];
    const tax_profile_ids: string[] = [];

    // Header IDs
    if (data.vendor_id) vendor_ids.push(data.vendor_id);
    if (data.currency_id) currency_ids.push(data.currency_id);

    // Detail IDs from add and update
    const allDetails = [
      ...(data.pricelist_detail?.add || []),
      ...(data.pricelist_detail?.update || []),
    ];

    for (const detail of allDetails) {
      if (detail.product_id) product_ids.push(detail.product_id);
      if (detail.unit_id) unit_ids.push(detail.unit_id);
      if (detail.tax_profile_id) tax_profile_ids.push(detail.tax_profile_id);
    }

    return { vendor_ids, currency_ids, product_ids, unit_ids, tax_profile_ids };
  }

  private enrichHeader(
    data: Record<string, any>,
    foreignValue: Record<string, any>,
  ): Record<string, any> {
    const enriched = { ...data };

    if (data.vendor_id) {
      enriched.vendor_name =
        this.findByIdInArray(foreignValue?.vendor_ids, data.vendor_id)?.name ||
        data.vendor_name;
    }

    if (data.currency_id) {
      enriched.currency_code =
        this.findByIdInArray(foreignValue?.currency_ids, data.currency_id)
          ?.code || data.currency_code;
    }

    return enriched;
  }

  private enrichDetail(
    detail: Record<string, any>,
    foreignValue: Record<string, any>,
  ): Record<string, any> {
    return JSON.parse(
      JSON.stringify({
        ...detail,
        product_name:
          this.findByIdInArray(foreignValue?.product_ids, detail.product_id)
            ?.name || detail.product_name,
        unit_name:
          this.findByIdInArray(foreignValue?.unit_ids, detail.unit_id)?.name ||
          detail.unit_name,
        tax_profile_name:
          this.findByIdInArray(
            foreignValue?.tax_profile_ids,
            detail.tax_profile_id,
          )?.name || detail.tax_profile_name,
      }),
    );
  }

  private findByIdInArray(
    arr: Record<string, any>[] | undefined,
    id: string | undefined,
  ): Record<string, any> | null {
    if (!arr || !id) return null;
    return arr.find((item) => item.id === id) || null;
  }
}
