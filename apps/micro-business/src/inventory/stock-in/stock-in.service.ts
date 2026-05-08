import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT, enum_doc_status } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/libs/paginate.query';
import { IStockInCreate, IStockInUpdate, IStockInDetailCreate, IStockInDetailUpdate } from './interface/stock-in.interface';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Injectable, Inject } from '@nestjs/common';
import { format } from 'date-fns';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  StockInDetailResponseSchema,
  StockInListItemResponseSchema,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';
import { InventoryTransactionService } from '@/inventory/inventory-transaction/inventory-transaction.service';
import { StockInLogic } from './stock-in.logic';

@Injectable()
export class StockInService {
  private readonly logger: BackendLogger = new BackendLogger(StockInService.name);

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
    private readonly inventoryTransactionService: InventoryTransactionService,
    private readonly stockInLogic: StockInLogic,
  ) { }

  /**
   * Find a stock in by ID
   * ค้นหาใบรับสินค้าเข้ารายการเดียวตาม ID
   * @param id - Stock in ID / ID ใบรับสินค้าเข้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Stock in detail with items / รายละเอียดใบรับสินค้าเข้าพร้อมรายการ
   */
  @TryCatch
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id, deleted_at: null },
      include: {
        tb_location: { select: { location_type: true } },
      },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    const stockInDetail = await prisma.tb_stock_in_detail.findMany({
      where: { stock_in_id: id, deleted_at: null },
      orderBy: { sequence_no: 'asc' },
    });

    const responseData = {
      ...stockIn,
      location_type: stockIn.tb_location?.location_type ?? null,
      stock_in_detail: stockInDetail,
    };

    const serializedData = StockInDetailResponseSchema.parse(responseData);
    return Result.ok(serializedData);
  }

  /**
   * Find all stock ins with pagination
   * ค้นหาใบรับสินค้าเข้าทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of stock ins / รายการใบรับสินค้าเข้าแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', user_id, tenant_id, paginate }, StockInService.name);

    const defaultSearchFields = ['si_no', 'description'];

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
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockInList = await prisma.tb_stock_in.findMany({
      ...q.findMany(),
      where: {
        ...q.where(),
        deleted_at: null,
      },
      select: {
        id: true,
        si_date: true,
        si_no: true,
        description: true,
        doc_status: true,
        adjustment_type_id: true,
        adjustment_type_code: true,
        adjustment_type: {
          select: { name: true },
        },
        location_id: true,
        location_code: true,
        location_name: true,
        tb_location: {
          select: { location_type: true },
        },
        // workflow_name: true,
        // workflow_current_stage: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        deleted_at: true,
        deleted_by_id: true,
        _count: {
          select: { tb_stock_in_detail: { where: { deleted_at: null } } },
        },
        tb_stock_in_detail: {
          where: { deleted_at: null, inventory_transaction_id: { not: null } },
          select: {
            tb_inventory_transaction: {
              select: {
                tb_inventory_transaction_detail: {
                  select: { total_cost: true },
                },
              },
            },
          },
        },
      },
    });

    const total = await prisma.tb_stock_in.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    const serializedStockInList = stockInList.map((item) => {
      const baseTotalCost = item.tb_stock_in_detail.reduce((sum, d) => {
        const txDetails = d.tb_inventory_transaction?.tb_inventory_transaction_detail ?? [];
        return sum + txDetails.reduce((s, td) => s + Number(td.total_cost ?? 0), 0);
      }, 0);
      return StockInListItemResponseSchema.parse({
        ...item,
        adjustment_type_name: item.adjustment_type?.name ?? null,
        location_type: item.tb_location?.location_type ?? null,
        item_count: item._count.tb_stock_in_detail,
        base_total_cost: baseTotalCost,
      });
    });

    return Result.ok({
      data: serializedStockInList,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Create a new stock in and immediately adjust inventory.
   * สร้างใบรับสินค้าเข้าใหม่และปรับปรุงสินค้าคงคลังทันที
   * All operations (doc creation + inventory adjustment) run in a single transaction
   * to prevent race conditions.
   * @param data - Stock in creation data / ข้อมูลสร้างใบรับสินค้าเข้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created stock in ID and number / ID และเลขที่ใบรับสินค้าเข้าที่สร้างแล้ว
   */
  @TryCatch
  async create(data: IStockInCreate, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'create', data, user_id, tenant_id }, StockInService.name);

    if (!data.stock_in_detail?.add || data.stock_in_detail.add.length === 0) {
      return Result.error('Stock in detail items are required', ErrorCode.INVALID_ARGUMENT);
    }

    if (!data.location_id) {
      return Result.error('Location is required for stock in', ErrorCode.INVALID_ARGUMENT);
    }

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Validate and enrich header fields
    const headerError = await this.stockInLogic.validateAndEnrichHeader(prisma, data);
    if (headerError) return Result.error(headerError, ErrorCode.NOT_FOUND);

    // Validate and enrich detail items
    const detailError = await this.stockInLogic.validateAndEnrichDetailItems(prisma, data.stock_in_detail.add);
    if (detailError) return Result.error(detailError, ErrorCode.NOT_FOUND);

    // Get calculation method before transaction
    const method = await this.inventoryTransactionService.getCalculationMethod(tenant_id);

    // Single atomic transaction: create doc + details + inventory adjustments
    const result = await prisma.$transaction(async (tx) => {
      const stockInObject = { ...data };
      delete stockInObject.stock_in_detail;

      const createStockIn = await tx.tb_stock_in.create({
        data: {
          ...stockInObject,
          created_by_id: user_id,
          si_no: await this.generateSINo(new Date().toISOString(), tenant_id, user_id),
          doc_version: 0,
          doc_status: enum_doc_status.completed,
        },
      });

      let sequenceNo = 1;
      const detailItems = data.stock_in_detail!.add!;

      // Process each detail line sequentially to avoid race conditions on cost layers
      for (const item of detailItems) {
        const detail = await tx.tb_stock_in_detail.create({
          data: {
            stock_in_id: createStockIn.id,
            created_by_id: user_id,
            sequence_no: sequenceNo++,
            product_id: item.product_id || '',
            product_code: item.product_code || null,
            product_name: item.product_name || null,
            product_local_name: item.product_local_name || null,
            product_sku: item.product_sku || null,
            description: item.description || null,
            qty: item.qty || 0,
            cost_per_unit: item.cost_per_unit || 0,
            total_cost: item.total_cost || 0,
            note: item.note || null,
            info: item.info || null,
            dimension: item.dimension || null,
          },
        });

        // Execute inventory adjustment in the same transaction
        const inventoryTransactionId = await this.inventoryTransactionService.executeAdjustmentIn(
          tx,
          {
            product_id: item.product_id || '',
            location_id: data.location_id!,
            location_code: data.location_code || null,
            qty: Number(item.qty) || 0,
            cost_per_unit: Number(item.cost_per_unit) || 0,
            user_id,
          },
          method,
        );

        // Link inventory transaction back to detail
        await tx.tb_stock_in_detail.update({
          where: { id: detail.id },
          data: { inventory_transaction_id: inventoryTransactionId },
        });
      }

      return { id: createStockIn.id, si_no: createStockIn.si_no };
    });

    return Result.ok(result);
  }

  /**
   * Update a stock in
   * แก้ไขใบรับสินค้าเข้า
   * @param data - Stock in update data / ข้อมูลแก้ไขใบรับสินค้าเข้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated stock in / ใบรับสินค้าเข้าที่แก้ไขแล้ว
   */
  @TryCatch
  async update(data: IStockInUpdate, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'update', data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    if (stockIn.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot update a completed Stock In — inventory has already been adjusted', ErrorCode.INVALID_ARGUMENT);
    }

    // Validate and enrich header fields
    const headerError = await this.stockInLogic.validateAndEnrichHeader(prisma, data);
    if (headerError) return Result.error(headerError, ErrorCode.NOT_FOUND);

    // Validate and enrich detail items
    if (data.stock_in_detail) {
      if (data.stock_in_detail.add) {
        const addError = await this.stockInLogic.validateAndEnrichDetailItems(prisma, data.stock_in_detail.add);
        if (addError) return Result.error(addError, ErrorCode.NOT_FOUND);
      }

      if (data.stock_in_detail.update) {
        const detailNotFound: string[] = [];
        await Promise.all(
          data.stock_in_detail.update.map(async (item) => {
            const detail = await prisma.tb_stock_in_detail.findFirst({
              where: { id: item.id, deleted_at: null },
            });
            if (!detail) {
              detailNotFound.push(item.id);
            }
          }),
        );
        if (detailNotFound.length > 0) {
          return Result.error(`Stock In Detail not found: ${detailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        const updateError = await this.stockInLogic.validateAndEnrichDetailItems(prisma, data.stock_in_detail.update);
        if (updateError) return Result.error(updateError, ErrorCode.NOT_FOUND);
      }

      if (data.stock_in_detail.remove) {
        const detailNotFound: string[] = [];

        await Promise.all(
          data.stock_in_detail.remove.map(async (item) => {
            const detail = await prisma.tb_stock_in_detail.findFirst({
              where: { id: item.id, deleted_at: null },
            });
            if (!detail) {
              detailNotFound.push(item.id);
            }
          }),
        );

        if (detailNotFound.length > 0) {
          return Result.error(`Stock In Detail not found: ${detailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }
    }

    const tx = await prisma.$transaction(async (prisma) => {
      const { stock_in_detail: _, id: __, ...stockInUpdateData } = data;

      if (Object.keys(stockInUpdateData).length > 0) {
        const updatePayload: Record<string, unknown> = {
          ...stockInUpdateData,
          updated_by_id: user_id,
          updated_at: new Date().toISOString(),
        };
        // Cast doc_status to enum if present
        if (stockInUpdateData.doc_status) {
          updatePayload.doc_status = stockInUpdateData.doc_status as enum_doc_status;
        }
        await prisma.tb_stock_in.update({
          where: { id: data.id },
          data: updatePayload,
        });
      }

      if (data.stock_in_detail) {
        if (data.stock_in_detail.add && data.stock_in_detail.add.length > 0) {
          const maxSequence = await prisma.tb_stock_in_detail.aggregate({
            where: { stock_in_id: data.id, deleted_at: null },
            _max: { sequence_no: true },
          });
          let sequenceNo = (maxSequence._max.sequence_no || 0) + 1;

          const detailCreateObj = data.stock_in_detail.add.map((item) => ({
            stock_in_id: data.id,
            created_by_id: user_id,
            sequence_no: sequenceNo++,
            product_id: item.product_id || '',
            product_code: item.product_code || null,
            product_name: item.product_name || null,
            product_local_name: item.product_local_name || null,
            product_sku: item.product_sku || null,
            description: item.description || null,
            qty: item.qty || 0,
            cost_per_unit: item.cost_per_unit || 0,
            total_cost: item.total_cost || 0,
            note: item.note || null,
            info: item.info || null,
            dimension: item.dimension || null,
          }));

          await prisma.tb_stock_in_detail.createMany({
            data: detailCreateObj,
          });
        }

        if (data.stock_in_detail.update && data.stock_in_detail.update.length > 0) {
          await Promise.all(
            data.stock_in_detail.update.map(async (item) => {
              const { id, ...updateData } = item;
              await prisma.tb_stock_in_detail.update({
                where: { id },
                data: {
                  ...updateData,
                  updated_by_id: user_id,
                  updated_at: new Date().toISOString(),
                },
              });
            }),
          );
        }

        if (data.stock_in_detail.remove && data.stock_in_detail.remove.length > 0) {
          const detailIds = data.stock_in_detail.remove.map((item) => item.id);
          await prisma.tb_stock_in_detail.updateMany({
            where: { id: { in: detailIds } },
            data: {
              deleted_at: new Date(),
              deleted_by_id: user_id,
            },
          });
        }
      }

      return { id: data.id };
    });

    return Result.ok(tx);
  }

  /**
   * Soft delete a stock in and its details
   * ลบใบรับสินค้าเข้าและรายการรายละเอียดแบบซอฟต์ดีลีท
   * @param id - Stock in ID / ID ใบรับสินค้าเข้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted stock in / ใบรับสินค้าเข้าที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    if (stockIn.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot delete a completed Stock In — inventory has already been adjusted', ErrorCode.INVALID_ARGUMENT);
    }

    await prisma.$transaction(async (prisma) => {
      // Soft delete details
      await prisma.tb_stock_in_detail.updateMany({
        where: { stock_in_id: id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });

      // Soft delete comments
      await prisma.tb_stock_in_comment.updateMany({
        where: { stock_in_id: id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });

      // Soft delete stock in
      await prisma.tb_stock_in.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });
    });

    return Result.ok({ id });
  }

  /**
   * Find the latest stock in by document number pattern
   * ค้นหาใบรับสินค้าเข้าล่าสุดตามรูปแบบเลขที่เอกสาร
   * @param pattern - Document number pattern / รูปแบบเลขที่เอกสาร
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Latest stock in matching the pattern / ใบรับสินค้าเข้าล่าสุดที่ตรงกับรูปแบบ
   */
  async findLatestSIByPattern(pattern: string, tenant_id: string, user_id: string): Promise<any> {
    this.logger.debug({ function: 'findLatestSIByPattern', pattern, tenant_id, user_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: {
        si_no: { contains: pattern },
      },
      orderBy: { created_at: 'desc' },
    });

    return stockIn;
  }

  /**
   * Generate stock in document number
   * สร้างเลขที่เอกสารใบรับสินค้าเข้า
   * @param siDate - Stock in date / วันที่รับสินค้าเข้า
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Generated document number / เลขที่เอกสารที่สร้างขึ้น
   */
  private async generateSINo(siDate: string, tenant_id: string, user_id: string): Promise<string> {
    this.logger.debug({ function: 'generateSINo', siDate, tenant_id, user_id }, StockInService.name);

     
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
      { type: 'SI', user_id, bu_code: tenant_id },
    );
    const response = await firstValueFrom(res);

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Failed to get running code pattern for SI: ${JSON.stringify(response)}`);
    }

    const patterns = response.data;

    let datePattern;
    let runningPattern;
    patterns.forEach((pattern) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for SI: datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    const getDate = new Date(siDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    const latestSI = await this.findLatestSIByPattern(datePatternValue, tenant_id, user_id);
    const latestSINumber = latestSI
      ? Number(latestSI.si_no.slice(-Number(runningPattern.pattern)))
      : 0;

     
    const generateCodeRes: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'SI',
        issueDate: getDate,
        last_no: latestSINumber,
        user_id,
        bu_code: tenant_id,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);

    if (!generateCodeResponse?.data?.code) {
      throw new Error(`Failed to generate SI number: ${JSON.stringify(generateCodeResponse)}`);
    }

    return generateCodeResponse.data.code;
  }

  // ==================== Stock In Detail CRUD ====================

  /**
   * Find a stock in detail by ID
   * ค้นหารายการรายละเอียดใบรับสินค้าเข้าตาม ID
   * @param detailId - Stock in detail ID / ID รายการรายละเอียดใบรับสินค้าเข้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Stock in detail / รายการรายละเอียดใบรับสินค้าเข้า
   */
  @TryCatch
  async findDetailById(detailId: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findDetailById', detailId, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const detail = await prisma.tb_stock_in_detail.findFirst({
      where: { id: detailId, deleted_at: null },
      include: {
        tb_stock_in: {
          select: { id: true, si_no: true, doc_status: true },
        },
        tb_product: {
          select: { id: true, name: true, local_name: true },
        },
      },
    });

    if (!detail) {
      return Result.error('Stock In Detail not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(detail);
  }

  /**
   * Find all details by stock in ID
   * ค้นหารายการรายละเอียดทั้งหมดตาม ID ใบรับสินค้าเข้า
   * @param stockInId - Stock in ID / ID ใบรับสินค้าเข้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns List of stock in details / รายการรายละเอียดใบรับสินค้าเข้า
   */
  @TryCatch
  async findDetailsByStockInId(stockInId: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findDetailsByStockInId', stockInId, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: stockInId, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    const details = await prisma.tb_stock_in_detail.findMany({
      where: { stock_in_id: stockInId, deleted_at: null },
      include: {
        tb_product: {
          select: { id: true, name: true, local_name: true },
        },
      },
      orderBy: { sequence_no: 'asc' },
    });

    return Result.ok(details);
  }

  /**
   * Create a stock in detail line
   * สร้างรายการรายละเอียดใบรับสินค้าเข้า
   * @param stockInId - Stock in ID / ID ใบรับสินค้าเข้า
   * @param data - Detail creation data / ข้อมูลสร้างรายการรายละเอียด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created detail / รายการรายละเอียดที่สร้างแล้ว
   */
  @TryCatch
  async createDetail(
    stockInId: string,
    data: IStockInDetailCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'createDetail', stockInId, data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: stockInId, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    if (stockIn.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot add detail to non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    // Validate product
    if (data.product_id) {
      const product = await prisma.tb_product.findFirst({
        where: { id: data.product_id },
      });
      if (!product) {
        return Result.error('Product not found', ErrorCode.NOT_FOUND);
      }
      data.product_name = product.name;
      data.product_code = product.code;
      data.product_sku = product.code;
      data.product_local_name = product.local_name;
    }


    const maxSequence = await prisma.tb_stock_in_detail.aggregate({
      where: { stock_in_id: stockInId, deleted_at: null },
      _max: { sequence_no: true },
    });
    const nextSequence = (maxSequence._max.sequence_no || 0) + 1;

    const detail = await prisma.tb_stock_in_detail.create({
      data: {
        stock_in_id: stockInId,
        sequence_no: nextSequence,
        created_by_id: user_id,
        product_id: data.product_id || '',
        product_name: data.product_name || null,
        product_local_name: data.product_local_name || null,
        description: data.description || null,
        qty: data.qty || 0,
        cost_per_unit: data.cost_per_unit || 0,
        total_cost: data.total_cost || 0,
        note: data.note || null,
        info: data.info || null,
        dimension: data.dimension || null,
      },
    });

    return Result.ok(detail);
  }

  /**
   * Update a stock in detail line
   * แก้ไขรายการรายละเอียดใบรับสินค้าเข้า
   * @param detailId - Stock in detail ID / ID รายการรายละเอียดใบรับสินค้าเข้า
   * @param data - Detail update data / ข้อมูลแก้ไขรายการรายละเอียด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated detail / รายการรายละเอียดที่แก้ไขแล้ว
   */
  @TryCatch
  async updateDetail(
    detailId: string,
    data: IStockInDetailUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'updateDetail', detailId, data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingDetail = await prisma.tb_stock_in_detail.findFirst({
      where: { id: detailId, deleted_at: null },
      include: { tb_stock_in: true },
    });

    if (!existingDetail) {
      return Result.error('Stock In Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_stock_in?.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot update detail of non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    const { id, ...updateData } = data;

    const updatedDetail = await prisma.tb_stock_in_detail.update({
      where: { id: detailId },
      data: {
        ...updateData,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok(updatedDetail);
  }

  /**
   * Soft delete a stock in detail line
   * ลบรายการรายละเอียดใบรับสินค้าเข้าแบบซอฟต์ดีลีท
   * @param detailId - Stock in detail ID / ID รายการรายละเอียดใบรับสินค้าเข้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted detail / รายการรายละเอียดที่ลบแล้ว
   */
  @TryCatch
  async deleteDetail(detailId: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'deleteDetail', detailId, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingDetail = await prisma.tb_stock_in_detail.findFirst({
      where: { id: detailId, deleted_at: null },
      include: { tb_stock_in: true },
    });

    if (!existingDetail) {
      return Result.error('Stock In Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_stock_in?.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot delete detail of non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    await prisma.tb_stock_in_detail.update({
      where: { id: detailId },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok({ id: detailId });
  }

  // ==================== Standalone Stock In Detail API ====================

  /**
   * Find all stock in details with pagination (standalone API)
   * ค้นหารายการรายละเอียดใบรับสินค้าเข้าทั้งหมดพร้อมการแบ่งหน้า (API แบบอิสระ)
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of stock in details / รายการรายละเอียดใบรับสินค้าเข้าแบบแบ่งหน้า
   */
  @TryCatch
  async findAllDetails(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAllDetails', user_id, tenant_id, paginate }, StockInService.name);

    const defaultSearchFields = ['product_name', 'product_local_name', 'description'];

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
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const detailList = await prisma.tb_stock_in_detail.findMany({
      ...q.findMany(),
      where: {
        ...q.where(),
        deleted_at: null,
      },
      select: {
        id: true,
        stock_in_id: true,
        sequence_no: true,
        product_id: true,
        product_name: true,
        product_local_name: true,
        description: true,
        qty: true,
        cost_per_unit: true,
        total_cost: true,
        note: true,
        info: true,
        dimension: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        deleted_at: true,
        deleted_by_id: true,
        tb_stock_in: {
          select: {
            id: true,
            si_no: true,
            doc_status: true,
          },
        },
      },
    });

    const total = await prisma.tb_stock_in_detail.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    return Result.ok({
      data: detailList,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Create a standalone stock in detail (requires stock_in_id in data)
   * สร้างรายการรายละเอียดใบรับสินค้าเข้าแบบอิสระ (ต้องระบุ stock_in_id ในข้อมูล)
   * @param data - Detail creation data with stock_in_id / ข้อมูลสร้างรายการรายละเอียดพร้อม stock_in_id
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created detail / รายการรายละเอียดที่สร้างแล้ว
   */
  @TryCatch
  async createStandaloneDetail(
    data: IStockInDetailCreate & { stock_in_id: string },
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug({ function: 'createStandaloneDetail', data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Validate stock_in exists
    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: data.stock_in_id, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    if (stockIn.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot add detail to non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    // Validate product
    if (data.product_id) {
      const product = await prisma.tb_product.findFirst({
        where: { id: data.product_id },
      });
      if (!product) {
        return Result.error('Product not found', ErrorCode.NOT_FOUND);
      }
      data.product_name = product.name;
      data.product_code = product.code;
      data.product_sku = product.code;
      data.product_local_name = product.local_name;
    }


    const maxSequence = await prisma.tb_stock_in_detail.aggregate({
      where: { stock_in_id: data.stock_in_id, deleted_at: null },
      _max: { sequence_no: true },
    });
    const nextSequence = (maxSequence._max.sequence_no || 0) + 1;

    const detail = await prisma.tb_stock_in_detail.create({
      data: {
        stock_in_id: data.stock_in_id,
        sequence_no: nextSequence,
        created_by_id: user_id,
        product_id: data.product_id || '',
        product_name: data.product_name || null,
        product_local_name: data.product_local_name || null,
        description: data.description || null,
        qty: data.qty || 0,
        cost_per_unit: data.cost_per_unit || 0,
        total_cost: data.total_cost || 0,
        note: data.note || null,
        info: data.info || null,
        dimension: data.dimension || null,
      },
    });

    return Result.ok(detail);
  }

  /**
   * Void a stock in — reverse inventory by creating adjustment_out, then mark as voided
   * ยกเลิกใบรับสินค้าเข้า — กลับรายการ inventory โดยสร้าง adjustment_out แล้วเปลี่ยนสถานะเป็น voided
   */
  @TryCatch
  async voidStockIn(id: string, voidReason: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'voidStockIn', id, voidReason, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id, deleted_at: null },
      include: {
        tb_stock_in_detail: {
          where: { deleted_at: null },
          select: {
            id: true,
            product_id: true,
            product_code: true,
            qty: true,
            cost_per_unit: true,
          },
        },
      },
    });

    if (!stockIn) {
      return Result.error('Stock in not found', ErrorCode.NOT_FOUND);
    }

    if (stockIn.doc_status === enum_doc_status.voided) {
      return Result.error('Stock in is already voided', ErrorCode.INVALID_ARGUMENT);
    }

    // Check that each product+location has enough on-hand to reverse
    for (const detail of stockIn.tb_stock_in_detail) {
      const layers = await prisma.tb_inventory_transaction_cost_layer.findMany({
        where: {
          product_id: detail.product_id,
          location_id: stockIn.location_id,
          deleted_at: null,
        },
        select: { in_qty: true, out_qty: true },
      });

      const onHand = layers.reduce(
        (sum: number, l: any) => sum + (Number(l.in_qty) - Number(l.out_qty)),
        0,
      );

      const qtyToReverse = Number(detail.qty) || 0;
      if (onHand < qtyToReverse) {
        return Result.error(
          `Cannot void: product ${detail.product_code || detail.product_id} has insufficient on-hand qty (${onHand}) at this location to reverse ${qtyToReverse}`,
          ErrorCode.INVALID_ARGUMENT,
        );
      }
    }

    const method = await this.inventoryTransactionService.getCalculationMethod(tenant_id);

    await prisma.$transaction(async (tx: any) => {
      // Create reverse adjustment_out for each detail
      for (const detail of stockIn.tb_stock_in_detail) {
        await this.inventoryTransactionService.executeAdjustmentOut(
          tx,
          {
            product_id: detail.product_id,
            location_id: stockIn.location_id!,
            location_code: stockIn.location_code || null,
            qty: Number(detail.qty) || 0,
            user_id,
          },
          method,
        );
      }

      // Mark stock in as voided
      const nowIso = new Date().toISOString();
      await tx.tb_stock_in.update({
        where: { id },
        data: {
          doc_status: enum_doc_status.voided,
          deleted_at: nowIso,
          deleted_by_id: user_id,
          info: { ...(stockIn.info as any || {}), void_reason: voidReason },
          updated_by_id: user_id,
          updated_at: nowIso,
        },
      });
    });

    return Result.ok({ id });
  }
}
