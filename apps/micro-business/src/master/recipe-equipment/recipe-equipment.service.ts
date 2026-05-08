import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { ICreateRecipeEquipment, IUpdateRecipeEquipment } from './interface/recipe-equipment.interface';
import { TenantService } from '@/tenant/tenant.service';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_USER_ID } from '@/common/constant';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class RecipeEquipmentService {
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
    RecipeEquipmentService.name,
  );

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
      throw new HttpException(
        'Prisma service is not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Find a single recipe equipment by ID with category info
   * ค้นหาอุปกรณ์สูตรอาหารรายการเดียวตาม ID พร้อมข้อมูลหมวดหมู่
   * @param id - Recipe equipment ID / รหัสอุปกรณ์สูตรอาหาร
   * @returns Recipe equipment detail / รายละเอียดอุปกรณ์สูตรอาหาร
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentService.name,
    );

    const equipment = await this.prismaService.tb_recipe_equipment.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
      include: {
        tb_recipe_equipment_category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!equipment) {
      return Result.error('Recipe equipment not found', ErrorCode.NOT_FOUND);
    }

    const { tb_recipe_equipment_category, average_usage_time, ...rest } = equipment;
    return Result.ok({
      ...rest,
      average_usage_time: average_usage_time ? Number(average_usage_time) : 0,
      category: tb_recipe_equipment_category ?? null,
    });
  }

  /**
   * Find all recipe equipment with pagination
   * ค้นหาอุปกรณ์สูตรอาหารทั้งหมดแบบแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipe equipment / รายการอุปกรณ์สูตรอาหารแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, paginate, tenant_id: this.bu_code },
      RecipeEquipmentService.name,
    );

    const defaultSearchFields = ['name', 'code'];

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
    const data = await this.prismaService.tb_recipe_equipment.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const enrichedData = data.map((item) => ({
      ...item,
      average_usage_time: item.average_usage_time ? Number(item.average_usage_time) : 0,
    }));

    const total = await this.prismaService.tb_recipe_equipment.count({
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
      data: enrichedData,
    });
  }

  /**
   * Create a new recipe equipment with category validation
   * สร้างอุปกรณ์สูตรอาหารใหม่พร้อมตรวจสอบหมวดหมู่
   * @param data - Recipe equipment creation data / ข้อมูลสำหรับสร้างอุปกรณ์สูตรอาหาร
   * @returns Created recipe equipment ID / รหัสอุปกรณ์สูตรอาหารที่สร้างแล้ว
   */
  @TryCatch
  async create(data: ICreateRecipeEquipment): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentService.name,
    );

    const found = await this.prismaService.tb_recipe_equipment.findFirst({
      where: {
        code: data.code,
        deleted_at: null,
      },
    });

    if (found) {
      return Result.error('Recipe equipment already exists', ErrorCode.ALREADY_EXISTS);
    }

    // Mapper: validate category and fetch name
    let category_name: string | null = null;
    if (data.category_id) {
      const category = await this.prismaService.tb_recipe_equipment_category.findFirst({
        where: { id: data.category_id, deleted_at: null },
        select: { id: true, name: true },
      });
      if (!category) {
        return Result.error('Equipment category not found', ErrorCode.NOT_FOUND);
      }
      category_name = category.name;
    }

    const created = await this.prismaService.tb_recipe_equipment.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        category_id: data.category_id ?? null,
        category_name: category_name,
        brand: data.brand,
        model: data.model,
        serial_no: data.serial_no,
        capacity: data.capacity,
        power_rating: data.power_rating,
        station: data.station,
        operation_instructions: data.operation_instructions,
        safety_notes: data.safety_notes,
        cleaning_instructions: data.cleaning_instructions,
        maintenance_schedule: data.maintenance_schedule,
        last_maintenance_date: data.last_maintenance_date ? new Date(data.last_maintenance_date).toISOString() : null,
        next_maintenance_date: data.next_maintenance_date ? new Date(data.next_maintenance_date).toISOString() : null,
        note: data.note,
        is_active: data.is_active ?? true,
        is_portable: data.is_portable ?? false,
        available_qty: data.available_qty ?? 0,
        total_qty: data.total_qty ?? 0,
        usage_count: data.usage_count ?? 0,
        average_usage_time: data.average_usage_time ?? 0,
        attachments: data.attachments ?? [],
        manuals_urls: data.manuals_urls ?? [],
        info: data.info ?? {},
        dimension: data.dimension ?? [],
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: created.id });
  }

  /**
   * Update an existing recipe equipment with category validation
   * อัปเดตอุปกรณ์สูตรอาหารที่มีอยู่พร้อมตรวจสอบหมวดหมู่
   * @param data - Recipe equipment update data / ข้อมูลสำหรับอัปเดตอุปกรณ์สูตรอาหาร
   * @returns Updated recipe equipment ID / รหัสอุปกรณ์สูตรอาหารที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: IUpdateRecipeEquipment): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentService.name,
    );

    const equipment = await this.prismaService.tb_recipe_equipment.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!equipment) {
      return Result.error('Recipe equipment not found', ErrorCode.NOT_FOUND);
    }

    const { id, category_id, last_maintenance_date, next_maintenance_date, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    // Convert date fields to ISO string
    if (last_maintenance_date !== undefined) {
      updateData.last_maintenance_date = last_maintenance_date ? new Date(last_maintenance_date).toISOString() : null;
    }
    if (next_maintenance_date !== undefined) {
      updateData.next_maintenance_date = next_maintenance_date ? new Date(next_maintenance_date).toISOString() : null;
    }

    // Mapper: validate category and fetch name if changed
    if (category_id !== undefined) {
      if (category_id) {
        const category = await this.prismaService.tb_recipe_equipment_category.findFirst({
          where: { id: category_id, deleted_at: null },
          select: { id: true, name: true },
        });
        if (!category) {
          return Result.error('Equipment category not found', ErrorCode.NOT_FOUND);
        }
        updateData.category_id = category_id;
        updateData.category_name = category.name;
      } else {
        updateData.category_id = null;
        updateData.category_name = null;
      }
    }

    const updated = await this.prismaService.tb_recipe_equipment.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Partially update a recipe equipment (patch specific fields only)
   * อัปเดตบางส่วนของอุปกรณ์สูตรอาหาร (เฉพาะฟิลด์ที่ระบุ)
   * @param data - Partial recipe equipment update data / ข้อมูลสำหรับอัปเดตบางส่วนของอุปกรณ์สูตรอาหาร
   * @returns Updated recipe equipment ID / รหัสอุปกรณ์สูตรอาหารที่อัปเดตแล้ว
   */
  @TryCatch
  async patch(data: IUpdateRecipeEquipment): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'patch', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentService.name,
    );

    const equipment = await this.prismaService.tb_recipe_equipment.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!equipment) {
      return Result.error('Recipe equipment not found', ErrorCode.NOT_FOUND);
    }

    const { id, category_id, last_maintenance_date, next_maintenance_date, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    if (last_maintenance_date !== undefined) {
      updateData.last_maintenance_date = last_maintenance_date ? new Date(last_maintenance_date).toISOString() : null;
    }
    if (next_maintenance_date !== undefined) {
      updateData.next_maintenance_date = next_maintenance_date ? new Date(next_maintenance_date).toISOString() : null;
    }

    if (category_id !== undefined) {
      if (category_id) {
        const category = await this.prismaService.tb_recipe_equipment_category.findFirst({
          where: { id: category_id, deleted_at: null },
          select: { id: true, name: true },
        });
        if (!category) {
          return Result.error('Equipment category not found', ErrorCode.NOT_FOUND);
        }
        updateData.category_id = category_id;
        updateData.category_name = category.name;
      } else {
        updateData.category_id = null;
        updateData.category_name = null;
      }
    }

    const updated = await this.prismaService.tb_recipe_equipment.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Soft delete a recipe equipment
   * ลบอุปกรณ์สูตรอาหารแบบ soft delete
   * @param id - Recipe equipment ID / รหัสอุปกรณ์สูตรอาหาร
   * @returns Deleted recipe equipment ID / รหัสอุปกรณ์สูตรอาหารที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentService.name,
    );

    const equipment = await this.prismaService.tb_recipe_equipment.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!equipment) {
      return Result.error('Recipe equipment not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_recipe_equipment.update({
      where: { id: id },
      data: {
        deleted_by_id: this.userId,
        deleted_at: new Date().toISOString(),
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id });
  }
}
