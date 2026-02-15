import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  PrismaClient_TENANT,
  enum_period_status,
} from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/libs/paginate.query';
import {
  ICreatePeriod,
  IUpdatePeriod,
} from './interface/period.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Injectable, Inject } from '@nestjs/common';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class PeriodService {
  private readonly logger: BackendLogger = new BackendLogger(
    PeriodService.name,
  );

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id },
      PeriodService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const period = await prisma.tb_period.findFirst({
      where: { id, deleted_at: null },
    });

    if (!period) {
      return Result.error('Period not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(period);
  }

  @TryCatch
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate },
      PeriodService.name,
    );

    const defaultSearchFields: string[] = ['period'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const data = await prisma.tb_period.findMany({
      ...q.findMany(),
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    const total = await prisma.tb_period.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    return Result.ok({
      data,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  @TryCatch
  async create(
    data: ICreatePeriod,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      PeriodService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const foundPeriod = await prisma.tb_period.findFirst({
      where: {
        period: data.period,
        deleted_at: null,
      },
    });

    if (foundPeriod) {
      return Result.error('Period already exists', ErrorCode.ALREADY_EXISTS);
    }

    const foundFiscalPeriod = await prisma.tb_period.findFirst({
      where: {
        fiscal_year: data.fiscal_year,
        fiscal_month: data.fiscal_month,
        deleted_at: null,
      },
    });

    if (foundFiscalPeriod) {
      return Result.error('Fiscal year/month combination already exists', ErrorCode.ALREADY_EXISTS);
    }

    const period = await prisma.tb_period.create({
      data: {
        period: data.period,
        fiscal_year: data.fiscal_year,
        fiscal_month: data.fiscal_month,
        start_at: new Date(data.start_at),
        end_at: new Date(data.end_at),
        status: (data.status as enum_period_status) || enum_period_status.open,
        note: data.note,
        info: data.info || {},
        dimension: data.dimension || [],
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: period.id });
  }

  @TryCatch
  async update(
    data: IUpdatePeriod,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id },
      PeriodService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const existingPeriod = await prisma.tb_period.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error('Period not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...fields } = data;

    const updatePayload: any = {
      updated_by_id: user_id,
      updated_at: new Date(),
    };

    if (fields.period !== undefined) updatePayload.period = fields.period;
    if (fields.fiscal_year !== undefined) updatePayload.fiscal_year = fields.fiscal_year;
    if (fields.fiscal_month !== undefined) updatePayload.fiscal_month = fields.fiscal_month;
    if (fields.start_at !== undefined) updatePayload.start_at = new Date(fields.start_at);
    if (fields.end_at !== undefined) updatePayload.end_at = new Date(fields.end_at);
    if (fields.status !== undefined) updatePayload.status = fields.status as enum_period_status;
    if (fields.note !== undefined) updatePayload.note = fields.note;
    if (fields.info !== undefined) updatePayload.info = fields.info;
    if (fields.dimension !== undefined) updatePayload.dimension = fields.dimension;

    await prisma.tb_period.update({
      where: { id: data.id },
      data: updatePayload,
    });

    return Result.ok({ id: data.id });
  }

  @TryCatch
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id },
      PeriodService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const existingPeriod = await prisma.tb_period.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error('Period not found', ErrorCode.NOT_FOUND);
    }

    await prisma.tb_period.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    return Result.ok({ id });
  }
}
