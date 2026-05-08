import { BadRequestException, HttpStatus, Injectable, HttpException, Inject } from "@nestjs/common";
import { TenantService } from "@/tenant/tenant.service";
import { Prisma, PrismaClient } from "@repo/prisma-shared-schema-tenant";
import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";
import { ICreateLocation, IUpdateLocation } from "./interface/location.interface";
import { IPaginate } from "@/common/shared-interface/paginate.interface";
import QueryParams from "@/common/libs/paginate.query";
import { enum_location_type, enum_physical_count_type } from "@repo/prisma-shared-schema-tenant";
import { BackendLogger } from "@/common/helpers/backend.logger";
import {
  IProductInventoryInfo,
  TryCatch,
  Result,
  ErrorCode,
  createLocationCreateValidation,
  createLocationUpdateValidation,
  LocationDetailResponseSchema,
  LocationListItemResponseSchema,
  LocationByUserResponseSchema,
} from "@/common";
import { isUUID } from "class-validator";
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from "@/common/constant";
import order from "@/common/helpers/order_by";
import getPaginationParams from "@/common/helpers/pagination.params";

@Injectable()
export class LocationsService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(ERROR_MISSING_BU_CODE, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(ERROR_MISSING_USER_ID, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;

  private readonly logger: BackendLogger = new BackendLogger(LocationsService.name);

  /**
   * Initialize the Prisma service for the tenant
   * เริ่มต้นบริการ Prisma สำหรับผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / รหัสผู้ใช้
   */
  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException("Prisma service is not initialized", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this._prismaService;
  }

  constructor(
    @Inject("PRISMA_SYSTEM")
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Find a single location by ID with optional users and products
   * ค้นหาสถานที่รายการเดียวตาม ID พร้อมผู้ใช้และสินค้า (ถ้าระบุ)
   * @param id - Location ID / รหัสสถานที่
   * @param withUsers - Include assigned users / รวมผู้ใช้ที่มอบหมาย
   * @param withProducts - Include assigned products / รวมสินค้าที่มอบหมาย
   * @param version - API version / เวอร์ชัน API
   * @returns Location detail / รายละเอียดสถานที่
   */
  @TryCatch
  async findOne(
    id: string,
    withUsers: boolean = false,
    withProducts: boolean = false,
    version: string = "latest",
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: "findOne",
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
        withUsers,
        withProducts,
        version,
      },
      LocationsService.name,
    );
    const specialQuery = {};

    if (withUsers) {
      Object.assign(specialQuery, {
        tb_user_location: {
          select: {
            user_id: true,
          },
        },
      });
    }

    if (withProducts) {
      Object.assign(specialQuery, {
        tb_product_location: {
          select: {
            product_id: true,
            min_qty: true,
            max_qty: true,
            re_order_qty: true,
            par_qty: true,
          },
        },
      });
    }

    const location = await this.prismaService.tb_location
      .findFirst({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
          location_type: true,
          physical_count_type: true,
          description: true,
          is_active: true,
          info: true,
          ...specialQuery,
          tb_delivery_point: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
        },
      })
      .then(async (res) => {
        if (!res) return null;
        let user_location: any[] = [];
        let product_location: any[] = [];

        if (withUsers && (res as any)?.tb_user_location) {
          const userIds = (res as any).tb_user_location.map((u: any) => u.user_id);
          if (userIds.length > 0) {
            const userProfiles = await this.prismaSystem.tb_user_profile.findMany({
              where: { user_id: { in: userIds } },
              select: { user_id: true, firstname: true, lastname: true, middlename: true, telephone: true },
            });
            const profileMap = new Map(userProfiles.map((p) => [p.user_id, p]));
            user_location = userIds.map((uid: string) => {
              const profile = profileMap.get(uid);
              return {
                id: uid,
                firstname: profile?.firstname ?? null,
                lastname: profile?.lastname ?? null,
                middlename: profile?.middlename ?? null,
                telephone: profile?.telephone ?? null,
              };
            });
          }
        }

        if (withProducts && (res as any)?.tb_product_location) {
          const plItems = (res as any).tb_product_location;
          const productIds = plItems.map((p: any) => p.product_id);
          if (productIds.length > 0) {
            const products = await this.prismaService.tb_product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, name: true, code: true },
            });
            const productMap = new Map(products.map((p) => [p.id, p]));
            product_location = plItems.map((pl: any) => {
              const info = productMap.get(pl.product_id);
              return {
                id: pl.product_id,
                name: info?.name ?? null,
                code: info?.code ?? null,
                min_qty: pl.min_qty != null ? Number(pl.min_qty) : null,
                max_qty: pl.max_qty != null ? Number(pl.max_qty) : null,
                re_order_qty: pl.re_order_qty != null ? Number(pl.re_order_qty) : null,
                par_qty: pl.par_qty != null ? Number(pl.par_qty) : null,
              };
            });
          }
        }

        return {
          id: res.id,
          code: res.code,
          name: res.name,
          location_type: res.location_type,
          physical_count_type: res.physical_count_type,
          description: res.description,
          is_active: res.is_active,
          info: res.info,
          user_location,
          product_location,
          delivery_point: res.tb_delivery_point
            ? {
                id: res.tb_delivery_point.id,
                name: res.tb_delivery_point.name,
                is_active: res.tb_delivery_point.is_active,
              }
            : null,
        };
      });

    if (!location) {
      return Result.error("Location not found", ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedLocation = LocationDetailResponseSchema.parse(location);

    return Result.ok(serializedLocation);
  }

  /**
   * Find multiple locations by their IDs
   * ค้นหาสถานที่หลายรายการตามรหัส ID
   * @param ids - Array of location IDs / อาร์เรย์ของรหัสสถานที่
   * @param version - API version / เวอร์ชัน API
   * @returns List of locations / รายการสถานที่
   */
  @TryCatch
  async findManyById(ids: string[], version: string = "latest"): Promise<any> {
    this.logger.debug(
      { function: "findManyById", ids, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );
    const locations = await this.prismaService.tb_location.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        code: true,
        location_type: true,
        physical_count_type: true,
        description: true,
        is_active: true,
        info: true,
      },
    });

    // Serialize response data
    const serializedLocations = locations.map((location) => LocationListItemResponseSchema.parse(location));

    return Result.ok(serializedLocations);
  }

  /**
   * Find all locations with pagination
   * ค้นหาสถานที่ทั้งหมดแบบแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of locations / รายการสถานที่แบบแบ่งหน้า
   */
  @TryCatch
  async findAll(bu_code: string, paginate: IPaginate, version: string = "latest"): Promise<any> {
    this.logger.debug({ function: "findAll", user_id: this.userId, bu_code, paginate, version }, LocationsService.name);
    const defaultSearchFields = ["name", "code"];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === "object" && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );
    const pagination = getPaginationParams(q.page, q.perpage);
    const customOrderBy = q.orderBy();
    const hasCustomSort = Array.isArray(customOrderBy)
      ? customOrderBy.length > 0
      : Object.keys(customOrderBy).length > 0;

    const prismaParams = {
      where: q.where(),
      include: {
        tb_delivery_point: true,
      },
      orderBy: hasCustomSort ? customOrderBy : [{ code: "asc" as const }, { name: "asc" as const }],
      ...pagination,
    };
    const data = await this.prismaService.tb_location.findMany(prismaParams);

    const locations = data.map((item) => {
      return {
        id: item.id,
        code: item.code,
        name: item.name,
        location_type: item.location_type,
        physical_count_type: item.physical_count_type,
        description: item.description ?? null,
        is_active: item.is_active,
        info: item.info ?? null,
        delivery_point: item.tb_delivery_point
          ? {
              id: item.tb_delivery_point.id,
              name: item.tb_delivery_point.name,
              is_active: item.tb_delivery_point.is_active,
            }
          : {},
        created_at: item.created_at,
        created_by_id: item.created_by_id,
        updated_at: item.updated_at,
        updated_by_id: item.updated_by_id,
        deleted_at: item.deleted_at,
        deleted_by_id: item.deleted_by_id,
      };
    });

    const total = await this.prismaService.tb_location.count({ where: q.where() });

    // Serialize response data
    const serializedLocations = locations.map((location) => LocationListItemResponseSchema.parse(location));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedLocations,
    });
  }

  /**
   * Find all active locations assigned to the current user
   * ค้นหาสถานที่ที่ใช้งานอยู่ทั้งหมดที่มอบหมายให้ผู้ใช้ปัจจุบัน
   * @param version - API version / เวอร์ชัน API
   * @returns List of locations assigned to user / รายการสถานที่ที่มอบหมายให้ผู้ใช้
   */
  @TryCatch
  async findAllByUser(version: string = "latest"): Promise<any> {
    this.logger.debug(
      { function: "findAllByUser", user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    const locations = await this.prismaService.tb_location.findMany({
      where: {
        is_active: true,
        tb_user_location: {
          some: {
            user_id: this.userId,
          },
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        location_type: true,
        physical_count_type: true,
        description: true,
        is_active: true,
        tb_delivery_point: {
          select: {
            id: true,
            name: true,
            is_active: true,
          },
        },
      },
    });

    const transformed = locations.map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
      location_type: location.location_type,
      physical_count_type: location.physical_count_type,
      description: location.description,
      is_active: location.is_active,
      delivery_point: location.tb_delivery_point
        ? {
            id: location.tb_delivery_point.id,
            name: location.tb_delivery_point.name,
            is_active: location.tb_delivery_point.is_active,
          }
        : null,
    }));

    // Serialize response data
    const serializedLocations = transformed.map((location) => LocationByUserResponseSchema.parse(location));

    return Result.ok(serializedLocations);
  }

  /**
   * Find all active locations assigned to a specific product
   * ค้นหาสถานที่ที่ใช้งานอยู่ทั้งหมดที่มอบหมายให้สินค้าที่ระบุ
   * @param product_id - Product ID / รหัสสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns List of locations assigned to product / รายการสถานที่ที่มอบหมายให้สินค้า
   */
  @TryCatch
  async findAllByProductId(product_id: string, paginate: IPaginate, version: string = "latest"): Promise<any> {
    this.logger.debug(
      { function: "findAllByProductId", product_id, user_id: this.userId, tenant_id: this.bu_code, paginate, version },
      LocationsService.name,
    );

    const defaultSearchFields = ["name", "code"];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === "object" && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const where = {
      ...q.where(),
      is_active: true,
      tb_product_location: {
        some: {
          product_id: product_id,
        },
      },
    };

    const locations = await this.prismaService.tb_location.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        location_type: true,
        physical_count_type: true,
        description: true,
        is_active: true,
        tb_delivery_point: {
          select: {
            id: true,
            name: true,
            is_active: true,
          },
        },
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_location.count({ where });

    const transformed = locations.map((location) => ({
      id: location.id,
      code: location.code,
      name: location.name,
      location_type: location.location_type,
      physical_count_type: location.physical_count_type,
      description: location.description,
      is_active: location.is_active,
      delivery_point: location.tb_delivery_point
        ? {
            id: location.tb_delivery_point.id,
            name: location.tb_delivery_point.name,
            is_active: location.tb_delivery_point.is_active,
          }
        : null,
    }));

    const serializedLocations = transformed.map((location) => LocationByUserResponseSchema.parse(location));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedLocations,
    });
  }

  /**
   * Get product inventory information for a specific location and product
   * ดึงข้อมูลสินค้าคงคลังสำหรับสถานที่และสินค้าที่ระบุ
   * @param location_id - Location ID / รหัสสถานที่
   * @param product_id - Product ID / รหัสสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Product inventory info (on-hand, on-order, reorder, restock) / ข้อมูลสินค้าคงคลัง
   */
  @TryCatch
  async getLocationsByUserId(targetUserId: string): Promise<any> {
    this.logger.debug(
      { function: "getLocationsByUserId", targetUserId, user_id: this.userId, tenant_id: this.bu_code },
      LocationsService.name,
    );

    const userLocations = await this.prismaService.tb_user_location.findMany({
      where: { user_id: targetUserId, deleted_at: null },
      select: {
        id: true,
        location_id: true,
        tb_location: {
          select: { id: true, code: true, name: true, location_type: true, is_active: true },
        },
      },
    });

    const data = userLocations.map((ul) => ({
      id: ul.id,
      location_id: ul.location_id,
      location_code: ul.tb_location?.code ?? null,
      location_name: ul.tb_location?.name ?? null,
      location_type: ul.tb_location?.location_type ?? null,
      is_active: ul.tb_location?.is_active ?? null,
    }));

    return Result.ok(data);
  }

  @TryCatch
  async updateUserLocations(targetUserId: string, locationIds: string[]): Promise<any> {
    this.logger.debug(
      { function: "updateUserLocations", targetUserId, locationIds, user_id: this.userId, tenant_id: this.bu_code },
      LocationsService.name,
    );

    // Validate that all location_ids exist
    if (locationIds.length > 0) {
      const validLocations = await this.prismaService.tb_location.findMany({
        where: { id: { in: locationIds }, deleted_at: null },
        select: { id: true },
      });
      const validIds = new Set(validLocations.map((l) => l.id));
      const invalidIds = locationIds.filter((id) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new BadRequestException(`Location IDs not found: ${invalidIds.join(", ")}`);
      }
    }

    // Get current assignments
    const existing = await this.prismaService.tb_user_location.findMany({
      where: { user_id: targetUserId, deleted_at: null },
      select: { id: true, location_id: true },
    });

    const existingLocationIds = new Set(existing.map((e) => e.location_id));
    const newLocationIds = new Set(locationIds);

    // Hard-delete ones not in the new list
    const toDelete = existing.filter((e) => !newLocationIds.has(e.location_id));
    if (toDelete.length > 0) {
      await this.prismaService.tb_user_location.deleteMany({
        where: { id: { in: toDelete.map((e) => e.id) } },
      });
    }

    // Create ones that don't already exist
    const toCreate = locationIds.filter((id) => !existingLocationIds.has(id));
    if (toCreate.length > 0) {
      await this.prismaService.tb_user_location.createMany({
        data: toCreate.map((location_id) => ({
          user_id: targetUserId,
          location_id,
          created_by_id: this.userId,
        })),
      });
    }

    // Return updated list
    return this.getLocationsByUserId(targetUserId);
  }

  @TryCatch
  async getProductInventory(location_id: string, product_id: string, version: string = "latest"): Promise<any> {
    this.logger.debug(
      {
        function: "getProductInventory",
        location_id,
        product_id,
        user_id: this.userId,
        tenant_id: this.bu_code,
        version,
      },
      LocationsService.name,
    );

    let re_order_qty = 0;
    let re_stock_qty = 0;

    // Get product-location settings
    const productLocation = await this.prismaService.tb_product_location.findFirst({
      where: { location_id, product_id },
      select: { re_order_qty: true, par_qty: true },
    });

    if (productLocation) {
      re_order_qty = Number(productLocation.re_order_qty);
      re_stock_qty = Number(productLocation.par_qty);
    }

    // Calculate on-hand from cost layers
    const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
      where: { product_id, location_id, deleted_at: null },
      select: {
        id: true,
        lot_no: true,
        lot_index: true,
        lot_at_date: true,
        transaction_type: true,
        in_qty: true,
        out_qty: true,
        cost_per_unit: true,
        total_cost: true,
        average_cost_per_unit: true,
      },
    });

    let on_hand_qty = 0;
    for (const layer of layers) {
      on_hand_qty += Number(layer.in_qty) - Number(layer.out_qty);
    }

    // Calculate on-order from active PO details (sent/partial)
    const poDetails = await this.prismaService.tb_purchase_order_detail.findMany({
      where: {
        product_id,
        deleted_at: null,
        tb_purchase_order: {
          po_status: { in: ["sent", "partial"] },
          deleted_at: null,
        },
      },
      select: {
        order_qty: true,
        received_qty: true,
        cancelled_qty: true,
        order_unit_name: true,
        price: true,
        tb_purchase_order: {
          select: {
            id: true,
            po_no: true,
            po_status: true,
            vendor_name: true,
            delivery_date: true,
          },
        },
      },
    });

    const on_order = poDetails.map((detail) => {
      const orderQty = Number(detail.order_qty) || 0;
      const receivedQty = Number(detail.received_qty) || 0;
      const cancelledQty = Number(detail.cancelled_qty) || 0;
      return {
        po_id: detail.tb_purchase_order?.id,
        po_no: detail.tb_purchase_order?.po_no,
        po_status: detail.tb_purchase_order?.po_status,
        vendor_name: detail.tb_purchase_order?.vendor_name,
        delivery_date: detail.tb_purchase_order?.delivery_date,
        order_qty: orderQty,
        received_qty: receivedQty,
        cancelled_qty: cancelledQty,
        pending_qty: orderQty - receivedQty - cancelledQty,
        unit_name: detail.order_unit_name,
        price: Number(detail.price) || 0,
      };
    });

    const on_order_qty = on_order.reduce((sum, o) => sum + o.pending_qty, 0);

    // Fetch inventory transactions for this product at this location
    const transactionDetails = await this.prismaService.tb_inventory_transaction_detail.findMany({
      where: { product_id, location_id },
      select: {
        id: true,
        inventory_transaction_id: true,
        location_id: true,
        location_code: true,
        product_id: true,
        qty: true,
        cost_per_unit: true,
        total_cost: true,
        current_lot_no: true,
        created_at: true,
        tb_inventory_transaction: {
          select: {
            inventory_doc_type: true,
            inventory_doc_no: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const transactions = transactionDetails.map((td: any) => ({
      id: td.id,
      inventory_transaction_id: td.inventory_transaction_id,
      doc_type: td.tb_inventory_transaction?.inventory_doc_type || null,
      doc_id: td.tb_inventory_transaction?.inventory_doc_no || null,
      location_id: td.location_id,
      location_code: td.location_code,
      qty: Number(td.qty),
      cost_per_unit: Number(td.cost_per_unit),
      total_cost: Number(td.total_cost),
      lot_no: td.current_lot_no,
      created_at: td.created_at || td.tb_inventory_transaction?.created_at,
    }));

    const cost_layers = layers.map((layer) => ({
      id: layer.id,
      lot_no: layer.lot_no,
      lot_index: layer.lot_index,
      lot_at_date: layer.lot_at_date,
      transaction_type: layer.transaction_type,
      in_qty: Number(layer.in_qty ?? 0),
      out_qty: Number(layer.out_qty ?? 0),
      balance_qty: Number(layer.in_qty ?? 0) - Number(layer.out_qty ?? 0),
      cost_per_unit: Number(layer.cost_per_unit ?? 0),
      total_cost: Number(layer.total_cost ?? 0),
      average_cost_per_unit: Number(layer.average_cost_per_unit ?? 0),
    }));

    const productInventory = {
      on_hand_qty,
      on_order_qty,
      re_order_qty,
      re_stock_qty,
      cost_layers,
      on_order,
      transactions,
    };

    return Result.ok(productInventory);
  }

  /**
   * Create a new location with optional user and product assignments
   * สร้างสถานที่ใหม่พร้อมมอบหมายผู้ใช้และสินค้า (ถ้ามี)
   * @param data - Location creation data / ข้อมูลสำหรับสร้างสถานที่
   * @param version - API version / เวอร์ชัน API
   * @returns Created location ID / รหัสสถานที่ที่สร้างแล้ว
   */
  @TryCatch
  async create(data: ICreateLocation, version: string = "latest"): Promise<any> {
    this.logger.debug(
      { function: "create", data, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    // Validate using factory function
    const validationSchema = createLocationCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Trim whitespace from name
    if (typeof data.name === 'string') data.name = data.name.trim();

    // Business validation: Check for duplicate location
    const foundLocation = await this.prismaService.tb_location.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        // location_type: data.location_type,
        deleted_at: null,
      },
    });

    if (foundLocation) {
      return Result.error("Location already exists", ErrorCode.ALREADY_EXISTS);
    }

    const location_type = data.location_type as unknown as enum_location_type;

    let count_type = data.physical_count_type as unknown as enum_physical_count_type;
    if (location_type === enum_location_type.direct) {
      count_type = enum_physical_count_type.no as unknown as enum_physical_count_type;
    }

    const createLocation = await this.prismaService.$transaction(async (tx) => {
      const createLocation = await tx.tb_location.create({
        data: {
          code: data.code,
          name: data.name,
          location_type: location_type,
          physical_count_type: count_type,
          description: data.description ?? null,
          is_active: data.is_active,
          // info: (data.info as object) ?? {},
          delivery_point_id: data.delivery_point_id ?? null,
          created_by_id: this.userId,
        },
      });

      if (data.users?.add) {
        await tx.tb_user_location.createMany({
          data: data.users.add.map((user) => ({
            user_id: user.id,
            location_id: createLocation.id,
            created_by_id: this.userId,
            created_at: new Date().toISOString(),
          })),
        });
      }

      if (data.products?.add) {
        await tx.tb_product_location.createMany({
          data: data.products.add.map((product) => ({
            product_id: product.id,
            location_id: createLocation.id,
            min_qty: product.min_qty ?? 0,
            max_qty: product.max_qty ?? 0,
            re_order_qty: product.re_order_qty ?? 0,
            par_qty: product.par_qty ?? 0,
            created_by_id: this.userId,
            created_at: new Date().toISOString(),
          })),
        });
      }

      return createLocation;
    });

    return Result.ok({ id: createLocation.id });
  }

  /**
   * Update an existing location with user and product add/remove/update operations
   * อัปเดตสถานที่ที่มีอยู่พร้อมเพิ่ม/ลบ/อัปเดตผู้ใช้และสินค้า
   * @param data - Location update data / ข้อมูลสำหรับอัปเดตสถานที่
   * @param version - API version / เวอร์ชัน API
   * @returns Updated location ID / รหัสสถานที่ที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: IUpdateLocation, version: string = "latest"): Promise<any> {
    this.logger.debug(
      { function: "update", data, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    // Validate using factory function
    const validationSchema = createLocationUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Check if location exists
    const location = await this.prismaService.tb_location.findFirst({
      where: { id: data.id },
    });

    if (!location) {
      return Result.error("Location not found", ErrorCode.NOT_FOUND);
    }

    // Trim whitespace from name
    if (typeof data.name === 'string') data.name = data.name.trim();

    // Business validation: Check for duplicate name
    if (data.name) {
      const foundLocation = await this.prismaService.tb_location.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          // location_type: data.location_type ?? location.location_type,
          deleted_at: null,
          id: {
            not: location.id,
          },
        },
      });

      if (foundLocation) {
        return Result.error("Location already exists", ErrorCode.ALREADY_EXISTS);
      }
    }

    const location_type = data.location_type ?? (location.location_type as unknown as enum_location_type);
    let count_type = data.physical_count_type ?? (location.physical_count_type as unknown as enum_physical_count_type);

    if (location_type === enum_location_type.direct) {
      count_type = enum_physical_count_type.no as unknown as enum_physical_count_type;
    }

    const updateLocation = await this.prismaService.$transaction(
      async (tx) => {
        const updateLocation = await tx.tb_location.update({
          where: { id: location.id },
          data: {
            code: data.code ?? location.code,
            name: data.name ?? location.name,
            location_type: location_type,
            physical_count_type: count_type,
            description: data.description ?? location.description,
            is_active: data.is_active ?? location.is_active,
            // info: (data.info as object) ?? location.info,
            delivery_point_id: data.delivery_point_id ?? location.delivery_point_id,
            updated_by_id: this.userId,
          },
        });

        if (data.users?.add) {
          await tx.tb_user_location.createMany({
            data: data.users.add.map((user) => ({
              user_id: user.id,
              location_id: updateLocation.id,
              created_by_id: this.userId,
              created_at: new Date().toISOString(),
            })),
          });
        }

        if (data.users?.remove) {
          await tx.tb_user_location.deleteMany({
            where: {
              user_id: { in: data.users.remove.map((user) => user.id) },
              location_id: updateLocation.id,
            },
          });
        }

        if (data.products?.add) {
          await tx.tb_product_location.createMany({
            data: data.products.add.map((product) => ({
              product_id: product.id,
              location_id: updateLocation.id,
              min_qty: product.min_qty ?? 0,
              max_qty: product.max_qty ?? 0,
              re_order_qty: product.re_order_qty ?? 0,
              par_qty: product.par_qty ?? 0,
              created_by_id: this.userId,
              created_at: new Date().toISOString(),
            })),
          });
        }

        if (data.products?.update) {
          for (const product of data.products.update) {
            await tx.tb_product_location.updateMany({
              where: {
                product_id: product.id,
                location_id: updateLocation.id,
              },
              data: {
                min_qty: product.min_qty,
                max_qty: product.max_qty,
                re_order_qty: product.re_order_qty,
                par_qty: product.par_qty,
                updated_by_id: this.userId,
              },
            });
          }
        }

        if (data.products?.remove) {
          await tx.tb_product_location.deleteMany({
            where: {
              product_id: {
                in: data.products.remove.map((product) => product.id),
              },
              location_id: updateLocation.id,
            },
          });
        }

        return updateLocation;
      },
      { timeout: 30000 },
    );

    return Result.ok({ id: updateLocation.id });
  }

  /**
   * Soft delete a location
   * ลบสถานที่แบบ soft delete
   * @param id - Location ID / รหัสสถานที่
   * @param version - API version / เวอร์ชัน API
   * @returns Deleted location ID / รหัสสถานที่ที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string, version: string = "latest") {
    this.logger.debug(
      { function: "delete", id, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    const location = await this.prismaService.tb_location.findFirst({
      where: { id },
    });

    if (!location) {
      return Result.error("Location not found", ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_location.update({
      where: { id: location.id },
      data: {
        is_active: false,
        updated_by_id: this.userId,
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: location.id });
  }
}
