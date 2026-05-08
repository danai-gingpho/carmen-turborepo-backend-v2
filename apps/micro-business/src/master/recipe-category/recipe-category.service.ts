import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { ICreateRecipeCategory, IUpdateRecipeCategory } from './interface/recipe-category.interface';
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
export class RecipeCategoryService {
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
    RecipeCategoryService.name,
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
   * Find a single recipe category by ID with parent name enrichment
   * ค้นหาหมวดหมู่สูตรอาหารรายการเดียวตาม ID พร้อมชื่อหมวดหมู่หลัก
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @returns Recipe category detail / รายละเอียดหมวดหมู่สูตรอาหาร
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_category.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe category not found', ErrorCode.NOT_FOUND);
    }

    // Enrich with parent name
    let parent_name: string | null = null;
    if (category.parent_id) {
      const parent = await this.prismaService.tb_recipe_category.findFirst({
        where: { id: category.parent_id, deleted_at: null },
        select: { id: true, name: true },
      });
      if (parent) {
        parent_name = parent.name;
      }
    }

    return Result.ok({ ...category, parent_name });
  }

  /**
   * Find all recipe categories with pagination and parent name enrichment
   * ค้นหาหมวดหมู่สูตรอาหารทั้งหมดแบบแบ่งหน้าพร้อมชื่อหมวดหมู่หลัก
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipe categories / รายการหมวดหมู่สูตรอาหารแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, paginate, tenant_id: this.bu_code },
      RecipeCategoryService.name,
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
    const data = await this.prismaService.tb_recipe_category.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    // Batch enrich parent names
    const parentIds = [...new Set(data.map((d) => d.parent_id).filter(Boolean))] as string[];
    const parents = parentIds.length > 0
      ? await this.prismaService.tb_recipe_category.findMany({
        where: { id: { in: parentIds } },
        select: { id: true, name: true },
      })
      : [];

    const enrichedData = data.map((item) => {
      const parent = item.parent_id ? parents.find((p) => p.id === item.parent_id) : null;
      return { ...item, parent_name: parent?.name ?? null };
    });

    const total = await this.prismaService.tb_recipe_category.count({
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
   * Create a new recipe category with parent validation and level computation
   * สร้างหมวดหมู่สูตรอาหารใหม่พร้อมตรวจสอบหมวดหมู่หลักและคำนวณระดับ
   * @param data - Recipe category creation data / ข้อมูลสำหรับสร้างหมวดหมู่สูตรอาหาร
   * @returns Created recipe category ID / รหัสหมวดหมู่สูตรอาหารที่สร้างแล้ว
   */
  @TryCatch
  async create(data: ICreateRecipeCategory): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCategoryService.name,
    );

    if (typeof data.code === 'string') data.code = data.code.trim();
    if (typeof data.name === 'string') data.name = data.name.trim();

    const found = await this.prismaService.tb_recipe_category.findFirst({
      where: {
        code: { equals: data.code, mode: 'insensitive' },
        deleted_at: null,
      },
    });

    if (found) {
      return Result.error('Recipe category code already exists', ErrorCode.ALREADY_EXISTS);
    }

    // Mapper: validate parent and compute level
    let level = data.level ?? 1;
    if (data.parent_id) {
      const parent = await this.prismaService.tb_recipe_category.findFirst({
        where: { id: data.parent_id, deleted_at: null },
        select: { id: true, level: true },
      });
      if (!parent) {
        return Result.error('Parent category not found', ErrorCode.NOT_FOUND);
      }
      level = parent.level + 1;
    }

    const created = await this.prismaService.tb_recipe_category.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        note: data.note,
        is_active: data.is_active ?? true,
        parent_id: data.parent_id ?? null,
        level: level,
        default_cost_settings: data.default_cost_settings ?? {},
        default_margins: data.default_margins ?? {},
        info: data.info ?? {},
        dimension: data.dimension ?? [],
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: created.id });
  }

  /**
   * Update an existing recipe category with parent validation and level recomputation
   * อัปเดตหมวดหมู่สูตรอาหารที่มีอยู่พร้อมตรวจสอบหมวดหมู่หลักและคำนวณระดับใหม่
   * @param data - Recipe category update data / ข้อมูลสำหรับอัปเดตหมวดหมู่สูตรอาหาร
   * @returns Updated recipe category ID / รหัสหมวดหมู่สูตรอาหารที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: IUpdateRecipeCategory): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_category.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe category not found', ErrorCode.NOT_FOUND);
    }

    if (typeof data.code === 'string') data.code = data.code.trim();
    if (typeof data.name === 'string') data.name = data.name.trim();

    if (data.code && data.code.toLowerCase() !== category.code.toLowerCase()) {
      const duplicate = await this.prismaService.tb_recipe_category.findFirst({
        where: {
          code: { equals: data.code, mode: 'insensitive' },
          deleted_at: null,
          id: { not: data.id },
        },
      });
      if (duplicate) {
        return Result.error('Recipe category code already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const { id, parent_id, level, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    // Mapper: validate parent and compute level if parent_id changed
    if (parent_id !== undefined) {
      if (parent_id === id) {
        return Result.error('Category cannot be its own parent', ErrorCode.INVALID_ARGUMENT);
      }
      if (parent_id) {
        const parent = await this.prismaService.tb_recipe_category.findFirst({
          where: { id: parent_id, deleted_at: null },
          select: { id: true, level: true },
        });
        if (!parent) {
          return Result.error('Parent category not found', ErrorCode.NOT_FOUND);
        }
        updateData.parent_id = parent_id;
        updateData.level = parent.level + 1;
      } else {
        updateData.parent_id = null;
        updateData.level = 1;
      }
    }

    if (level !== undefined && parent_id === undefined) {
      updateData.level = level;
    }

    const updated = await this.prismaService.tb_recipe_category.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Partially update a recipe category (patch specific fields only)
   * อัปเดตบางส่วนของหมวดหมู่สูตรอาหาร (เฉพาะฟิลด์ที่ระบุ)
   * @param data - Partial recipe category update data / ข้อมูลสำหรับอัปเดตบางส่วนของหมวดหมู่สูตรอาหาร
   * @returns Updated recipe category ID / รหัสหมวดหมู่สูตรอาหารที่อัปเดตแล้ว
   */
  @TryCatch
  async patch(data: IUpdateRecipeCategory): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'patch', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_category.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe category not found', ErrorCode.NOT_FOUND);
    }

    if (typeof data.code === 'string') data.code = data.code.trim();
    if (typeof data.name === 'string') data.name = data.name.trim();

    if (data.code && data.code.toLowerCase() !== category.code.toLowerCase()) {
      const duplicate = await this.prismaService.tb_recipe_category.findFirst({
        where: {
          code: { equals: data.code, mode: 'insensitive' },
          deleted_at: null,
          id: { not: data.id },
        },
      });
      if (duplicate) {
        return Result.error('Recipe category code already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const { id, parent_id, level, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    if (parent_id !== undefined) {
      if (parent_id === id) {
        return Result.error('Category cannot be its own parent', ErrorCode.INVALID_ARGUMENT);
      }
      if (parent_id) {
        const parent = await this.prismaService.tb_recipe_category.findFirst({
          where: { id: parent_id, deleted_at: null },
          select: { id: true, level: true },
        });
        if (!parent) {
          return Result.error('Parent category not found', ErrorCode.NOT_FOUND);
        }
        updateData.parent_id = parent_id;
        updateData.level = parent.level + 1;
      } else {
        updateData.parent_id = null;
        updateData.level = 1;
      }
    }

    if (level !== undefined && parent_id === undefined) {
      updateData.level = level;
    }

    const updated = await this.prismaService.tb_recipe_category.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Soft delete a recipe category (checks for subcategories and associated recipes first)
   * ลบหมวดหมู่สูตรอาหารแบบ soft delete (ตรวจสอบหมวดหมู่ย่อยและสูตรอาหารที่เกี่ยวข้องก่อน)
   * @param id - Recipe category ID / รหัสหมวดหมู่สูตรอาหาร
   * @returns Deleted recipe category ID / รหัสหมวดหมู่สูตรอาหารที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_category.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe category not found', ErrorCode.NOT_FOUND);
    }

    const childCount = await this.prismaService.tb_recipe_category.count({
      where: {
        parent_id: id,
        deleted_at: null,
      },
    });

    if (childCount > 0) {
      return Result.error('Recipe category has subcategories', ErrorCode.INVALID_ARGUMENT);
    }

    const recipeCount = await this.prismaService.tb_recipe.count({
      where: {
        category_id: id,
        deleted_at: null,
      },
    });

    if (recipeCount > 0) {
      return Result.error('Recipe category is in use by recipes', ErrorCode.INVALID_ARGUMENT);
    }

    await this.prismaService.tb_recipe_category.update({
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
