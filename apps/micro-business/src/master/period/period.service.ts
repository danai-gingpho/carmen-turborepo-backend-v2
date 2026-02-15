import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { ICreatePeriod, IUpdatePeriod } from './interface/period.interface';
import { TenantService } from '@/tenant/tenant.service';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_USER_ID } from '@/common/constant';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class PeriodService {
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
    PeriodService.name,
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
  ) {}

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      PeriodService.name,
    );

    const period = await this.prismaService.tb_period.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!period) {
      return Result.error('Period not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(period);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, paginate, tenant_id: this.bu_code },
      PeriodService.name,
    );

    const defaultSearchFields = ['period'];

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
    const data = await this.prismaService.tb_period.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_period.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: data,
    });
  }

  @TryCatch
  async create(data: ICreatePeriod): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      PeriodService.name,
    );

    const foundPeriod = await this.prismaService.tb_period.findFirst({
      where: {
        period: data.period,
        deleted_at: null,
      },
    });

    if (foundPeriod) {
      return Result.error('Period already exists', ErrorCode.ALREADY_EXISTS);
    }

    const foundFiscalPeriod = await this.prismaService.tb_period.findFirst({
      where: {
        fiscal_year: data.fiscal_year,
        fiscal_month: data.fiscal_month,
        deleted_at: null,
      },
    });

    if (foundFiscalPeriod) {
      return Result.error('Fiscal year/month combination already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createPeriod = await this.prismaService.tb_period.create({
      data: {
        period: data.period,
        fiscal_year: data.fiscal_year,
        fiscal_month: data.fiscal_month,
        start_at: new Date(data.start_at),
        end_at: new Date(data.end_at),
        status: data.status || 'open',
        note: data.note,
        info: data.info || {},
        dimension: data.dimension || [],
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createPeriod.id });
  }

  @TryCatch
  async update(data: IUpdatePeriod): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      PeriodService.name,
    );

    const period = await this.prismaService.tb_period.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!period) {
      return Result.error('Period not found', ErrorCode.NOT_FOUND);
    }

    const updateData: any = {
      updated_by_id: this.userId,
      updated_at: new Date(),
    };

    if (data.period !== undefined) updateData.period = data.period;
    if (data.fiscal_year !== undefined) updateData.fiscal_year = data.fiscal_year;
    if (data.fiscal_month !== undefined) updateData.fiscal_month = data.fiscal_month;
    if (data.start_at !== undefined) updateData.start_at = new Date(data.start_at);
    if (data.end_at !== undefined) updateData.end_at = new Date(data.end_at);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.info !== undefined) updateData.info = data.info;
    if (data.dimension !== undefined) updateData.dimension = data.dimension;

    const updatePeriod = await this.prismaService.tb_period.update({
      where: {
        id: data.id,
      },
      data: updateData,
    });

    return Result.ok({ id: updatePeriod.id });
  }

  @TryCatch
  async patch(data: IUpdatePeriod): Promise<Result<any>> {
    this.logger.debug(
      { function: 'patch', data, user_id: this.userId, tenant_id: this.bu_code },
      PeriodService.name,
    );

    const period = await this.prismaService.tb_period.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!period) {
      return Result.error('Period not found', ErrorCode.NOT_FOUND);
    }

    const updateData: any = {
      updated_by_id: this.userId,
      updated_at: new Date(),
    };

    if (data.period !== undefined) updateData.period = data.period;
    if (data.fiscal_year !== undefined) updateData.fiscal_year = data.fiscal_year;
    if (data.fiscal_month !== undefined) updateData.fiscal_month = data.fiscal_month;
    if (data.start_at !== undefined) updateData.start_at = new Date(data.start_at);
    if (data.end_at !== undefined) updateData.end_at = new Date(data.end_at);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.info !== undefined) updateData.info = data.info;
    if (data.dimension !== undefined) updateData.dimension = data.dimension;

    const updatePeriod = await this.prismaService.tb_period.update({
      where: {
        id: data.id,
      },
      data: updateData,
    });

    return Result.ok({ id: updatePeriod.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      PeriodService.name,
    );

    const period = await this.prismaService.tb_period.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!period) {
      return Result.error('Period not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_period.update({
      where: {
        id: id,
      },
      data: {
        deleted_by_id: this.userId,
        deleted_at: new Date(),
        updated_by_id: this.userId,
        updated_at: new Date(),
      },
    });

    return Result.ok({ id });
  }
}
