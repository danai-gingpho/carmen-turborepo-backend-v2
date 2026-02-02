import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_USER_ID } from '@/common/constant';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/common/libs/paginate.query';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { CommonLogic } from '@/common/common.logic';
import { getPattern } from '@/common/helpers/running-code.helper';
import { format } from 'date-fns';
import {
  TryCatch,
  Result,
  ErrorCode,
  createPriceListCreateValidation,
  createPriceListUpdateValidation,
  PriceListDetailResponseSchema,
  PriceListListItemResponseSchema,
} from '@/common';

@Injectable()
export class PriceListService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(
      ERROR_MISSING_BU_CODE,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(
      ERROR_MISSING_USER_ID,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;

  private readonly logger: BackendLogger = new BackendLogger(
    PriceListService.name,
  );

  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException(
        'Prisma service is not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  constructor(
    private readonly tenantService: TenantService,
    private readonly commonLogic: CommonLogic,
  ) { }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      PriceListService.name,
    );

    const priceList = await this.prismaService.tb_pricelist
      .findFirst({
        where: {
          id: id,
        },
        select: {
          id: true,
          pricelist_no: true,
          name: true,
          description: true,
          status: true,
          note: true,
          info: true,
          effective_from_date: true,
          effective_to_date: true,
          tb_currency: {
            select: {
              id: true,
              name: true,
            }
          },
          tb_vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          tb_pricelist_detail: {
            select: {
              id: true,
              sequence_no: true,
              unit_id: true,
              unit_name: true,

              tax_profile_id: true,
              tax_profile_name: true,
              tax_rate: true,

              moq_qty: true,

              price_without_tax: true,
              tax_amt: true,
              price: true,

              lead_time_days: true,

              is_active: true,
              note: true,
              info: true,
              dimension: true,
              tb_product: {
                select: {
                  id: true,
                  name: true,

                },
              },
            },
          },
        },
      })
      .then(async (res) => {
        if (!res) return null;
        const pricelist_detail = await Promise.all(res.tb_pricelist_detail.map(async (item) => {
          const tax_profile_result = await this.getTaxProfileList(item.tax_profile_id);
          const tax_profile = tax_profile_result.isOk() ? tax_profile_result.value : null;
          return {
            id: item.id,
            sequence_no: item.sequence_no,
            moq_qty: Number(item.moq_qty),
            unit_id: item.unit_id,
            unit_name: item.unit_name,

            lead_time_days: Number(item.lead_time_days),

            price_wirhout_tax: Number(item.price_without_tax),
            tax_amt: Number(item.tax_amt),
            price: Number(item.price),

            tax_profile_id: item.tax_profile_id,
            is_active: item.is_active,
            note: item.note,
            info: item.info,
            product_id: item.tb_product.id,
            product_name: item.tb_product.name,
            tax_profile: {
              id: tax_profile?.id,
              name: tax_profile?.name,
              rate: Number(tax_profile?.rate || 0),
            },
          };
        }));
        return {
          id: res.id,
          no: res.pricelist_no,
          name: res.name,
          status: res.status,
          description: res.description,
          vendor: res.tb_vendor,
          currency: res.tb_currency,
          effectivePeriod: res.effective_from_date.toUTCString() + ' - ' + res.effective_to_date.toUTCString(),
          note: res.note,
          pricelist_detail,
        }
      });

    if (!priceList) {
      return Result.error('Price list not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedPriceList = PriceListDetailResponseSchema.parse(priceList);

    return Result.ok(serializedPriceList);
  }

  @TryCatch
  async getTaxProfileList(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'getTaxProfileList', user_id: this.userId, tenant_id: this.bu_code },
      PriceListService.name,
    );

    const gbl_taxProfile = await this.prismaService.tb_application_config.findFirst({
      where: {
        key: 'tax_profile',
      },
    });

    if (gbl_taxProfile && gbl_taxProfile.value) {
      const parsed = typeof gbl_taxProfile.value === 'string' ? JSON.parse(gbl_taxProfile.value as string) : gbl_taxProfile.value;
      const taxProfiles = Array.isArray(parsed) ? parsed : [];
      const found = taxProfiles.find((item: any) => item.id === id);
      return Result.ok(found || null);
    }
    return Result.ok(null);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      PriceListService.name,
    );
    const defaultSearchFields = ['name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);
    const selectClause = {
      id: true,
      pricelist_no: true,
      name: true,
      description: true,
      status: true,
      note: true,
      info: true,
      effective_from_date: true,
      effective_to_date: true,
      tb_currency: {
        select: {
          id: true,
          name: true,
        }
      },
      tb_vendor: {
        select: {
          id: true,
          name: true,
        },
      },
      tb_pricelist_detail: {
        select: {
          id: true,
          sequence_no: true,
          unit_id: true,
          unit_name: true,
          tax_profile_id: true,
          tax_profile_name: true,
          tax_rate: true,
          moq_qty: true,
          price_without_tax: true,
          tax_amt: true,
          price: true,
          lead_time_days: true,
          is_active: true,
          note: true,
          info: true,
          dimension: true,
          tb_product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    };

    const data = await this.prismaService.tb_pricelist.findMany({
      select: selectClause,
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_pricelist.count({ where: q.where() });

    const priceList = await Promise.all(data.map(async (item) => {
      const pricelist_detail = await Promise.all(item.tb_pricelist_detail.map(async (row) => {
        const tax_profile_result = await this.getTaxProfileList(row.tax_profile_id);
        const tax_profile = tax_profile_result.isOk() ? tax_profile_result.value : null;
        return {
          id: row.id,
          sequence_no: row.sequence_no,
          moq_qty: Number(row.moq_qty),
          unit_id: row.unit_id,
          unit_name: row.unit_name,
          lead_time_days: Number(row.lead_time_days),
          price_wirhout_tax: Number(row.price_without_tax),
          tax_amt: Number(row.tax_amt),
          price: Number(row.price),
          tax_profile_id: row.tax_profile_id,
          is_active: row.is_active,
          note: row.note,
          info: row.info,
          product_id: row.tb_product.id,
          product_name: row.tb_product.name,
          tax_profile: {
            id: tax_profile?.id,
            name: tax_profile?.name,
            rate: Number(tax_profile?.rate || 0),
          },
        };
      }));
      return {
        id: item.id,
        no: item.pricelist_no,
        name: item.name,
        status: item.status,
        description: item.description,
        vendor: item.tb_vendor,
        currency: item.tb_currency,
        effectivePeriod: item.effective_from_date + ' - ' + item.effective_to_date,
        note: item.note,
        pricelist_detail,
      };
    }));

    // Serialize response data
    const serializedPriceList = priceList.map((item) => PriceListListItemResponseSchema.parse(item));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedPriceList,
    });
  }

  @TryCatch
  async findAllById(
    ids: string[],
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllById', ids, user_id: this.userId, tenant_id: this.bu_code, paginate },
      PriceListService.name,
    );
    const defaultSearchFields = ['name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);
    const selectClause = {
      id: true,
      pricelist_no: true,
      name: true,
      description: true,
      status: true,
      note: true,
      info: true,
      effective_from_date: true,
      effective_to_date: true,
      tb_currency: {
        select: {
          id: true,
          name: true,
        }
      },
      tb_vendor: {
        select: {
          id: true,
          name: true,
        },
      },
      tb_pricelist_detail: {
        select: {
          id: true,
          sequence_no: true,
          unit_id: true,
          unit_name: true,
          tax_profile_id: true,
          tax_profile_name: true,
          tax_rate: true,
          moq_qty: true,
          price_without_tax: true,
          tax_amt: true,
          price: true,
          lead_time_days: true,
          is_active: true,
          note: true,
          info: true,
          dimension: true,
          tb_product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    };

    const data = await this.prismaService.tb_pricelist.findMany({
      select: selectClause,
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });
    const total = await this.prismaService.tb_pricelist.count({ where: q.where() });

    const priceList = await Promise.all(data.map(async (item) => {
      return {
        id: item.id,
        no: item.pricelist_no,
        name: item.name,
        status: item.status,
        description: item.description,
        vendor: item.tb_vendor,
        currency: item.tb_currency,
        effectivePeriod: item.effective_from_date.toISOString() + ' - ' + item.effective_to_date.toISOString(),
        note: item.note,
        pricelist_detail: await Promise.all(item.tb_pricelist_detail.map(async (row) => {
          const tax_profile_result = await this.getTaxProfileList(row.tax_profile_id);
          const tax_profile = tax_profile_result.isOk() ? tax_profile_result.value : null;
          return {
            id: row.id,
            sequence_no: row.sequence_no,
            moq_qty: Number(row.moq_qty),
            unit_id: row.unit_id,
            unit_name: row.unit_name,
            lead_time_days: Number(row.lead_time_days),
            price_wirhout_tax: Number(row.price_without_tax),
            tax_amt: Number(row.tax_amt),
            price: Number(row.price),
            tax_profile_id: row.tax_profile_id,
            is_active: row.is_active,
            note: row.note,
            info: row.info,
            product_id: row.tb_product.id,
            product_name: row.tb_product.name,
            tax_profile: {
              id: tax_profile?.id,
              name: tax_profile?.name,
              rate: Number(tax_profile?.rate || 0),
            },
          };
        })),
      }
    }));

    // Serialize response data
    const serializedPriceList = priceList.map((item) => PriceListListItemResponseSchema.parse(item));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedPriceList,
    });
  }

  @TryCatch
  async priceCompare(data: {
    product_id: string;
    due_date: Date,
    unit_id?: string;
    currency_id: string
  }): Promise<Result<any>> {
    this.logger.debug(
      { function: 'price-compare', data, user_id: this.userId, bu_code: this.bu_code },
    )
    const unitIdQuery = data.unit_id ? { unit_id: data.unit_id } : {};
    const priceListDetail = await this.prismaService.tb_pricelist_detail.findMany({
      where: {
        tb_pricelist: {
          currency_id: data.currency_id,
          effective_from_date: { lte: data.due_date },
          effective_to_date: { gte: data.due_date }
        },
        product_id: data.product_id,
        ...unitIdQuery
      },
      include: {
        tb_pricelist: true
      },
      orderBy: [
        { is_preferred: 'desc' },
        { price: 'asc' }
      ]
    })

    if (!priceListDetail || priceListDetail.length === 0) {
      return Result.ok({
        selected: null,
        lists: [],
      });
    }

    const currency = await this.prismaService.tb_currency.findFirst({
      where: { id: data.currency_id },
    })
    const transformToResult = []

    for (const plDetail of priceListDetail) {
      const data = {
        product_id: plDetail.product_id,
        product_name: plDetail.product_name,
        unit_id: plDetail.unit_id,
        unit_name: plDetail.unit_name,
        price: Number(plDetail.price),
        currency: currency.code,
        base_price: Number(plDetail.price),
        base_currency: currency.code,
        pricelist_detail_id: plDetail.id,
        exchange_rate: 1,
        pricelist_no: (plDetail as any).tb_pricelist.pricelist_no,
        is_preferred: plDetail.is_preferred,
        vendor_id: (plDetail as any).tb_pricelist.vendor_id,
        vendor_name: (plDetail as any).tb_pricelist.vendor_name,
        effective_date: {
          from: (plDetail as any).tb_pricelist.effective_from_date,
          to: (plDetail as any).tb_pricelist.effective_to_date,
        }
      }
      transformToResult.push(data)
    }

    const selected = transformToResult.splice(0, 1)[0]
    const lists = transformToResult.splice(0, transformToResult.length)

    return Result.ok({
      selected,
      lists,
    });
  }

  @TryCatch
  async create(data: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      PriceListService.name,
    );

    this.logger.log(
      `create price-list ${JSON.stringify(data)} ${this.userId} ${this.bu_code}`,
    );

    // Validate using factory function
    const validationSchema = createPriceListCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Business validation: date constraints
    if (data.effective_from_date < new Date()) {
      return Result.error('From date is in the past', ErrorCode.INVALID_ARGUMENT);
    }

    if (data.effective_to_date < new Date()) {
      return Result.error('To date is in the past', ErrorCode.INVALID_ARGUMENT);
    }

    if (data.effective_from_date > data.effective_to_date) {
      return Result.error('From date is greater than to date', ErrorCode.INVALID_ARGUMENT);
    }

    // Get vendor and currency names for denormalization
    const vendor = await this.prismaService.tb_vendor.findFirst({
      where: { id: data.vendor_id },
      select: { name: true },
    });

    const currency = await this.prismaService.tb_currency.findFirst({
      where: { id: data.currency_id },
      select: { name: true },
    });

    const priceListNo = await this.generatePLNo(new Date().toISOString());
    const priceList = await this.prismaService.tb_pricelist.create({
      data: {
        pricelist_no: priceListNo,
        tb_vendor: { connect: { id: data.vendor_id } },
        vendor_name: vendor.name,
        name: data.name,
        description: data.description,
        status: data.status,
        tb_currency: { connect: { id: data.currency_id } },
        currency_name: currency.name,
        effective_from_date: data.effective_from_date,
        effective_to_date: data.effective_to_date,
        created_by_id: this.userId,
        note: data.note,
        tb_pricelist_detail: {
          create: data.pricelist_detail.add.map((item: any) => ({
            sequence_no: item.sequence_no,
            tb_unit: { connect: { id: item.unit_id } },
            unit_name: item.unit_name,
            ...(item.tax_profile_id && { tb_tax_profile: { connect: { id: item.tax_profile_id } } }),
            tax_profile_name: item.tax_profile_name,
            tax_rate: item.tax_rate,
            moq_qty: item.moq_qty,
            price_without_tax: item.price_without_tax,
            tax_amt: item.tax_amt,
            price: item.price,
            tb_product: { connect: { id: item.product_id } },
            product_name: item.product_name
          }))
        },
      },
    });

    return Result.ok({ id: priceList.id });
  }

  @TryCatch
  async update(data: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      PriceListService.name,
    );

    // Validate using factory function
    const validationSchema = createPriceListUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    const priceListId = typeof data.id === 'object' ? data.id.id : data.id;

    const currentPriceList = await this.prismaService.tb_pricelist.findFirst({
      where: { id: priceListId },
    });

    if (!currentPriceList) {
      return Result.error('Price list not found', ErrorCode.NOT_FOUND);
    }

    // Get vendor name for denormalization if vendor_id provided
    if (data.vendor_id) {
      const vendor = await this.prismaService.tb_vendor.findFirst({
        where: { id: data.vendor_id },
        select: { name: true },
      });
      data.vendor_name = vendor?.name;
    }

    // Get currency name for denormalization if currency_id provided
    if (data.currency_id) {
      const currency = await this.prismaService.tb_currency.findFirst({
        where: { id: data.currency_id },
        select: { name: true },
      });
      data.currency_name = currency?.name;
    }

    // Update the main price list record
    const updatedPriceList = await this.prismaService.tb_pricelist.update({
      where: { id: priceListId },
      data: {
        name: data.name,
        description: data.description,
        note: data.note,
        status: data.status,
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        currency_id: data.currency_id,
        currency_name: data.currency_name,
        effective_from_date: data.effective_from_date,
        effective_to_date: data.effective_to_date,
        info: data.info,
        updated_by_id: this.userId,
      },
    });

    // Handle pricelist_detail add/remove/update
    if (data.pricelist_detail) {
      // Add new details
      if ('add' in data.pricelist_detail) {
        for (const detail of data.pricelist_detail.add) {
          await this.prismaService.tb_pricelist_detail.create({
            data: {
              pricelist_id: updatedPriceList.id,
              product_id: detail.product_id,
              product_name: detail.product_name,
              sequence_no: detail.sequence_no,
              unit_id: detail.unit_id,
              unit_name: detail.unit_name,
              tax_profile_id: detail.tax_profile_id,
              tax_profile_name: detail.tax_profile_name,
              tax_rate: detail.tax_rate,
              moq_qty: detail.moq_qty,
              price_without_tax: detail.price_without_tax,
              tax_amt: detail.tax_amt,
              price: detail.price,
              lead_time_days: detail.lead_time_days,
              is_active: detail.is_active,
              note: detail.note,
              info: detail.info,
              dimension: detail.dimension,
              created_by_id: this.userId,
            },
          });
        }
      }

      // Remove details
      if ('remove' in data.pricelist_detail) {
        for (const detailId of data.pricelist_detail.remove) {
          const id = typeof detailId === 'object' ? detailId.id : detailId;
          const detail = await this.prismaService.tb_pricelist_detail.findFirst({
            where: { id: id },
          });
          if (detail) {
            await this.prismaService.tb_pricelist_detail.delete({
              where: { id: detail.id },
            });
          }
        }
      }

      // Update existing details
      if ('update' in data.pricelist_detail) {
        for (const detail of data.pricelist_detail.update) {
          const detailId = typeof detail.id === 'object' ? detail.id.id : detail.id;
          await this.prismaService.tb_pricelist_detail.update({
            where: { id: detailId },
            data: {
              product_id: detail.product_id,
              product_name: detail.product_name,
              sequence_no: detail.sequence_no,
              unit_id: detail.unit_id,
              unit_name: detail.unit_name,
              tax_profile_id: detail.tax_profile_id,
              tax_profile_name: detail.tax_profile_name,
              tax_rate: detail.tax_rate,
              moq_qty: detail.moq_qty,
              price_without_tax: detail.price_without_tax,
              tax_amt: detail.tax_amt,
              price: detail.price,
              lead_time_days: detail.lead_time_days,
              is_active: detail.is_active,
              note: detail.note,
              info: detail.info,
              dimension: detail.dimension,
              updated_by_id: this.userId,
              updated_at: new Date().toISOString(),
            },
          });
        }
      }
    }

    return Result.ok({ id: updatedPriceList.id });
  }

  @TryCatch
  async remove(id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'remove', id, user_id: this.userId, tenant_id: this.bu_code }, PriceListService.name);

    const priceList = await this.prismaService.tb_pricelist.update({
      where: { id: id },
      data: {
        status: 'inactive',
        deleted_at: new Date().toISOString(),
        updated_by_id: this.userId,
      },
    });

    return Result.ok({ id: priceList.id });
  }

  @TryCatch
  async uploadExcel(
    data: any,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'uploadExcel', data, user_id: this.userId, tenant_id: this.bu_code },
      PriceListService.name,
    );
    const priceList = await this.prismaService.tb_pricelist.create({
      data: data,
    });

    return Result.ok({ id: priceList.id });
  }

  @TryCatch
  async downloadExcel(
    id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'downloadExcel', id, user_id: this.userId, tenant_id: this.bu_code },
      PriceListService.name,
    );

    const priceList = await this.prismaService.tb_pricelist.findFirst({
      where: { id: id },
    });

    if (!priceList) {
      return Result.error('Price list not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(priceList);
  }

  @TryCatch
  async findAllByDetail(
    price_list_detail_ids: string[],
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllByDetail',
        price_list_detail_ids,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PriceListService.name,
    );

    const priceListData = await this.prismaService.tb_pricelist_detail.findMany({
      where: {
        id: {
          in: price_list_detail_ids,
        },
      },
      include: {
        tb_pricelist: {
          select: {
            pricelist_no: true,
          }
        }
      }
    });

    return Result.ok(priceListData);
  }

  @TryCatch
  async importCsv(csvContent: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'importCsv', contentLength: csvContent?.length, user_id: this.userId, tenant_id: this.bu_code },
      PriceListService.name,
    );

    const result = {
      success: true,
      summary: {
        total_rows: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
      },
      created_ids: [] as string[],
      updated_ids: [] as string[],
      errors: [] as Array<{ row: number; field?: string; message: string; data?: Record<string, any> }>,
    };

    // Parse CSV content
    const rows = this.parseCsv(csvContent);
    if (rows.length === 0) {
      return Result.error('CSV file is empty or has no data rows', ErrorCode.INVALID_ARGUMENT);
    }

    result.summary.total_rows = rows.length;

    // Group rows by pricelist_no (for upsert logic)
    const priceListGroups = new Map<string, Array<{ row: number; data: Record<string, any> }>>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because header is row 1, data starts at row 2

      // Use pricelist_no as grouping key, or generate a unique key if not provided
      const groupKey = row.pricelist_no || `__new_${i}`;

      if (!priceListGroups.has(groupKey)) {
        priceListGroups.set(groupKey, []);
      }
      priceListGroups.get(groupKey)!.push({ row: rowNumber, data: row });
    }

    // Process each price list group
    for (const [groupKey, groupRows] of priceListGroups) {
      try {
        const processResult = await this.processImportGroup(groupKey, groupRows, result);
        if (processResult.created) {
          result.summary.created++;
          result.created_ids.push(processResult.id);
        } else if (processResult.updated) {
          result.summary.updated++;
          result.updated_ids.push(processResult.id);
        }
      } catch (error: any) {
        result.summary.errors++;
        result.errors.push({
          row: groupRows[0].row,
          message: error.message || 'Unknown error processing price list',
          data: groupRows[0].data,
        });
      }
    }

    result.summary.skipped = result.summary.errors;
    result.success = result.summary.errors === 0;

    return Result.ok(result);
  }

  private parseCsv(csvContent: string): Array<Record<string, any>> {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return [];
    }

    // Parse header
    const headerLine = lines[0];
    const headers = this.parseCsvLine(headerLine).map(h => h.trim().toLowerCase());

    // Parse data rows
    const rows: Array<Record<string, any>> = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: Record<string, any> = {};

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        const value = values[j]?.trim() || '';

        if (value !== '') {
          row[header] = value;
        }
      }

      // Only add non-empty rows
      if (Object.keys(row).length > 0) {
        rows.push(row);
      }
    }

    return rows;
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  private async processImportGroup(
    groupKey: string,
    groupRows: Array<{ row: number; data: Record<string, any> }>,
    result: any,
  ): Promise<{ id: string; created: boolean; updated: boolean }> {
    const firstRow = groupRows[0].data;
    const isNewPriceList = groupKey.startsWith('__new_');

    // Validate required fields
    const errors: Array<{ row: number; field: string; message: string }> = [];

    // Check for required header fields
    if (!firstRow.vendor_id) {
      errors.push({ row: groupRows[0].row, field: 'vendor_id', message: 'Vendor ID is required' });
    }
    if (!firstRow.currency_id) {
      errors.push({ row: groupRows[0].row, field: 'currency_id', message: 'Currency ID is required' });
    }

    // Validate vendor exists
    if (firstRow.vendor_id) {
      const vendor = await this.prismaService.tb_vendor.findFirst({
        where: { id: firstRow.vendor_id },
      });
      if (!vendor) {
        errors.push({ row: groupRows[0].row, field: 'vendor_id', message: `Vendor not found: ${firstRow.vendor_id}` });
      }
    }

    // Validate currency exists
    if (firstRow.currency_id) {
      const currency = await this.prismaService.tb_currency.findFirst({
        where: { id: firstRow.currency_id },
      });
      if (!currency) {
        errors.push({ row: groupRows[0].row, field: 'currency_id', message: `Currency not found: ${firstRow.currency_id}` });
      }
    }

    // Validate each detail row
    for (const { row, data } of groupRows) {
      if (data.product_id) {
        const product = await this.prismaService.tb_product.findFirst({
          where: { id: data.product_id },
        });
        if (!product) {
          errors.push({ row, field: 'product_id', message: `Product not found: ${data.product_id}` });
        }
      }

      if (data.unit_id) {
        const unit = await this.prismaService.tb_unit.findFirst({
          where: { id: data.unit_id },
        });
        if (!unit) {
          errors.push({ row, field: 'unit_id', message: `Unit not found: ${data.unit_id}` });
        }
      }
    }

    // If there are validation errors, add them to result and skip this group
    if (errors.length > 0) {
      result.errors.push(...errors.map(e => ({
        row: e.row,
        field: e.field,
        message: e.message,
        data: groupRows.find(r => r.row === e.row)?.data,
      })));
      result.summary.errors += errors.length;
      throw new Error(`Validation failed with ${errors.length} errors`);
    }

    // Get vendor and currency names for denormalization
    const vendor = await this.prismaService.tb_vendor.findFirst({
      where: { id: firstRow.vendor_id },
      select: { name: true },
    });

    const currency = await this.prismaService.tb_currency.findFirst({
      where: { id: firstRow.currency_id },
      select: { name: true },
    });

    // Prepare detail items
    const detailItems = await Promise.all(
      groupRows
        .filter(({ data }) => data.product_id)
        .map(async ({ data }, index) => {
          const product = await this.prismaService.tb_product.findFirst({
            where: { id: data.product_id },
            select: { name: true },
          });
          const unit = data.unit_id
            ? await this.prismaService.tb_unit.findFirst({
                where: { id: data.unit_id },
                select: { name: true },
              })
            : null;

          return {
            sequence_no: index + 1,
            product_id: data.product_id,
            product_name: product?.name || '',
            unit_id: data.unit_id || undefined,
            unit_name: unit?.name || '',
            tax_profile_id: data.tax_profile_id || undefined,
            tax_profile_name: '',
            tax_rate: data.tax_rate ? parseFloat(data.tax_rate) : 0,
            moq_qty: data.moq_qty ? parseFloat(data.moq_qty) : 0,
            price_without_tax: data.price_without_tax ? parseFloat(data.price_without_tax) : 0,
            tax_amt: data.tax_amt ? parseFloat(data.tax_amt) : 0,
            price: data.price ? parseFloat(data.price) : 0,
            lead_time_days: data.lead_time_days ? parseInt(data.lead_time_days) : 0,
            is_active: data.is_active !== 'false' && data.is_active !== '0',
            note: data.detail_note || '',
          };
        })
    );

    // Check if price list exists (for update)
    let existingPriceList = null;
    if (!isNewPriceList) {
      existingPriceList = await this.prismaService.tb_pricelist.findFirst({
        where: { pricelist_no: groupKey },
      });
    }

    if (existingPriceList) {
      // Update existing price list
      await this.prismaService.tb_pricelist.update({
        where: { id: existingPriceList.id },
        data: {
          name: firstRow.name || existingPriceList.name,
          description: firstRow.description,
          status: (firstRow.status as any) || existingPriceList.status,
          vendor_id: firstRow.vendor_id,
          vendor_name: vendor?.name,
          currency_id: firstRow.currency_id,
          currency_name: currency?.name,
          effective_from_date: firstRow.effective_from_date
            ? new Date(firstRow.effective_from_date)
            : existingPriceList.effective_from_date,
          effective_to_date: firstRow.effective_to_date
            ? new Date(firstRow.effective_to_date)
            : existingPriceList.effective_to_date,
          note: firstRow.note,
          updated_by_id: this.userId,
        },
      });

      // Delete existing details and create new ones
      await this.prismaService.tb_pricelist_detail.deleteMany({
        where: { pricelist_id: existingPriceList.id },
      });

      // Create new details
      for (const detail of detailItems) {
        await this.prismaService.tb_pricelist_detail.create({
          data: {
            pricelist_id: existingPriceList.id,
            ...detail,
            created_by_id: this.userId,
          },
        });
      }

      return { id: existingPriceList.id, created: false, updated: true };
    } else {
      // Create new price list
      const priceListNo = await this.generatePLNo(new Date().toISOString());

      const newPriceList = await this.prismaService.tb_pricelist.create({
        data: {
          pricelist_no: priceListNo,
          name: firstRow.name || `Price List ${priceListNo}`,
          description: firstRow.description,
          status: (firstRow.status as any) || 'draft',
          vendor_id: firstRow.vendor_id,
          vendor_name: vendor?.name,
          currency_id: firstRow.currency_id,
          currency_name: currency?.name,
          effective_from_date: firstRow.effective_from_date
            ? new Date(firstRow.effective_from_date)
            : new Date(),
          effective_to_date: firstRow.effective_to_date
            ? new Date(firstRow.effective_to_date)
            : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          note: firstRow.note,
          created_by_id: this.userId,
        },
      });

      // Create details
      for (const detail of detailItems) {
        await this.prismaService.tb_pricelist_detail.create({
          data: {
            pricelist_id: newPriceList.id,
            ...detail,
            created_by_id: this.userId,
          },
        });
      }

      return { id: newPriceList.id, created: true, updated: false };
    }
  }

  private async generatePLNo(
    PLDate: string,
  ): Promise<string> {
    this.logger.debug(
      { function: 'generatePLNo', PLDate, tenant_id: this.bu_code, user_id: this.userId },
      PriceListService.name,
    );
    const pattern = await this.commonLogic.getRunningPattern(
      'PL',
      this.userId,
      this.bu_code,
    );
    this.logger.debug({ function: 'generatePLNo', pattern }, 'generatePLNo');

    if (!pattern) {
      throw new HttpException(
        'Running code pattern not found for PL',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const prPatterns = getPattern(pattern);
    let datePattern;
    let runningPattern;
    prPatterns.forEach((pattern) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });
    this.logger.debug(
      { function: 'generatePLNo', datePattern, runningPattern },
      PriceListService.name,
    );

    if (!datePattern || !datePattern.pattern) {
      throw new HttpException(
        'Date pattern not found in running code configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!runningPattern || !runningPattern.pattern) {
      throw new HttpException(
        'Running pattern not found in running code configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const getDate = new Date(PLDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    this.logger.debug(
      { function: 'generatePLNo', datePatternValue },
      PriceListService.name,
    );
    const latestPL = await this.prismaService.tb_pricelist.findFirst({
      where: {
        pricelist_no: {
          contains: datePatternValue,
        },
      },
      orderBy: {
        pricelist_no: 'desc',
      },
    });
    this.logger.debug({ function: 'generatePLNo', latestPL }, 'generatePLNo');
    // เก็บ Running code โดยการslice
    const latestPLNumber = latestPL
      ? Number(
        (latestPL.pricelist_no as string).slice(-Number(runningPattern.pattern)),
      )
      : 0;
    this.logger.debug(
      { function: 'generatePLNo', latestPLNumber },
      PriceListService.name,
    );
    const PLNo = await this.commonLogic.generateRunningCode(
      'PL',
      getDate,
      latestPLNumber,
      this.userId,
      this.bu_code,
    );
    this.logger.debug({ function: 'generatePLNo', PLNo }, PriceListService.name);
    return PLNo;
  }
}
