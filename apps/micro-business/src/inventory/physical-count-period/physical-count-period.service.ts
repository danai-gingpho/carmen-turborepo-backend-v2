import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";
import {
  PrismaClient_TENANT,
  enum_physical_count_period_status,
  enum_period_status,
  enum_location_type,
  enum_physical_count_type,
} from "@repo/prisma-shared-schema-tenant";
import { TenantService } from "@/tenant/tenant.service";
import QueryParams from "@/libs/paginate.query";
import { IPhysicalCountPeriodCreate, IPhysicalCountPeriodUpdate } from "./interface/physical-count-period.interface";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { Injectable, Inject } from "@nestjs/common";
import { IPaginate } from "@/common/shared-interface/paginate.interface";
import { Result, ErrorCode, TryCatch } from "@/common";

@Injectable()
export class PhysicalCountPeriodService {
  private readonly logger: BackendLogger = new BackendLogger(PhysicalCountPeriodService.name);

  constructor(
    @Inject("PRISMA_SYSTEM")
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject("PRISMA_TENANT")
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Find a physical count period by ID
   * ค้นหารอบการตรวจนับสินค้ารายการเดียวตาม ID
   * @param id - Physical count period ID / ID รอบการตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Physical count period detail / รายละเอียดรอบการตรวจนับสินค้า
   */
  @TryCatch
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "findOne", id, user_id, tenant_id }, PhysicalCountPeriodService.name);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return Result.error("Invalid ID format", ErrorCode.INVALID_ARGUMENT);
    }

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const period = await prisma.tb_physical_count_period.findFirst({
      where: { id, deleted_at: null },
      include: {
        tb_period: {
          select: { id: true, period: true, start_at: true, end_at: true, status: true },
        },
        tb_physical_count: {
          select: {
            id: true,
            location_id: true,
            status: true,
            tb_location: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!period) {
      return Result.error("Physical Count Period not found", ErrorCode.NOT_FOUND);
    }

    return Result.ok(period);
  }

  /**
   * Find all physical count periods with pagination
   * ค้นหารอบการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of physical count periods / รายการรอบการตรวจนับแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: "findAll", user_id, tenant_id, paginate }, PhysicalCountPeriodService.name);

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

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const periodList = await prisma.tb_physical_count_period.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      orderBy: q.orderBy(),
      skip: (q.page - 1) * q.perpage,
      ...(q.perpage >= 0 ? { take: q.perpage } : {}),
      select: {
        id: true,
        period_id: true,
        tb_period: {
          select: { id: true, period: true, start_at: true, end_at: true, status: true },
        },
        tb_physical_count: {
          select: {
            id: true,
            location_id: true,
            status: true,
            tb_location: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
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

  /**
   * Find the current active physical count period with location statuses
   * ค้นหารอบการตรวจนับสินค้าปัจจุบันพร้อมสถานะสถานที่
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Current period with locations and their count statuses / รอบปัจจุบันพร้อมสถานที่และสถานะการนับ
   */
  @TryCatch
  async findCurrent(user_id: string, tenant_id: string, include_not_count?: boolean): Promise<Result<unknown>> {
    this.logger.debug({ function: "findCurrent", user_id, tenant_id, include_not_count }, PhysicalCountPeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // get current open period
    const open_period = await prisma.tb_period.findFirst({
      where: {
        status: enum_period_status.open,
        deleted_at: null,
      },
      select: { id: true },
    });

    if (!open_period) {
      return Result.error("No active period found", ErrorCode.INVALID_ARGUMENT);
    }

    let period = await prisma.tb_physical_count_period.findFirst({
      where: {
        period_id: open_period.id,
        deleted_at: null,
      },
      include: {
        tb_period: {
          select: { id: true, period: true, start_at: true, end_at: true },
        },
        tb_physical_count: {
          select: {
            id: true,
            location_id: true,
            status: true,
            tb_location: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { tb_period: { start_at: "desc" } },
    });

    // Auto-create physical count period if none exists for current period
    if (!period) {
      const created = await prisma.tb_physical_count_period.create({
        data: {
          period_id: open_period.id,
          status: enum_physical_count_period_status.draft,
          created_by_id: user_id,
        },
      });

      period = await prisma.tb_physical_count_period.findFirst({
        where: { id: created.id },
        include: {
          tb_period: {
            select: { id: true, period: true, start_at: true, end_at: true },
          },
          tb_physical_count: {
            select: {
              id: true,
              location_id: true,
              status: true,
              tb_location: {
                select: {
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });
    }

    const existingCounts = await prisma.tb_physical_count.findMany({
      where: {
        physical_count_period_id: period.id,
        deleted_at: null,
      },
      select: {
        id: true,
        location_id: true,
        status: true,
        start_counting_at: true,
        completed_at: true,
      },
    });

    const countByLocation = new Map(existingCounts.map((c) => [c.location_id, {
      id: c.id,
      status: c.status,
      start_counting_at: c.start_counting_at,
      completed_at: c.completed_at,
    }]));

    // Get locations with physical_count_type filter
    let locations = await prisma.tb_location.findMany({
      where: {
        location_type: {
          in: [enum_location_type.inventory, enum_location_type.consignment],
        },
        ...(include_not_count ? {} : { physical_count_type: enum_physical_count_type.yes }),
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        location_type: true,
        physical_count_type: true,
      },
      orderBy: [{ code: 'asc' }, { name: 'asc' }],
    });

    // When not including all, union locations that already have physical counts in this period
    if (!include_not_count) {
      const existingLocationIds = new Set(locations.map((loc) => loc.id));
      const missingLocationIds = existingCounts
        .map((c) => c.location_id)
        .filter((id) => !existingLocationIds.has(id));

      if (missingLocationIds.length > 0) {
        const extraLocations = await prisma.tb_location.findMany({
          where: {
            id: { in: missingLocationIds },
            deleted_at: null,
          },
          select: {
            id: true,
            code: true,
            name: true,
            location_type: true,
            physical_count_type: true,
          },
          orderBy: [{ code: 'asc' }, { name: 'asc' }],
        });
        locations = [...locations, ...extraLocations];
        locations.sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '') || (a.name ?? '').localeCompare(b.name ?? ''));
      }
    }

    // Count items already counted per physical_count_id (only those with counted_at)
    const physicalCountIds = existingCounts.map((c) => c.id);
    let countedByPhysicalCount = new Map<string, number>();
    if (physicalCountIds.length > 0) {
      const countedItems = await prisma.tb_physical_count_detail.groupBy({
        by: ["physical_count_id"],
        where: {
          physical_count_id: { in: physicalCountIds },
          counted_at: { not: null },
          deleted_at: null,
        },
        _count: { id: true },
      });
      countedByPhysicalCount = new Map(countedItems.map((ci) => [ci.physical_count_id, ci._count.id]));
    }

    // Count products per location
    const locationIds = locations.map((loc) => loc.id);
    const productCounts = await prisma.tb_product_location.groupBy({
      by: ["location_id"],
      where: {
        location_id: { in: locationIds },
        deleted_at: null,
      },
      _count: { product_id: true },
    });
    const productCountByLocation = new Map(productCounts.map((pc) => [pc.location_id, pc._count.product_id]));

    const locationsWithStatus = locations.map((loc) => {
      const existingCount = countByLocation.get(loc.id);
      return {
        id: loc.id,
        code: loc.code,
        name: loc.name,
        location_type: loc.location_type,
        physical_count_type: loc.physical_count_type,
        product_counted: existingCount ? countedByPhysicalCount.get(existingCount.id) || 0 : 0,
        product_total: productCountByLocation.get(loc.id) || 0,
        physical_count_status: existingCount ? existingCount.status : "not_started",
        physical_count_id: existingCount ? existingCount.id : null,
        start_counting_at: existingCount?.start_counting_at || null,
        completed_at: existingCount?.completed_at || null,
      };
    });

    const response = {
      id: period.id,
      period_id: period.period_id,
      tb_period: period.tb_period,
      status: period.status,
      locations: locationsWithStatus,
    };

    return Result.ok(response);
  }

  /**
   * Create a new physical count period
   * สร้างรอบการตรวจนับสินค้าใหม่
   * @param data - Physical count period creation data / ข้อมูลสร้างรอบการตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created period ID / ID รอบที่สร้างแล้ว
   */
  @TryCatch
  async create(data: IPhysicalCountPeriodCreate, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "create", data, user_id, tenant_id }, PhysicalCountPeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Validate period exists and is open
    const periodExists = await prisma.tb_period.findFirst({
      where: { id: data.period_id, deleted_at: null },
    });
    if (!periodExists) {
      return Result.error("Period not found", ErrorCode.NOT_FOUND);
    }
    if (periodExists.status !== "open") {
      return Result.error("Period is not open", ErrorCode.INVALID_ARGUMENT);
    }

    // Check duplicate: only one physical count period per period
    const existing = await prisma.tb_physical_count_period.findFirst({
      where: { period_id: data.period_id, deleted_at: null },
    });
    if (existing) {
      return Result.error("Physical count period already exists for this period", ErrorCode.ALREADY_EXISTS);
    }

    const period = await prisma.tb_physical_count_period.create({
      data: {
        period_id: data.period_id,
        status: (data.status as enum_physical_count_period_status) || enum_physical_count_period_status.draft,
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: period.id });
  }

  /**
   * Update a physical count period
   * แก้ไขรอบการตรวจนับสินค้า
   * @param data - Physical count period update data / ข้อมูลแก้ไขรอบการตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated period ID / ID รอบที่แก้ไขแล้ว
   */
  @TryCatch
  async update(data: IPhysicalCountPeriodUpdate, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "update", data, user_id, tenant_id }, PhysicalCountPeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingPeriod = await prisma.tb_physical_count_period.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error("Physical Count Period not found", ErrorCode.NOT_FOUND);
    }

    const { id, ...updateData } = data;

    const updatePayload: Record<string, unknown> = {
      updated_by_id: user_id,
      updated_at: new Date().toISOString(),
    };

    if (updateData.period_id) {
      updatePayload.period_id = updateData.period_id;
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

  /**
   * Soft delete a physical count period
   * ลบรอบการตรวจนับสินค้าแบบซอฟต์ดีลีท
   * @param id - Physical count period ID / ID รอบการตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted period ID / ID รอบที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "delete", id, user_id, tenant_id }, PhysicalCountPeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingPeriod = await prisma.tb_physical_count_period.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error("Physical Count Period not found", ErrorCode.NOT_FOUND);
    }

    const associatedCounts = await prisma.tb_physical_count.count({
      where: { physical_count_period_id: id, deleted_at: null },
    });

    if (associatedCounts > 0) {
      return Result.error("Cannot delete period with associated physical counts", ErrorCode.INVALID_ARGUMENT);
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
