import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  PrismaClient_TENANT,
  enum_physical_count_period_status,
  enum_location_type,
  enum_physical_count_type,
  enum_physical_count_status,
} from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/libs/paginate.query';
import {
  IPhysicalCountPeriodCreate,
  IPhysicalCountPeriodUpdate,
} from './interface/physical-count-period.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Injectable, Inject } from '@nestjs/common';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class PhysicalCountPeriodService {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountPeriodService.name,
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
      PhysicalCountPeriodService.name,
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

    const period = await prisma.tb_physical_count_period.findFirst({
      where: { id, deleted_at: null },
    });

    if (!period) {
      return Result.error('Physical Count Period not found', ErrorCode.NOT_FOUND);
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
      PhysicalCountPeriodService.name,
    );

    const defaultSearchFields: string[] = [];

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

    const periodList = await prisma.tb_physical_count_period.findMany({
      ...q.findMany(),
      where: {
        ...q.where(),
        deleted_at: null,
      },
      select: {
        id: true,
        counting_period_from_date: true,
        counting_period_to_date: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    const total = await prisma.tb_physical_count_period.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    return Result.ok({
      data: periodList,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  @TryCatch
  async findNearest(
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findNearest', user_id, tenant_id },
      PhysicalCountPeriodService.name,
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

    const period = await prisma.tb_physical_count_period.findFirst({
      where: {
        status: {
          in: [enum_physical_count_period_status.draft, enum_physical_count_period_status.counting],
        },
        deleted_at: null,
      },
      orderBy: { counting_period_from_date: 'desc' },
    });

    if (!period) {
      return Result.error('No active Physical Count Period found', ErrorCode.INVALID_ARGUMENT);
    }

    const locations = await prisma.tb_location.findMany({
      where: {
        location_type: enum_location_type.inventory,
        physical_count_type: enum_physical_count_type.yes,
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        location_type: true,
      },
    });

    const existingCounts = await prisma.tb_physical_count.findMany({
      where: {
        period_id: period.id,
        deleted_at: null,
      },
      select: {
        id: true,
        location_id: true,
        status: true,
      },
    });

    const countByLocation = new Map(
      existingCounts.map((c) => [c.location_id, { id: c.id, status: c.status }]),
    );

    const locationsWithStatus = locations.map((loc) => {
      const existingCount = countByLocation.get(loc.id);
      return {
        id: loc.id,
        code: loc.code,
        name: loc.name,
        location_type: loc.location_type,
        physical_count_status: existingCount ? existingCount.status : 'not_started',
        physical_count_id: existingCount ? existingCount.id : null,
      };
    });

    const response = {
      id: period.id,
      counting_period_from_date: period.counting_period_from_date,
      counting_period_to_date: period.counting_period_to_date,
      status: period.status,
      locations: locationsWithStatus,
    };

    return Result.ok(response);
  }

  @TryCatch
  async create(
    data: IPhysicalCountPeriodCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      PhysicalCountPeriodService.name,
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

    const period = await prisma.tb_physical_count_period.create({
      data: {
        counting_period_from_date: new Date(data.counting_period_from_date).toISOString(),
        counting_period_to_date: new Date(data.counting_period_to_date).toISOString(),
        status: (data.status as enum_physical_count_period_status) || enum_physical_count_period_status.draft,
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: period.id });
  }

  @TryCatch
  async update(
    data: IPhysicalCountPeriodUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id },
      PhysicalCountPeriodService.name,
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

    const existingPeriod = await prisma.tb_physical_count_period.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error('Physical Count Period not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...updateData } = data;

    const updatePayload: any = {
      updated_by_id: user_id,
      updated_at: new Date(),
    };

    if (updateData.counting_period_from_date) {
      updatePayload.counting_period_from_date = new Date(updateData.counting_period_from_date).toISOString();
    }
    if (updateData.counting_period_to_date) {
      updatePayload.counting_period_to_date = new Date(updateData.counting_period_to_date).toISOString();
    }
    if (updateData.status) {
      updatePayload.status = updateData.status as enum_physical_count_period_status;
    }

    await prisma.tb_physical_count_period.update({
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
      PhysicalCountPeriodService.name,
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

    const existingPeriod = await prisma.tb_physical_count_period.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error('Physical Count Period not found', ErrorCode.NOT_FOUND);
    }

    const associatedCounts = await prisma.tb_physical_count.count({
      where: { period_id: id, deleted_at: null },
    });

    if (associatedCounts > 0) {
      return Result.error(
        'Cannot delete period with associated physical counts',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    await prisma.tb_physical_count_period.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok({ id });
  }
}
