import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";
import { PrismaClient_TENANT, Prisma, enum_period_status } from "@repo/prisma-shared-schema-tenant";
import { TenantService } from "@/tenant/tenant.service";
import QueryParams from "@/libs/paginate.query";
import { ICreatePeriod, IUpdatePeriod } from "./interface/period.interface";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { Injectable, Inject } from "@nestjs/common";
import { IPaginate } from "@/common/shared-interface/paginate.interface";
import { Result, ErrorCode, TryCatch } from "@/common";

@Injectable()
export class PeriodService {
  private readonly logger: BackendLogger = new BackendLogger(PeriodService.name);

  constructor(
    @Inject("PRISMA_SYSTEM")
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject("PRISMA_TENANT")
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Find a period by ID
   * ค้นหางวดรายการเดียวตาม ID
   * @param id - Period ID / ID งวด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Period detail / รายละเอียดงวด
   */
  @TryCatch
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "findOne", id, user_id, tenant_id }, PeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const period = await prisma.tb_period.findFirst({
      where: { id, deleted_at: null },
    });

    if (!period) {
      return Result.error("Period not found", ErrorCode.NOT_FOUND);
    }

    return Result.ok(period);
  }

  /**
   * Find all periods with pagination
   * ค้นหางวดทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of periods / รายการงวดแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: "findAll", user_id, tenant_id, paginate }, PeriodService.name);

    const defaultSearchFields: string[] = ["period"];

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

    const findManyArgs = q.findMany();
    const hasCustomSort = Array.isArray(findManyArgs.orderBy)
      ? findManyArgs.orderBy.length > 0
      : Object.keys(findManyArgs.orderBy).length > 0;

    const data = await prisma.tb_period.findMany({
      ...findManyArgs,
      select: {
        id: true,
        period: true,
        fiscal_year: true,
        fiscal_month: true,
        start_at: true,
        end_at: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      where: {
        ...q.where(),
        deleted_at: null,
      },
      ...(hasCustomSort
        ? {}
        : { orderBy: [{ status: "asc" }, { fiscal_year: "asc" }, { fiscal_month: "asc" }] }),
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

  /**
   * Create a new period
   * สร้างงวดใหม่
   * @param data - Period creation data / ข้อมูลสร้างงวด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created period ID / ID งวดที่สร้างแล้ว
   */
  @TryCatch
  async create(data: ICreatePeriod, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "create", data, user_id, tenant_id }, PeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const period_code = data.fiscal_year.toString().slice(-2) + data.fiscal_month.toString().padStart(2, "0");

    const foundPeriod = await prisma.tb_period.findFirst({
      where: {
        period: period_code,
        deleted_at: null,
      },
    });

    if (foundPeriod) {
      return Result.error("Period already exists", ErrorCode.ALREADY_EXISTS);
    }

    const foundFiscalPeriod = await prisma.tb_period.findFirst({
      where: {
        fiscal_year: data.fiscal_year,
        fiscal_month: data.fiscal_month,
        deleted_at: null,
      },
    });

    if (foundFiscalPeriod) {
      return Result.error("Fiscal year/month combination already exists", ErrorCode.ALREADY_EXISTS);
    }

    const rawStart = data.start_at;
    const startAtStr =
      typeof rawStart === "string" ? rawStart : rawStart instanceof Date ? rawStart.toISOString() : null;

    if (!startAtStr || isNaN(new Date(startAtStr).getTime())) {
      return Result.error("Invalid start_at date", ErrorCode.INVALID_ARGUMENT);
    }

    // Auto-calculate end_at as midnight UTC of the last day of fiscal_month
    // Using day 0 of next month = last day of this month; stored at 00:00:00Z so UTC+7 display stays on the correct date
    const endAtStr = new Date(Date.UTC(data.fiscal_year, data.fiscal_month, 0)).toISOString();

    const period = await prisma.tb_period.create({
      data: {
        period: period_code,
        fiscal_year: data.fiscal_year,
        fiscal_month: data.fiscal_month,
        start_at: startAtStr,
        end_at: endAtStr,
        status: (data.status as enum_period_status) || enum_period_status.open,
        note: data.note,
        info: (data.info || {}) as Prisma.InputJsonValue,
        dimension: (data.dimension || []) as Prisma.InputJsonValue,
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: period.id });
  }

  /**
   * Update a period
   * แก้ไขงวด
   * @param data - Period update data / ข้อมูลแก้ไขงวด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated period ID / ID งวดที่แก้ไขแล้ว
   */
  @TryCatch
  async update(data: IUpdatePeriod, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "update", data, user_id, tenant_id }, PeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingPeriod = await prisma.tb_period.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error("Period not found", ErrorCode.NOT_FOUND);
    }

    const { id, ...fields } = data;

    this.logger.debug(
      {
        function: "update-debug",
        start_at_type: typeof fields.start_at,
        start_at_value: JSON.stringify(fields.start_at),
        start_at_isDate: fields.start_at instanceof Date,
        end_at_type: typeof fields.end_at,
        end_at_value: JSON.stringify(fields.end_at),
        new_date_test: JSON.stringify(new Date()),
      },
      PeriodService.name,
    );

    const updatePayload: Record<string, unknown> = {
      updated_by_id: user_id,
      updated_at: new Date().toISOString(),
    };

    // if (fields.period !== undefined) updatePayload.period = fields.period;
    if (fields.fiscal_year !== undefined) updatePayload.fiscal_year = fields.fiscal_year;
    if (fields.fiscal_month !== undefined) updatePayload.fiscal_month = fields.fiscal_month;
    if (fields.start_at !== undefined) {
      const raw = fields.start_at;
      const dateStr = typeof raw === "string" ? raw : raw instanceof Date ? raw.toISOString() : null;
      if (!dateStr || isNaN(new Date(dateStr).getTime())) {
        return Result.error("Invalid start_at date", ErrorCode.INVALID_ARGUMENT);
      }
      updatePayload.start_at = dateStr;
    }
    if (fields.end_at !== undefined) {
      const raw = fields.end_at;
      const dateStr = typeof raw === "string" ? raw : raw instanceof Date ? raw.toISOString() : null;
      if (!dateStr || isNaN(new Date(dateStr).getTime())) {
        return Result.error("Invalid end_at date", ErrorCode.INVALID_ARGUMENT);
      }
      updatePayload.end_at = dateStr;
    }
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

  /**
   * Generate next periods automatically
   * สร้างงวดถัดไปโดยอัตโนมัติ
   * @param count - Number of periods to generate / จำนวนงวดที่จะสร้าง
   * @param start_day - Start day of each period / วันเริ่มต้นของแต่ละงวด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created and skipped period details / รายละเอียดงวดที่สร้างและข้าม
   */
  @TryCatch
  async generateNextPeriods(count: number, start_day: number, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    const safeCount = Number(count);
    const safeStartDay = Number(start_day) || 1;

    this.logger.debug({ function: "generateNextPeriods", count, safeCount, start_day: safeStartDay, user_id, tenant_id }, PeriodService.name);

    if (!safeCount || safeCount <= 0 || !Number.isInteger(safeCount)) {
      return Result.error(`count must be a positive integer, received: ${count}`, ErrorCode.INVALID_ARGUMENT);
    }

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Find all open periods sorted ascending
    const openPeriods = await prisma.tb_period.findMany({
      where: { status: enum_period_status.open, deleted_at: null },
      orderBy: [{ fiscal_year: "asc" }, { fiscal_month: "asc" }],
      select: { id: true, period: true, fiscal_year: true, fiscal_month: true },
    });

    const existingOpenCount = openPeriods.length;

    // Already have enough open periods — nothing to create
    if (existingOpenCount >= safeCount) {
      return Result.ok({
        message: `Already have ${existingOpenCount} open period(s) — no new periods created`,
        existing_open_count: existingOpenCount,
        created: [],
        total_created: 0,
      });
    }

    const periodsToCreate = safeCount - existingOpenCount;

    // Start from month after the last open period (or last period of any status, or current month)
    const lastOpenPeriod = openPeriods[openPeriods.length - 1] ?? null;

    let startYear: number;
    let startMonth: number;

    if (lastOpenPeriod) {
      startYear = lastOpenPeriod.fiscal_year;
      startMonth = lastOpenPeriod.fiscal_month + 1;
      if (startMonth > 12) {
        startMonth = 1;
        startYear += 1;
      }
    } else {
      const lastAnyPeriod = await prisma.tb_period.findFirst({
        where: { deleted_at: null },
        orderBy: [{ fiscal_year: "desc" }, { fiscal_month: "desc" }],
      });
      if (lastAnyPeriod) {
        startYear = lastAnyPeriod.fiscal_year;
        startMonth = lastAnyPeriod.fiscal_month + 1;
        if (startMonth > 12) {
          startMonth = 1;
          startYear += 1;
        }
      } else {
        const now = new Date();
        startYear = now.getFullYear();
        startMonth = now.getMonth() + 1;
      }
    }

    const createdPeriods: { id: string; period: string; fiscal_year: number; fiscal_month: number; start_at: string; end_at: string }[] = [];
    const skippedPeriods: { period: string; reason: string }[] = [];

    let year = startYear;
    let month = startMonth;
    const maxIterations = periodsToCreate + 120; // safety limit to prevent infinite loop

    for (let i = 0; createdPeriods.length < periodsToCreate && i < maxIterations; i++) {
      const periodCode = year.toString().slice(-2) + month.toString().padStart(2, "0");

      // Check if period already exists
      const existing = await prisma.tb_period.findFirst({
        where: {
          OR: [
            { period: periodCode, deleted_at: null },
            { fiscal_year: year, fiscal_month: month, deleted_at: null },
          ],
        },
      });

      if (existing) {
        skippedPeriods.push({ period: periodCode, reason: "Already exists" });
      } else {
        // Calculate start_at and end_at based on safeStartDay
        const startAt = new Date(Date.UTC(year, month - 1, safeStartDay)).toISOString();
        // end_at: midnight UTC of last day of month — day 0 of next month = last day of this month
        const endAt = new Date(Date.UTC(year, month, 0)).toISOString();

        const period = await prisma.tb_period.create({
          data: {
            period: periodCode,
            fiscal_year: year,
            fiscal_month: month,
            start_at: startAt,
            end_at: endAt,
            status: enum_period_status.open,
            info: {} as Prisma.InputJsonValue,
            dimension: [] as Prisma.InputJsonValue,
            created_by_id: user_id,
          },
        });

        createdPeriods.push({
          id: period.id,
          period: periodCode,
          fiscal_year: year,
          fiscal_month: month,
          start_at: startAt,
          end_at: endAt,
        });
      }

      // Move to next month
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    return Result.ok({
      existing_open_count: existingOpenCount,
      start_from: { fiscal_year: startYear, fiscal_month: startMonth },
      created: createdPeriods,
      skipped: skippedPeriods,
      total_created: createdPeriods.length,
      total_skipped: skippedPeriods.length,
    });
  }

  /**
   * Find the current period (status is open or locked)
   * ค้นหางวดปัจจุบัน (สถานะเปิดหรือล็อค)
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Current period / งวดปัจจุบัน
   */
  @TryCatch
  async findCurrent(user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "findCurrent", user_id, tenant_id }, PeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const period = await prisma.tb_period.findFirst({
      where: {
        status: { in: [enum_period_status.open, enum_period_status.locked] },
        deleted_at: null,
      },
      orderBy: [{ fiscal_year: "asc" }, { fiscal_month: "asc" }],
    });

    if (!period) {
      return Result.error("No current period found", ErrorCode.NOT_FOUND);
    }

    return Result.ok(period);
  }

  /**
   * Soft delete a period
   * ลบงวดแบบซอฟต์ดีลีท
   * @param id - Period ID / ID งวด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted period ID / ID งวดที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: "delete", id, user_id, tenant_id }, PeriodService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error("Tenant not found", ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingPeriod = await prisma.tb_period.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingPeriod) {
      return Result.error("Period not found", ErrorCode.NOT_FOUND);
    }

    await prisma.tb_period.update({
      where: { id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: user_id,
        updated_at: new Date().toISOString(),
        updated_by_id: user_id,
      },
    });

    return Result.ok({ id });
  }
}
