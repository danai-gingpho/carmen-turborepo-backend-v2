import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  PrismaClient_TENANT,
  enum_spot_check_method,
  enum_location_type,
  enum_physical_count_type,
  enum_period_status,
} from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { format } from 'date-fns';
import QueryParams from '@/libs/paginate.query';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Result, ErrorCode, TryCatch } from '@/common';
import {
  renderViaMicroReport,
  formatReportDate,
} from '@/common/print-report.helper';
import { SpotCheckLogic } from './spot-check.logic';

@Injectable()
export class SpotCheckService {
  private readonly logger = new BackendLogger(SpotCheckService.name);

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
    private readonly spotCheckLogic: SpotCheckLogic,
  ) { }

  /**
   * Get Prisma client for the tenant
   * ดึง Prisma client สำหรับผู้เช่า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Prisma client instance or null / Prisma client instance หรือ null
   */
  private async getPrisma(user_id: string, tenant_id: string) {
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) return null;
    return this.prismaTenant(tenant.tenant_id, tenant.db_connection);
  }

  /**
   * Find a spot check by ID
   * ค้นหาการตรวจสอบจุดรายการเดียวตาม ID
   * @param id - Spot check ID / ID การตรวจสอบจุด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Spot check detail with location and items / รายละเอียดการตรวจสอบจุดพร้อมสถานที่และรายการ
   */
  @TryCatch
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id },
      SpotCheckService.name,
    );

    const prisma = await this.getPrisma(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const spotCheck = await prisma.tb_spot_check.findFirst({
      where: { id },
      include: {
        tb_location: { select: { id: true, name: true, code: true } },
        tb_spot_check_detail: {
          where: { deleted_at: null },
          orderBy: { sequence_no: 'asc' },
          include: {
            tb_product: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!spotCheck) {
      return Result.error('Spot check not found', ErrorCode.NOT_FOUND);
    }

    const serialized = {
      ...spotCheck,
      tb_spot_check_detail: spotCheck.tb_spot_check_detail.map((d) => ({
        ...d,
        on_hand_qty: d.on_hand_qty != null ? Number(d.on_hand_qty) : null,
        actual_qty: d.actual_qty != null ? Number(d.actual_qty) : null,
        diff_qty: d.diff_qty != null ? Number(d.diff_qty) : null,
      })),
    };

    return Result.ok(serialized);
  }

  /**
   * Find all spot checks with pagination
   * ค้นหาการตรวจสอบจุดทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of spot checks / รายการการตรวจสอบจุดแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate },
      SpotCheckService.name,
    );

    const defaultSearchFields = ['spot_check_no', 'location_name'];
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

    const prisma = await this.getPrisma(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const [data, total] = await Promise.all([
      prisma.tb_spot_check.findMany({
        where: q.where(),
        orderBy: q.orderBy(),
        skip: q.perpage < 0 ? undefined : (q.page - 1) * q.perpage,
        take: q.perpage < 0 ? undefined : q.perpage,
        include: {
          tb_location: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.tb_spot_check.count({ where: q.where() }),
    ]);

    return Result.ok({
      data,
      paginate: {
        total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? total : q.perpage,
        pages:
          total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Create a new spot check
   * สร้างการตรวจสอบจุดใหม่
   * @param data - Spot check creation data (location, method, items) / ข้อมูลสร้างการตรวจสอบจุด (สถานที่, วิธีการ, รายการ)
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created spot check ID / ID การตรวจสอบจุดที่สร้างแล้ว
   */
  @TryCatch
  async create(
    data: {
      location_id: string;
      method?: enum_spot_check_method;
      items?: number;
      product_id?: string[];
      description?: string;
      note?: string;
    },
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      SpotCheckService.name,
    );

    const prisma = await this.getPrisma(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const location = await prisma.tb_location.findFirst({
      where: { id: data.location_id },
      select: { id: true, name: true, code: true },
    });
    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    const allProducts = await this.spotCheckLogic.getProductsByLocation(
      prisma,
      data.location_id,
    );
    const productTotal = allProducts.length;

    if (productTotal === 0) {
      return Result.error(
        'No products found at this location',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    let selectedProducts;
    const method = data.method || 'random';
    const productCount = data.items || productTotal;

    switch (method) {
      case 'random': {
        const count = Math.min(productCount, productTotal);
        selectedProducts = this.spotCheckLogic.selectRandom(
          allProducts,
          count,
        );
        break;
      }
      case 'manual': {
        if (
          !data.product_id ||
          !Array.isArray(data.product_id) ||
          data.product_id.length === 0
        ) {
          return Result.error(
            'product_id is required for manual selection',
            ErrorCode.INVALID_ARGUMENT,
          );
        }
        const manualIds = data.product_id;
        selectedProducts = this.spotCheckLogic.selectManual(
          allProducts,
          manualIds,
        );
        if (selectedProducts.length === 0) {
          return Result.error(
            'None of the selected products were found at this location',
            ErrorCode.INVALID_ARGUMENT,
          );
        }
        break;
      }
      case 'high_value': {
        const period = await this.spotCheckLogic.getActivePeriod(prisma);
        if (!period) {
          return Result.error('No active period found', ErrorCode.NOT_FOUND);
        }
        const count = Math.min(productCount, productTotal);
        selectedProducts = await this.spotCheckLogic.selectHighValue(
          prisma,
          allProducts,
          count,
          data.location_id,
          period.start_at,
          period.end_at,
        );
        break;
      }
      default:
        return Result.error(
          `Invalid method: ${method}`,
          ErrorCode.INVALID_ARGUMENT,
        );
    }

    const spotCheckNo = await this.generateSCNo(
      new Date().toISOString(),
      tenant_id,
      user_id,
    );

    const spotCheck = await prisma.tb_spot_check.create({
      data: {
        spot_check_no: spotCheckNo,
        location_id: location.id,
        location_name: location.name,
        location_code: location.code,
        method: method,
        size: selectedProducts.length,
        description: data.description,
        note: data.note,
        doc_status: 'pending',
        created_by_id: user_id,
      },
    });

    const detailData = this.spotCheckLogic.buildDetailCreateData(
      selectedProducts,
      spotCheck.id,
      user_id,
    );
    for (const detail of detailData) {
      await prisma.tb_spot_check_detail.create({ data: detail });
    }

    return Result.ok({ id: spotCheck.id });
  }

  /**
   * Update a spot check
   * แก้ไขการตรวจสอบจุด
   * @param id - Spot check ID / ID การตรวจสอบจุด
   * @param data - Spot check update data / ข้อมูลแก้ไขการตรวจสอบจุด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated spot check / การตรวจสอบจุดที่แก้ไขแล้ว
   */
  @TryCatch
  async update(
    id: string,
    data: {
      description?: string;
      note?: string;
    },
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', id, data, user_id, tenant_id },
      SpotCheckService.name,
    );

    const prisma = await this.getPrisma(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const spotCheck = await prisma.tb_spot_check.findFirst({
      where: { id, deleted_at: null },
    });
    if (!spotCheck) {
      return Result.error('Spot check not found', ErrorCode.NOT_FOUND);
    }

    if (spotCheck.doc_status !== 'pending') {
      return Result.error(
        'Only pending spot checks can be updated',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const updated = await prisma.tb_spot_check.update({
      where: { id },
      data: {
        description: data.description,
        note: data.note,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok(updated);
  }

  /**
   * Soft delete a spot check
   * ลบการตรวจสอบจุดแบบซอฟต์ดีลีท
   * @param id - Spot check ID / ID การตรวจสอบจุด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted spot check ID / ID การตรวจสอบจุดที่ลบแล้ว
   */
  @TryCatch
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id },
      SpotCheckService.name,
    );

    const prisma = await this.getPrisma(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const spotCheck = await prisma.tb_spot_check.findFirst({
      where: { id },
    });
    if (!spotCheck) {
      return Result.error('Spot check not found', ErrorCode.NOT_FOUND);
    }

    await prisma.tb_spot_check.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok({ id });
  }

  /**
   * Generate spot check document number
   * สร้างเลขที่เอกสารการตรวจสอบจุด
   * @param scDate - Spot check date / วันที่ตรวจสอบจุด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Generated document number / เลขที่เอกสารที่สร้างขึ้น
   */
  private async generateSCNo(
    scDate: string,
    bu_code: string,
    user_id: string,
  ): Promise<string> {
    this.logger.debug(
      { function: 'generateSCNo', scDate, bu_code, user_id },
      SpotCheckService.name,
    );

     
    const res: Observable<any> = this.masterService.send(
      {
        cmd: 'running-code.get-pattern-by-type',
        service: 'running-codes',
      },
      { type: 'SC', user_id, bu_code },
    );
    const response = await firstValueFrom(res);

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Failed to get running code pattern for SC: ${JSON.stringify(response)}`);
    }

    const patterns = response.data;

    if (patterns.length === 0) {
      throw new Error('No running code pattern configured for SC');
    }

    let datePattern;
    let runningPattern;
    patterns.forEach((pattern: Record<string, unknown>) => {
      if (pattern.type === 'date') datePattern = pattern;
      else if (pattern.type === 'running') runningPattern = pattern;
    });

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for SC: datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    const getDate = new Date(scDate);
    const datePatternValue = format(getDate, datePattern.pattern);

    const prisma = await this.getPrisma(user_id, bu_code);
    const latestSC = prisma
      ? await prisma.tb_spot_check.findFirst({
        where: { spot_check_no: { contains: datePatternValue } },
        orderBy: { spot_check_no: 'desc' },
      })
      : null;

    const latestNumber = latestSC?.spot_check_no
      ? Number(
        latestSC.spot_check_no.slice(-Number(runningPattern.pattern)),
      )
      : 0;

     
    const generateCodeRes: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'SC',
        issueDate: getDate,
        last_no: latestNumber,
        user_id,
        bu_code,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);

    if (!generateCodeResponse?.data?.code) {
      throw new Error(`Failed to generate SC number: ${JSON.stringify(generateCodeResponse)}`);
    }

    return generateCodeResponse.data.code;
  }

  /**
   * Find current period spot checks grouped by location
   * ค้นหาการตรวจสอบจุดในงวดปัจจุบันจัดกลุ่มตามสถานที่
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param include_not_count - Include locations with physical_count_type=no / รวมสถานที่ที่ไม่ตรวจนับ
   * @returns Locations with spot check status / สถานที่พร้อมสถานะการตรวจสอบจุด
   */
  @TryCatch
  async findCurrentByLocation(
    user_id: string,
    tenant_id: string,
    include_not_count?: boolean,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findCurrentByLocation', user_id, tenant_id, include_not_count },
      SpotCheckService.name,
    );

    const prisma = await this.getPrisma(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    // Get current open period
    const open_period = await prisma.tb_period.findFirst({
      where: {
        status: enum_period_status.open,
        deleted_at: null,
      },
      select: { id: true, start_at: true, end_at: true },
    });

    if (!open_period) {
      return Result.error('No active period found', ErrorCode.NOT_FOUND);
    }

    // Get spot checks within the current period date range
    const spotChecks = await prisma.tb_spot_check.findMany({
      where: {
        start_date: {
          gte: open_period.start_at,
          lte: open_period.end_at,
        },
        doc_status: { notIn: ['void', 'completed'] },
        deleted_at: null,
      },
      select: {
        id: true,
        spot_check_no: true,
        location_id: true,
        doc_status: true,
        start_date: true,
        end_date: true,
        method: true,
        size: true,
      },
    });

    // Group spot checks by location
    const spotCheckByLocation = new Map<string, typeof spotChecks>();
    for (const sc of spotChecks) {
      const existing = spotCheckByLocation.get(sc.location_id) || [];
      existing.push(sc);
      spotCheckByLocation.set(sc.location_id, existing);
    }

    // Count spot check details per spot_check_id
    const spotCheckIds = spotChecks.map((sc) => sc.id);
    let countedBySpotCheck = new Map<string, number>();
    if (spotCheckIds.length > 0) {
      const countedItems = await prisma.tb_spot_check_detail.groupBy({
        by: ['spot_check_id'],
        where: {
          spot_check_id: { in: spotCheckIds },
          deleted_at: null,
        },
        _count: { id: true },
      });
      countedBySpotCheck = new Map(
        countedItems.map((ci) => [ci.spot_check_id, ci._count.id]),
      );
    }

    // Get locations
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

    // Union locations that already have spot checks in this period
    if (!include_not_count) {
      const existingLocationIds = new Set(locations.map((loc) => loc.id));
      const missingLocationIds = [...spotCheckByLocation.keys()]
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
        locations = [...locations, ...extraLocations].sort((a, b) =>
          (a.code || '').localeCompare(b.code || '') || (a.name || '').localeCompare(b.name || ''),
        );
      }
    }

    const locationsWithStatus = locations.map((loc) => {
      const scList = spotCheckByLocation.get(loc.id) || [];
      // Latest spot check for this location
      const latestSc = scList.length > 0
        ? scList.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0]
        : null;

      return {
        id: loc.id,
        code: loc.code,
        name: loc.name,
        location_type: loc.location_type,
        physical_count_type: loc.physical_count_type,
        method: latestSc?.method || null,
        size: latestSc?.size || 0,
        counted: latestSc ? (countedBySpotCheck.get(latestSc.id) || 0) : 0,
        spot_check_count: scList.length,
        latest_spot_check: latestSc ? {
          id: latestSc.id,
          spot_check_no: latestSc.spot_check_no,
          doc_status: latestSc.doc_status,
          start_date: latestSc.start_date,
          end_date: latestSc.end_date,
        } : null,
      };
    });

    return Result.ok(locationsWithStatus);
  }

  /**
   * Count pending spot checks for a user across all business units
   * นับจำนวนการตรวจสอบจุดที่รอดำเนินการของผู้ใช้ทุก BU
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Pending count per BU and total / จำนวนที่รอดำเนินการต่อ BU และรวม
   */
  @TryCatch
  async findAllPendingCount(user_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllPendingCount', user_id },
      SpotCheckService.name,
    );

    // Get all business units for this user
    const userBUs = await this.prismaSystem.tb_user_tb_business_unit.findMany({
      where: { user_id, is_active: true },
      select: {
        tb_business_unit: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    let totalPending = 0;
    const details: { bu_code: string; bu_name: string; pending: number }[] = [];

    for (const userBU of userBUs) {
      const bu = userBU.tb_business_unit;
      try {
        const tenant = await this.tenantService.getdb_connection(user_id, bu.id);
        if (!tenant) continue;

        const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

        const count = await prisma.tb_spot_check.count({
          where: {
            doc_status: 'pending',
            deleted_at: null,
          },
        });

        totalPending += count;
        details.push({
          bu_code: bu.code,
          bu_name: bu.name,
          pending: count,
        });
      } catch {
        // Skip BU if tenant connection fails
      }
    }

    return Result.ok({
      pending: totalPending,
      details,
    });
  }

  /**
   * Print a spot check via FastReport viewer (micro-report)
   * พิมพ์ใบสุ่มตรวจสินค้าผ่าน FastReport viewer (micro-report)
   */
  @TryCatch
  async printToReport(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id, user_id, tenant_id },
      SpotCheckService.name,
    );

    const prisma = await this.getPrisma(user_id, tenant_id);
    if (!prisma) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const sc = await prisma.tb_spot_check.findFirst({
      where: { id },
      include: {
        tb_spot_check_detail: { orderBy: { sequence_no: 'asc' } },
      },
    });
    if (!sc) {
      return Result.error('Spot check not found', ErrorCode.NOT_FOUND);
    }

    return renderViaMicroReport({
      prismaSystem: this.prismaSystem,
      bu_code: tenant_id,
      documentType: 'SC',
      datasetPrefix: 'SC',
      buildHeader: () => ({
        SpotCheckNo: sc.spot_check_no || '',
        StartDate: formatReportDate(sc.start_date),
        EndDate: formatReportDate(sc.end_date),
        LocationName: sc.location_name || '',
        LocationCode: sc.location_code || '',
        Method: sc.method || '',
        Size: sc.size || 0,
        ScStatus: sc.doc_status || '',
        Description: sc.description || '',
      }),
      buildDetail: () =>
        sc.tb_spot_check_detail.map((d: any, i: number) => ({
          No: String(i + 1),
          ProductName: d.product_name || '',
          ProductCode: d.product_code || '',
          ProductSku: d.product_sku || '',
        })),
    });
  }
}
