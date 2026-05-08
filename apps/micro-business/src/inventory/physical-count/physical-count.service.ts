import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  PrismaClient_TENANT,
  enum_physical_count_status,
  enum_physical_count_period_status,
  enum_doc_status,
  enum_business_unit_config_key,
  Prisma,
} from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/libs/paginate.query';
import {
  IPhysicalCountCreate,
  IPhysicalCountSave,
  IPhysicalCountSubmit,
  IPhysicalCountDetailCommentCreate,
  IPhysicalCountDetailCommentUpdate,
  IPhysicalCountDetailCommentAttachment,
} from './interface/physical-count.interface';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Injectable, Inject } from '@nestjs/common';
import { format } from 'date-fns';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';
import { CostingService } from '@/inventory/costing/costing.service';
import {
  CostingMethod,
  isCostingMethod,
  costMapKey,
} from '@/inventory/costing/costing.types';
import {
  renderViaMicroReport,
  formatReportDate,
} from '@/common/print-report.helper';

@Injectable()
export class PhysicalCountService {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountService.name,
  );

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
    private readonly costingService: CostingService,
  ) { }

  /**
   * Find a physical count by ID
   * ค้นหาการตรวจนับสินค้ารายการเดียวตาม ID
   * @param id - Physical count ID / ID การตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Physical count detail with items / รายละเอียดการตรวจนับสินค้าพร้อมรายการ
   */
  @TryCatch
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id },
      PhysicalCountService.name,
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

    return this.getPhysicalCountWithDetails(prisma, id);
  }

   
  private async getPhysicalCountWithDetails(
    prisma: any,
    id: string,
  ): Promise<Result<unknown>> {
    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    const details = await prisma.tb_physical_count_detail.findMany({
      where: { physical_count_id: id, deleted_at: null },
      include: {
        tb_unit_inventory: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ product_code: 'asc' }, { product_name: 'asc' }],
    });

    const serializedDetails = details.map((d: any) => ({
      id: d.id,
      physical_count_id: d.physical_count_id,
      product_id: d.product_id,
      product_code: d.product_code,
      product_name: d.product_name,
      product_local_name: d.product_local_name,
      product_sku: d.product_sku,
      inventory_unit_id: d.inventory_unit_id,
      inventory_unit_name: d.tb_unit_inventory?.name ?? null,
      on_hand_qty: d.on_hand_qty != null ? Number(d.on_hand_qty) : null,
      actual_qty: d.actual_qty != null ? Number(d.actual_qty) : null,
      diff_qty: d.diff_qty != null ? Number(d.diff_qty) : null,
      counted_at: d.counted_at,
      counted_by_id: d.counted_by_id,
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));

    return Result.ok({
      id: physicalCount.id,
      physical_count_period_id: physicalCount.physical_count_period_id,
      location_id: physicalCount.location_id,
      location_code: physicalCount.location_code,
      location_name: physicalCount.location_name,
      physical_count_type: physicalCount.physical_count_type,
      description: physicalCount.description,
      status: physicalCount.status,
      start_counting_at: physicalCount.start_counting_at,
      start_counting_by_id: physicalCount.start_counting_by_id,
      completed_at: physicalCount.completed_at,
      completed_by_id: physicalCount.completed_by_id,
      product_counted: physicalCount.product_counted,
      product_total: physicalCount.product_total,
      created_at: physicalCount.created_at,
      created_by_id: physicalCount.created_by_id,
      updated_at: physicalCount.updated_at,
      updated_by_id: physicalCount.updated_by_id,
      details: serializedDetails,
    });
  }

  /**
   * Find all physical counts with pagination
   * ค้นหาการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of physical counts / รายการการตรวจนับสินค้าแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    location_ids: string[] = [],
    period_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, location_ids, period_id },
      PhysicalCountService.name,
    );

    const defaultSearchFields = ['location_code', 'location_name'];

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

    const locationFilter = location_ids.length > 0
      ? { location_id: { in: location_ids } }
      : {};

    const periodFilter = period_id
      ? { physical_count_period_id: period_id }
      : {};

    const whereClause = {
      ...q.where(),
      ...locationFilter,
      ...periodFilter,
      deleted_at: null,
    };

    const physicalCountList = await prisma.tb_physical_count.findMany({
      where: whereClause,
      orderBy: q.orderBy(),
      skip: (q.page - 1) * q.perpage,
      ...(q.perpage >= 0 ? { take: q.perpage } : {}),
      select: {
        id: true,
        physical_count_period_id: true,
        location_id: true,
        location_code: true,
        location_name: true,
        status: true,
        product_total: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            tb_physical_count_detail: {
              where: {
                counted_at: { not: null },
                deleted_at: null,
              },
            },
          },
        },
      },
    });

    const mappedList = physicalCountList.map((item: any) => ({
      id: item.id,
      physical_count_period_id: item.physical_count_period_id,
      location_id: item.location_id,
      location_code: item.location_code,
      location_name: item.location_name,
      status: item.status,
      product_counted: item._count.tb_physical_count_detail,
      product_total: item.product_total,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    const total = await prisma.tb_physical_count.count({
      where: whereClause,
    });

    return Result.ok({
      data: mappedList,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Create a new physical count for a location
   * สร้างการตรวจนับสินค้าใหม่สำหรับสถานที่
   * @param data - Physical count creation data / ข้อมูลสร้างการตรวจนับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created physical count ID / ID การตรวจนับสินค้าที่สร้างแล้ว
   */
  @TryCatch
  async create(
    data: IPhysicalCountCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      PhysicalCountService.name,
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
      where: { id: data.physical_count_period_id, deleted_at: null },
    });

    if (!period) {
      return Result.error('Physical Count Period not found', ErrorCode.NOT_FOUND);
    }

    if (period.status !== enum_physical_count_period_status.counting) {
      return Result.error(
        'Physical Count Period is not in counting status',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const location = await prisma.tb_location.findFirst({
      where: { id: data.location_id, deleted_at: null },
    });

    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    const existingCount = await prisma.tb_physical_count.findFirst({
      where: {
        physical_count_period_id: data.physical_count_period_id,
        location_id: data.location_id,
        deleted_at: null,
      },
    });

    // Get products assigned to this location via tb_product_location
    const productLocations = await prisma.tb_product_location.findMany({
      where: { location_id: data.location_id, deleted_at: null },
      select: { product_id: true },
    });
    const assignedProductIds = productLocations.map((pl) => pl.product_id);

    // Also get products that have stock at this location (in case they're not assigned but have inventory)
    const stockGrouped = await prisma.tb_inventory_transaction_detail.groupBy({
      by: ['product_id'],
      where: { location_id: data.location_id },
      _sum: { qty: true },
    });
    const productIdsWithStock = stockGrouped
      .filter((g) => g._sum.qty && !g._sum.qty.equals(0))
      .map((g) => g.product_id);

    // Union both sets of product IDs
    const allProductIds = [...new Set([...assignedProductIds, ...productIdsWithStock])];

    // Get product details
    const products = allProductIds.length > 0
      ? await prisma.tb_product.findMany({
        where: { id: { in: allProductIds }, deleted_at: null },
        select: { id: true, name: true, local_name: true, code: true, sku: true, inventory_unit_id: true },
        orderBy: [{ code: 'asc' }, { name: 'asc' }],
      })
      : [];

    const stockByProduct = products.map((p) => ({
      product_id: p.id,
      product_name: p.name,
      product_local_name: p.local_name,
      product_code: p.code,
      product_sku: p.code,
      inventory_unit_id: p.inventory_unit_id,
    }));

    // If physical count already exists, sync product list and return
    if (existingCount) {
      const existingDetails = await prisma.tb_physical_count_detail.findMany({
        where: { physical_count_id: existingCount.id, deleted_at: null },
        select: { product_id: true },
      });
      const existingProductIds = new Set(existingDetails.map((d) => d.product_id));

      const newProducts = stockByProduct.filter((p) => !existingProductIds.has(p.product_id));

      if (newProducts.length > 0) {
        await prisma.tb_physical_count_detail.createMany({
          data: newProducts.map((item) => ({
            physical_count_id: existingCount.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_local_name: item.product_local_name,
            product_code: item.product_code,
            product_sku: item.product_sku,
            inventory_unit_id: item.inventory_unit_id,
            on_hand_qty: 0,
            actual_qty: 0,
            diff_qty: 0,
            created_by_id: user_id,
          })),
        });

        await prisma.tb_physical_count.update({
          where: { id: existingCount.id },
          data: { product_total: existingProductIds.size + newProducts.length },
        });
      }

      return Result.ok({ id: existingCount.id });
    }

    // Create physical count and details in transaction
    const result = await prisma.$transaction(async (tx) => {
      const physicalCount = await tx.tb_physical_count.create({
        data: {
          physical_count_period_id: data.physical_count_period_id,
          location_id: data.location_id,
          location_code: location.code,
          location_name: location.name,
          description: data.description || null,
          status: enum_physical_count_status.in_progress,
          start_counting_at: new Date().toISOString(),
          start_counting_by_id: user_id,
          product_total: stockByProduct.length,
          product_counted: 0,
          created_by_id: user_id,
        },
      });

      // Create details for each product (on_hand_qty = 0, will be computed at review)
      if (stockByProduct.length > 0) {
        const detailsData = stockByProduct.map((item) => ({
          physical_count_id: physicalCount.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_local_name: item.product_local_name,
          product_code: item.product_code,
          product_sku: item.product_sku,
          inventory_unit_id: item.inventory_unit_id,
          on_hand_qty: 0,
          actual_qty: null,
          diff_qty: 0,
          created_by_id: user_id,
        }));

        await tx.tb_physical_count_detail.createMany({
          data: detailsData,
        });
      }

      return physicalCount;
    });

    return Result.ok({ id: result.id });
  }

  /**
   * Refresh product list for a physical count
   * รีเฟรชรายการสินค้าในการตรวจนับสินค้า โดยดึงสินค้าใหม่จาก location แล้วเพิ่มเข้าไป
   * @param id - Physical count ID / ID การตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Refreshed physical count with details / การตรวจนับสินค้าที่รีเฟรชแล้วพร้อมรายละเอียด
   */
  @TryCatch
  async refresh(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'refresh', id, user_id, tenant_id },
      PhysicalCountService.name,
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

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Physical Count is already completed',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    // Get products assigned to this location via tb_product_location
    const productLocations = await prisma.tb_product_location.findMany({
      where: { location_id: physicalCount.location_id, deleted_at: null },
      select: { product_id: true },
    });
    const assignedProductIds = productLocations.map((pl) => pl.product_id);

    // Also get products that have stock at this location
    const stockGrouped = await prisma.tb_inventory_transaction_detail.groupBy({
      by: ['product_id'],
      where: { location_id: physicalCount.location_id },
      _sum: { qty: true },
    });
    const productIdsWithStock = stockGrouped
      .filter((g) => g._sum.qty && !g._sum.qty.equals(0))
      .map((g) => g.product_id);

    // Union both sets of product IDs
    const allProductIds = [...new Set([...assignedProductIds, ...productIdsWithStock])];

    // Get product details
    const products = allProductIds.length > 0
      ? await prisma.tb_product.findMany({
        where: { id: { in: allProductIds }, deleted_at: null },
        select: { id: true, name: true, local_name: true, code: true, sku: true, inventory_unit_id: true },
        orderBy: [{ code: 'asc' }, { name: 'asc' }],
      })
      : [];

    const stockByProduct = products.map((p) => ({
      product_id: p.id,
      product_name: p.name,
      product_local_name: p.local_name,
      product_code: p.code,
      product_sku: p.code,
      inventory_unit_id: p.inventory_unit_id,
    }));

    // Find existing details and add new products
    const existingDetails = await prisma.tb_physical_count_detail.findMany({
      where: { physical_count_id: id, deleted_at: null },
      select: { product_id: true },
    });
    const existingProductIds = new Set(existingDetails.map((d) => d.product_id));

    const newProducts = stockByProduct.filter((p) => !existingProductIds.has(p.product_id));

    if (newProducts.length > 0) {
      await prisma.tb_physical_count_detail.createMany({
        data: newProducts.map((item) => ({
          physical_count_id: id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_local_name: item.product_local_name,
          product_code: item.product_code,
          product_sku: item.product_sku,
          inventory_unit_id: item.inventory_unit_id,
          on_hand_qty: 0,
          actual_qty: null,
          diff_qty: 0,
          created_by_id: user_id,
        })),
      });

      await prisma.tb_physical_count.update({
        where: { id },
        data: {
          product_total: existingProductIds.size + newProducts.length,
          updated_by_id: user_id,
        },
      });
    }

    return this.getPhysicalCountWithDetails(prisma, id);
  }

  /**
   * Save physical count detail quantities
   * บันทึกจำนวนรายการรายละเอียดการตรวจนับสินค้า
   * @param data - Physical count save data with detail items / ข้อมูลบันทึกการตรวจนับพร้อมรายการรายละเอียด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Saved physical count / การตรวจนับสินค้าที่บันทึกแล้ว
   */
  @TryCatch
  async save(
    data: IPhysicalCountSave,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'save', data, user_id, tenant_id },
      PhysicalCountService.name,
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

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Physical Count is already completed',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const detail of data.details) {
        const existingDetail = await tx.tb_physical_count_detail.findFirst({
          where: { id: detail.id, physical_count_id: data.id, deleted_at: null },
        });

        if (!existingDetail) {
          continue;
        }

        const countedQty = Number(detail.actual_qty);
        const onHandQty = existingDetail.on_hand_qty != null ? Number(existingDetail.on_hand_qty) : 0;
        const diffQty = countedQty - onHandQty;

        await tx.tb_physical_count_detail.update({
          where: { id: detail.id },
          data: {
            actual_qty: countedQty,
            diff_qty: diffQty,
            counted_at: new Date().toISOString(),
            counted_by_id: user_id,
            updated_by_id: user_id,
            updated_at: new Date().toISOString(),
          },
        });
      }

      const allDetails = await tx.tb_physical_count_detail.findMany({
        where: { physical_count_id: data.id, deleted_at: null },
      });

      const totalCounted = allDetails.filter(
        (d) => d.actual_qty && !d.actual_qty.equals(0),
      ).length;

      await tx.tb_physical_count.update({
        where: { id: data.id },
        data: {
          product_counted: totalCounted,
          updated_by_id: user_id,
          updated_at: new Date().toISOString(),
        },
      });
    });

    return this.findOne(data.id, user_id, tenant_id);
  }

  /**
   * Review physical count items with actual quantities
   * ตรวจสอบรายการตรวจนับสินค้าพร้อมจำนวนจริง
   * @param id - Physical count ID / ID การตรวจนับ
   * @param data - Review items with actual quantities / รายการตรวจสอบพร้อมจำนวนจริง
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated physical count / การตรวจนับสินค้าที่อัปเดตแล้ว
   */
  @TryCatch
  async reviewItems(
    id: string,
    data: { items: Array<{ id: string; actual_qty: number }> },
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'reviewItems', id, data, user_id, tenant_id },
      PhysicalCountService.name,
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

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Physical Count is already completed',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const details = await prisma.tb_physical_count_detail.findMany({
      where: { physical_count_id: id, deleted_at: null },
    });

    // Build a map of actual_qty from items
    const actualQtyMap = new Map(
      (data.items || []).map((item) => [item.id, new Prisma.Decimal(item.actual_qty)]),
    );

    // Compute on_hand_qty from inventory_transaction_detail
    const onHandGrouped = await prisma.tb_inventory_transaction_detail.groupBy({
      by: ['product_id'],
      where: { location_id: physicalCount.location_id },
      _sum: { qty: true },
    });

    const onHandMap = new Map(
      onHandGrouped.map((item) => [item.product_id, item._sum.qty || new Prisma.Decimal(0)]),
    );

    // Pre-compute per-detail values outside the transaction to keep it short
    const updatedAt = new Date().toISOString();
    const detailUpdates = details.map((detail) => {
      const onHandQty = onHandMap.get(detail.product_id) || new Prisma.Decimal(0);
      const countedQty =
        actualQtyMap.get(detail.id) || detail.actual_qty || new Prisma.Decimal(0);
      const diffQty = countedQty.minus(onHandQty);
      return { id: detail.id, onHandQty, countedQty, diffQty };
    });

    const totalCounted = details.filter(
      (d) => actualQtyMap.has(d.id) || (d.actual_qty && !d.actual_qty.equals(0)),
    ).length;

    // Update each detail with actual_qty, computed on_hand_qty, and diff_qty
    await prisma.$transaction(
      async (tx) => {
        await Promise.all(
          detailUpdates.map((u) =>
            tx.tb_physical_count_detail.update({
              where: { id: u.id },
              data: {
                actual_qty: u.countedQty,
                on_hand_qty: u.onHandQty,
                diff_qty: u.diffQty,
                updated_by_id: user_id,
                updated_at: updatedAt,
              },
            }),
          ),
        );

        await tx.tb_physical_count.update({
          where: { id },
          data: {
            product_counted: totalCounted,
            updated_by_id: user_id,
            updated_at: updatedAt,
          },
        });
      },
      { timeout: 30000, maxWait: 10000 },
    );

    return Result.ok({ id });
  }

  /**
   * Submit a physical count for approval
   * ส่งการตรวจนับสินค้าเพื่อขออนุมัติ
   * @param data - Physical count submit data / ข้อมูลส่งการตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Submitted physical count / การตรวจนับสินค้าที่ส่งแล้ว
   */
  @TryCatch
  async submit(
    data: IPhysicalCountSubmit,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'submit', data, user_id, tenant_id },
      PhysicalCountService.name,
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

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Physical Count is already completed',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const period = await prisma.tb_physical_count_period.findFirst({
      where: { id: physicalCount.physical_count_period_id, deleted_at: null },
      include: {
        tb_period: { select: { start_at: true, end_at: true } },
      },
    });

    const details = await prisma.tb_physical_count_detail.findMany({
      where: { physical_count_id: data.id, deleted_at: null },
    });

    const uncountedDetails = details.filter(
      (d) => d.actual_qty === null || d.actual_qty.equals(0),
    );

    if (uncountedDetails.length > 0) {
      return Result.error(
        `${uncountedDetails.length} products have not been counted yet`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const detailsWithVariance = details.filter(
      (d) => d.diff_qty && !d.diff_qty.equals(0),
    );

    // Resolve costing method from BU config (default 'last_receiving')
    const rawMethod = await this.tenantService.getBuConfig<unknown>(
      tenant.tenant_id,
      enum_business_unit_config_key.physical_count_costing_method,
      'last_receiving',
    );
    let method: CostingMethod = 'last_receiving';
    if (isCostingMethod(rawMethod)) {
      method = rawMethod;
    } else {
      this.logger.warn(
        {
          function: 'submit',
          message: 'Invalid physical_count_costing_method in BU config; falling back to last_receiving',
          bu_id: tenant.tenant_id,
          received: rawMethod,
        },
        PhysicalCountService.name,
      );
    }

    // Batch fetch costs before transaction (read-only)
    const costMap = await this.costingService.getCostsPerUnit({
      prisma,
      method,
      items: detailsWithVariance.map((d) => ({
        product_id: d.product_id,
        location_id: physicalCount.location_id,
      })),
    });

    const periodNote = period?.tb_period
      ? `Physical Count Adjustment - Period: ${format(period.tb_period.start_at, 'yyyy-MM-dd')} to ${format(period.tb_period.end_at, 'yyyy-MM-dd')}`
      : 'Physical Count Adjustment';

    await prisma.$transaction(async (tx) => {
      const positiveVariance = detailsWithVariance.filter(
        (d) => d.diff_qty.greaterThan(0),
      );
      const negativeVariance = detailsWithVariance.filter(
        (d) => d.diff_qty.lessThan(0),
      );

      if (positiveVariance.length > 0) {
        const siNo = await this.generateSINo(
          new Date().toISOString(),
          tenant_id,
          user_id,
        );

        const stockIn = await tx.tb_stock_in.create({
          data: {
            si_no: siNo,
            description: periodNote,
            doc_status: enum_doc_status.completed,
            doc_version: 0,
            location_id: physicalCount.location_id,
            location_code: physicalCount.location_code,
            location_name: physicalCount.location_name,
            created_by_id: user_id,
          },
        });

        let sequenceNo = 1;
        const stockInDetails = positiveVariance.map((d) => {
          const cost =
            costMap.get(costMapKey(d.product_id, physicalCount.location_id)) ??
            new Prisma.Decimal(0);
          const qty = d.diff_qty;
          return {
            stock_in_id: stockIn.id,
            sequence_no: sequenceNo++,
            product_id: d.product_id,
            product_name: d.product_name,
            qty,
            cost_per_unit: cost,
            total_cost: cost.mul(qty),
            note: `Physical Count Adjustment - Variance: +${d.diff_qty} @ ${cost} (${method})`,
            created_by_id: user_id,
          };
        });

        await tx.tb_stock_in_detail.createMany({ data: stockInDetails });
      }

      if (negativeVariance.length > 0) {
        const soNo = await this.generateSONo(
          new Date().toISOString(),
          tenant_id,
          user_id,
        );

        const stockOut = await tx.tb_stock_out.create({
          data: {
            so_no: soNo,
            description: periodNote,
            doc_status: enum_doc_status.completed,
            doc_version: 0,
            location_id: physicalCount.location_id,
            location_code: physicalCount.location_code,
            location_name: physicalCount.location_name,
            created_by_id: user_id,
          },
        });

        let sequenceNo = 1;
        const stockOutDetails = negativeVariance.map((d) => {
          const cost =
            costMap.get(costMapKey(d.product_id, physicalCount.location_id)) ??
            new Prisma.Decimal(0);
          const qty = d.diff_qty.abs();
          return {
            stock_out_id: stockOut.id,
            sequence_no: sequenceNo++,
            product_id: d.product_id,
            product_name: d.product_name,
            qty,
            cost_per_unit: cost,
            total_cost: cost.mul(qty),
            note: `Physical Count Adjustment - Variance: ${d.diff_qty} @ ${cost} (${method})`,
            created_by_id: user_id,
          };
        });

        await tx.tb_stock_out_detail.createMany({ data: stockOutDetails });
      }

      await tx.tb_physical_count.update({
        where: { id: data.id },
        data: {
          status: enum_physical_count_status.completed,
          completed_at: new Date().toISOString(),
          completed_by_id: user_id,
          updated_by_id: user_id,
          updated_at: new Date().toISOString(),
        },
      });
    });

    return this.findOne(data.id, user_id, tenant_id);
  }

  /**
   * Soft delete a physical count
   * ลบการตรวจนับสินค้าแบบซอฟต์ดีลีท
   * @param id - Physical count ID / ID การตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted physical count ID / ID การตรวจนับที่ลบแล้ว
   */
  @TryCatch
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id },
      PhysicalCountService.name,
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

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Cannot delete completed Physical Count',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.tb_physical_count_detail.updateMany({
        where: { physical_count_id: id },
        data: {
          deleted_at: new Date().toISOString(),
          deleted_by_id: user_id,
        },
      });

      await tx.tb_physical_count.update({
        where: { id },
        data: {
          deleted_at: new Date().toISOString(),
          deleted_by_id: user_id,
        },
      });
    });

    return Result.ok({ id });
  }

  // ==================== Detail Comment CRUD ====================

  /**
   * Find comments for a physical count detail
   * ค้นหาความคิดเห็นสำหรับรายการรายละเอียดการตรวจนับ
   * @param physical_count_detail_id - Physical count detail ID / ID รายการรายละเอียดการตรวจนับ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns List of comments / รายการความคิดเห็น
   */
  @TryCatch
  async findDetailComments(
    physical_count_detail_id: string,
    user_id: string,
    tenant_id: string,
    paginate?: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailComments', physical_count_detail_id, user_id, tenant_id, paginate },
      PhysicalCountService.name,
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

    const page = paginate?.page && paginate.page > 0 ? paginate.page : 1;
    const perpage = paginate?.perpage && paginate.perpage > 0 ? paginate.perpage : 10;
    const where = { physical_count_detail_id, deleted_at: null };

    const comments = await prisma.tb_physical_count_detail_comment.findMany({
      where,
      orderBy: { created_at: 'asc' },
      skip: (page - 1) * perpage,
      take: perpage,
    });

    const total = await prisma.tb_physical_count_detail_comment.count({ where });

    return Result.ok({
      data: comments,
      paginate: {
        total,
        page,
        perpage,
        pages: total === 0 ? 1 : Math.ceil(total / perpage),
      },
    });
  }

  /**
   * Find a physical count detail comment by ID
   * ค้นหาความคิดเห็นในรายการรายละเอียดการตรวจนับด้วย ID
   */
  @TryCatch
  async findDetailCommentById(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailCommentById', id, user_id, tenant_id },
      PhysicalCountService.name,
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

    const comment = await prisma.tb_physical_count_detail_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!comment) {
      return Result.error('Comment not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(comment);
  }

  @TryCatch
  /**
   * Create a comment on a physical count detail
   * สร้างความคิดเห็นในรายการรายละเอียดการตรวจนับ
   * @param data - Comment creation data / ข้อมูลสร้างความคิดเห็น
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created comment / ความคิดเห็นที่สร้างแล้ว
   */
  async createDetailComment(
    data: IPhysicalCountDetailCommentCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'createDetailComment', data, user_id, tenant_id },
      PhysicalCountService.name,
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

    const detail = await prisma.tb_physical_count_detail.findFirst({
      where: { id: data.physical_count_detail_id, deleted_at: null },
    });

    if (!detail) {
      return Result.error('Physical Count Detail not found', ErrorCode.NOT_FOUND);
    }

    const comment = await prisma.tb_physical_count_detail_comment.create({
      data: {
        physical_count_detail_id: data.physical_count_detail_id,
        type: data.type ?? 'user',
        user_id: user_id,
        message: data.message ?? null,
        attachments: (data.attachments ?? []) as unknown as Prisma.InputJsonValue,
        created_by_id: user_id,
      },
    });

    return Result.ok(comment);
  }

  /**
   * Update a physical count detail comment
   * แก้ไขความคิดเห็นในรายการรายละเอียดการตรวจนับ
   * @param data - Comment update data / ข้อมูลแก้ไขความคิดเห็น
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated comment / ความคิดเห็นที่แก้ไขแล้ว
   */
  @TryCatch
  async updateDetailComment(
    data: IPhysicalCountDetailCommentUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'updateDetailComment', data, user_id, tenant_id },
      PhysicalCountService.name,
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

    const existingComment = await prisma.tb_physical_count_detail_comment.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!existingComment) {
      return Result.error('Comment not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...updateData } = data;

    const comment = await prisma.tb_physical_count_detail_comment.update({
      where: { id: data.id },
      data: {
        ...updateData,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok(comment);
  }

  /**
   * Soft delete a physical count detail comment
   * ลบความคิดเห็นในรายการรายละเอียดการตรวจนับแบบซอฟต์ดีลีท
   * @param id - Comment ID / ID ความคิดเห็น
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted comment ID / ID ความคิดเห็นที่ลบแล้ว
   */
  @TryCatch
  async deleteDetailComment(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'deleteDetailComment', id, user_id, tenant_id },
      PhysicalCountService.name,
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

    const existingComment = await prisma.tb_physical_count_detail_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingComment) {
      return Result.error('Comment not found', ErrorCode.NOT_FOUND);
    }

    await prisma.tb_physical_count_detail_comment.update({
      where: { id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok({ id });
  }

  /**
   * Add an attachment entry to a comment's attachments JSON array
   * เพิ่มไฟล์แนบเข้าใน array ของความคิดเห็น
   */
  @TryCatch
  async addAttachmentToDetailComment(
    id: string,
    attachment: IPhysicalCountDetailCommentAttachment,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'addAttachmentToDetailComment', id, attachment, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existing = await prisma.tb_physical_count_detail_comment.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      return Result.error('Comment not found', ErrorCode.NOT_FOUND);
    }

    const current = Array.isArray(existing.attachments)
      ? (existing.attachments as unknown as IPhysicalCountDetailCommentAttachment[])
      : [];

    if (current.some((a) => a.fileToken === attachment.fileToken)) {
      return Result.error('Attachment with this fileToken already exists', ErrorCode.ALREADY_EXISTS);
    }

    const next = [...current, attachment];

    const updated = await prisma.tb_physical_count_detail_comment.update({
      where: { id },
      data: {
        attachments: next as unknown as Prisma.InputJsonValue,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok(updated);
  }

  /**
   * Remove an attachment from a comment's attachments JSON array by fileToken
   * ลบไฟล์แนบจาก array ของความคิดเห็นด้วย fileToken
   */
  @TryCatch
  async removeAttachmentFromDetailComment(
    id: string,
    fileToken: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'removeAttachmentFromDetailComment', id, fileToken, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existing = await prisma.tb_physical_count_detail_comment.findFirst({
      where: { id, deleted_at: null },
    });
    if (!existing) {
      return Result.error('Comment not found', ErrorCode.NOT_FOUND);
    }

    const current = Array.isArray(existing.attachments)
      ? (existing.attachments as unknown as IPhysicalCountDetailCommentAttachment[])
      : [];

    const next = current.filter((a) => a.fileToken !== fileToken);
    if (next.length === current.length) {
      return Result.error('Attachment not found', ErrorCode.NOT_FOUND);
    }

    const updated = await prisma.tb_physical_count_detail_comment.update({
      where: { id },
      data: {
        attachments: next as unknown as Prisma.InputJsonValue,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok(updated);
  }

  // ==================== Private Helper Methods ====================

  private async generateSINo(
    siDate: string,
    bu_code: string,
    user_id: string,
  ): Promise<string> {
     
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
      { type: 'SI', user_id, bu_code },
    );
    const response = await firstValueFrom(res);

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Failed to get running code pattern for SI (physical-count): ${JSON.stringify(response)}`);
    }

    const patterns = response.data;

    let datePattern: Record<string, unknown> | undefined;
    let runningPattern: Record<string, unknown> | undefined;
    patterns.forEach((pattern: Record<string, unknown>) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for SI (physical-count): datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    const getDate = new Date(siDate);

     
    const generateCodeRes: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'SI',
        issueDate: getDate,
        last_no: 0,
        user_id,
        bu_code: bu_code,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);

    if (!generateCodeResponse?.data?.code) {
      throw new Error(`Failed to generate SI number (physical-count): ${JSON.stringify(generateCodeResponse)}`);
    }

    return generateCodeResponse.data.code;
  }

  private async generateSONo(
    soDate: string,
    bu_code: string,
    user_id: string,
  ): Promise<string> {
     
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
      { type: 'SO', user_id, bu_code },
    );
    const response = await firstValueFrom(res);

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Failed to get running code pattern for SO (physical-count): ${JSON.stringify(response)}`);
    }

    const patterns = response.data;

    let datePattern: Record<string, unknown> | undefined;
    let runningPattern: Record<string, unknown> | undefined;
    patterns.forEach((pattern: Record<string, unknown>) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for SO (physical-count): datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    const getDate = new Date(soDate);

     
    const generateCodeRes: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'SO',
        issueDate: getDate,
        last_no: 0,
        user_id,
        bu_code: bu_code,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);

    if (!generateCodeResponse?.data?.code) {
      throw new Error(`Failed to generate SO number (physical-count): ${JSON.stringify(generateCodeResponse)}`);
    }

    return generateCodeResponse.data.code;
  }

  /**
   * Print a physical count via FastReport viewer (micro-report)
   * พิมพ์ใบนับสินค้าผ่าน FastReport viewer (micro-report)
   */
  @TryCatch
  async printToReport(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }
    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const pc = await prisma.tb_physical_count.findFirst({
      where: { id },
      include: {
        tb_physical_count_detail: { orderBy: { sequence_no: 'asc' } },
      },
    });
    if (!pc) {
      return Result.error('Physical count not found', ErrorCode.NOT_FOUND);
    }

    return renderViaMicroReport({
      prismaSystem: this.prismaSystem,
      bu_code: tenant_id,
      documentType: 'PC',
      datasetPrefix: 'PC',
      buildHeader: () => ({
        LocationName: pc.location_name || '',
        LocationCode: pc.location_code || '',
        PhysicalCountType: pc.physical_count_type || '',
        Description: pc.description || '',
        PcStatus: pc.status || '',
        StartCountingAt: formatReportDate(pc.start_counting_at),
        CompletedAt: formatReportDate(pc.completed_at),
      }),
      buildDetail: () =>
        pc.tb_physical_count_detail.map((d: any, i: number) => ({
          No: String(i + 1),
          ProductName: d.product_name || '',
          ProductCode: d.product_code || '',
          ProductSku: d.product_sku || '',
        })),
    });
  }
}
