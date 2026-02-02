import { HttpStatus, Injectable, HttpException, Inject } from '@nestjs/common';
import {
  IBusinessUnitConfig,
  ICreateCurrencies,
  IUpdateCurrencies,
} from './interface/currencies.interface';
import { TenantService } from '@/tenant/tenant.service';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { TryCatch, Result, ErrorCode, CurrencyResponseSchema, CurrencyListItemResponseSchema } from '@/common';

@Injectable()
export class CurrenciesService {
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
    CurrenciesService.name,
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
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      CurrenciesService.name,
    );

    const currency = await this.prismaService.tb_currency.findFirst({
      where: {
        id: id,
      },
    })
      .then((res) => {
        if (res) {
          return {
            ...res,
            exchange_rate: res.exchange_rate ? Number(res.exchange_rate) : null,
          };
        }
        return null;
      });

    if (!currency) {
      return Result.error('Currency not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedCurrency = CurrencyResponseSchema.parse(currency);

    return Result.ok(serializedCurrency);
  }

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, paginate, tenant_id: this.bu_code },
      CurrenciesService.name,
    );
    const defaultSearchFields = ['code', 'name'];

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
    const data = await this.prismaService.tb_currency.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const currencies = data.map((item) => ({
      ...item,
      exchange_rate: item.exchange_rate ? Number(item.exchange_rate) : null,
    }));

    const total = await this.prismaService.tb_currency.count({ where: q.where() });

    // Serialize response data
    const serializedCurrencies = currencies.map((currency) => CurrencyListItemResponseSchema.parse(currency));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedCurrencies,
    });
  }

  @TryCatch
  async findAllActive(
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllActive', user_id: this.userId, tenant_id: this.bu_code, paginate },
      CurrenciesService.name,
    );
    const defaultSearchFields = ['code', 'name'];

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
    const currencies = await this.prismaService.tb_currency
      .findMany({
        ...q.findMany(),
        where: {
          is_active: true,
        },
        ...pagination,
      })
      .then((res) => {
        return res.map((item) => ({
          ...item,
          exchange_rate: item.exchange_rate ? Number(item.exchange_rate) : null,
        }));
      });

    const total = await this.prismaService.tb_currency.count({
      where: {
        ...q.where(),
        is_active: true,
      },
    });

    // Serialize response data
    const serializedCurrencies = currencies.map((currency) => CurrencyListItemResponseSchema.parse(currency));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedCurrencies,
    });
  }

  @TryCatch
  async findAllById(
    ids: string[],
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllById', ids, user_id: this.userId, tenant_id: this.bu_code },
      CurrenciesService.name,
    );

    const currencies = await this.prismaService.tb_currency
      .findMany({
        where: {
          id: { in: ids },
        },
      })
      .then((res) => {
        return res.map((item) => ({
          ...item,
          exchange_rate: item.exchange_rate ? Number(item.exchange_rate) : null,
        }));
      });

    // Serialize response data
    const serializedCurrencies = currencies.map((currency) => CurrencyListItemResponseSchema.parse(currency));

    return Result.ok(serializedCurrencies);
  }

  @TryCatch
  async create(
    data: ICreateCurrencies,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      CurrenciesService.name,
    );

    const foundCurrency = await this.prismaService.tb_currency.findFirst({
      where: {
        code: data.code,
        is_active: true,
      },
    });

    if (foundCurrency) {
      return Result.error('Currency already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createCurrency = await this.prismaService.tb_currency.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createCurrency.id });
  }

  @TryCatch
  async update(
    data: IUpdateCurrencies,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      CurrenciesService.name,
    );

    const currency = await this.prismaService.tb_currency.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!currency) {
      return Result.error('Currency not found', ErrorCode.NOT_FOUND);
    }

    const updateCurrency = await this.prismaService.tb_currency.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
      },
    });

    return Result.ok({ id: updateCurrency.id });
  }

  @TryCatch
  async patch(
    data: IUpdateCurrencies,
  ): Promise<Result<any>> {
    this.logger.debug({ function: 'patch', data, user_id: this.userId, tenant_id: this.bu_code }, CurrenciesService.name);

    const currency = await this.prismaService.tb_currency.findFirst({
      where: {
        id: data.id,
        is_active: true,
      },
    });

    if (!currency) {
      return Result.error('Currency not found', ErrorCode.NOT_FOUND);
    }

    const updateCurrency = await this.prismaService.tb_currency.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updateCurrency.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      CurrenciesService.name,
    );

    const currency = await this.prismaService.tb_currency.findFirst({
      where: {
        id: id,
        is_active: true,
      },
    });

    if (!currency) {
      return Result.error('Currency not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_currency.update({
      where: {
        id: id,
      },
      data: {
        is_active: false,
        updated_by_id: this.userId,
        deleted_by_id: this.userId,
        deleted_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id });
  }

  @TryCatch
  async getDefault(): Promise<Result<any>> {
    this.logger.debug({ function: 'getDefault', user_id: this.userId, tenant_id: this.bu_code }, CurrenciesService.name);

    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        code: this.bu_code,
      },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }


    const configs = (businessUnit.config as IBusinessUnitConfig[]) ?? [];

    const config = configs.filter((item) => item.key === "currency_base")[0] ?? {};

    if (!config.value) {
      return Result.error('Currency not found', ErrorCode.NOT_FOUND);
    };

    const currency = await this.prismaService.tb_currency.findFirst({
      where: {
        id: config.value.currency_id,
        is_active: true,
      },
    });

    const { exchange_rate, exchange_rate_at, note, info, dimension, created_at, created_by_id, updated_at, updated_by_id, deleted_at, deleted_by_id, ...result } = currency;

    return Result.ok(result);
  }
}
