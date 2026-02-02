import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateExchangeRate,
  IUpdateExchangeRate,
} from './interface/exchange-rate.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import {
  ERROR_MISSING_BU_CODE,
  ERROR_MISSING_TENANT_ID,
  ERROR_MISSING_USER_ID,
} from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import {
  TryCatch,
  Result,
  ErrorCode,
  createExchangeRateCreateValidation,
  createExchangeRateUpdateValidation,
  ExchangeRateDetailResponseSchema,
  ExchangeRateListItemResponseSchema,
} from '@/common';

@Injectable()
export class ExchangeRateService {
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
    ExchangeRateService.name,
  );

  async initializePrismaService(
    bu_code: string,
    userId: string,
  ): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(
      bu_code,
      userId,
    );
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

  constructor(private readonly tenantService: TenantService) {}

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const exchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        id: id,
      },
    });

    if (!exchangeRate) {
      return Result.error('Exchange rate not found', ErrorCode.NOT_FOUND);
    }

    const serializedExchangeRate = ExchangeRateDetailResponseSchema.parse(exchangeRate);
    return Result.ok(serializedExchangeRate);
  }

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      ExchangeRateService.name,
    );
    const defaultSearchFields = ['note'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const pagination = getPaginationParams(q.page, q.perpage);
    const exchangeRates = await this.prismaService.tb_exchange_rate.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_exchange_rate.count({
      where: q.where(),
    });

    const serializedExchangeRates = exchangeRates.map((item) => ExchangeRateListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedExchangeRates,
    });
  }

  @TryCatch
  async create(
    data: ICreateExchangeRate,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );

    // Validate using factory function
    const validationSchema = createExchangeRateCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Business validation: check for duplicate
    const foundExchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        currency_id: data.currency_id,
        at_date: data.at_date,
      },
    });

    if (foundExchangeRate) {
      return Result.error('Exchange rate already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createExchangeRate = await this.prismaService.tb_exchange_rate.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createExchangeRate.id });
  }

  @TryCatch
  async update(
    data: IUpdateExchangeRate,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );

    // Validate using factory function
    const validationSchema = createExchangeRateUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    const exchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!exchangeRate) {
      return Result.error('Exchange rate not found', ErrorCode.NOT_FOUND);
    }

    const updateExchangeRate = await this.prismaService.tb_exchange_rate.update(
      {
        where: {
          id: data.id,
        },
        data: {
          ...data,
          updated_by_id: this.userId,
          updated_at: new Date().toISOString(),
        },
      },
    );

    return Result.ok({ id: updateExchangeRate.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      ExchangeRateService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const exchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        id: id,
      },
    });

    if (!exchangeRate) {
      return Result.error('Exchange rate not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_exchange_rate.update({
      where: { id: id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    // await prisma.tb_exchange_rate.update({
    //   where: { id: id },
    //   data: {
    //     // is_active: false,
    //     updated_by_id: this.userId,
    //   },
    // });

    return Result.ok({ id: id });
  }
}
