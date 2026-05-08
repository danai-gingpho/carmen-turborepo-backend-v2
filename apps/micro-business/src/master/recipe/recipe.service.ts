import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { ICreateRecipe, IUpdateRecipe } from './interface/recipe.interface';
import { RecipeLogic } from './recipe.logic';
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
export class RecipeService {
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
    RecipeService.name,
  );

  /**
   * Initialize the Prisma service for the tenant and recipe logic
   * เริ่มต้นบริการ Prisma สำหรับผู้เช่าและตรรกะสูตรอาหาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / รหัสผู้ใช้
   */
  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
    this.recipeLogic.setPrismaService(this._prismaService);
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
    private readonly recipeLogic: RecipeLogic,
  ) { }

  /**
   * Find a single recipe by ID with category, cuisine, ingredients, steps, and yield variants
   * ค้นหาสูตรอาหารรายการเดียวตาม ID พร้อมหมวดหมู่ ประเภทอาหาร ส่วนผสม ขั้นตอน และตัวแปรผลผลิต
   * @param id - Recipe ID / รหัสสูตรอาหาร
   * @returns Recipe detail / รายละเอียดสูตรอาหาร
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeService.name,
    );

    const recipe = await this.prismaService.tb_recipe.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
      include: {
        tb_recipe_category: {
          select: { id: true, name: true, code: true },
        },
        tb_recipe_cuisines: {
          select: { id: true, name: true, region: true },
        },
        tb_recipe_ingredients: {
          where: { deleted_at: null },
          orderBy: { sequence_no: 'asc' },
        },
        tb_recipe_preparation_steps: {
          orderBy: { sequence_no: 'asc' },
        },
        tb_recipe_yield_variants: true,
      },
    });

    if (!recipe) {
      return Result.error('Recipe not found', ErrorCode.NOT_FOUND);
    }

    const {
      tb_recipe_category,
      tb_recipe_cuisines,
      tb_recipe_ingredients,
      tb_recipe_preparation_steps,
      tb_recipe_yield_variants,
      ...rest
    } = recipe;

    const converted = this.recipeLogic.convertDecimalFields(rest);

    // Convert decimal fields in ingredients
    const ingredients = tb_recipe_ingredients.map((ing) => ({
      ...ing,
      qty: ing.qty ? Number(ing.qty) : 0,
      inventory_qty: ing.inventory_qty ? Number(ing.inventory_qty) : null,
      conversion_factor: ing.conversion_factor ? Number(ing.conversion_factor) : null,
      cost_per_unit: ing.cost_per_unit ? Number(ing.cost_per_unit) : 0,
      wastage_percentage: ing.wastage_percentage ? Number(ing.wastage_percentage) : 0,
      net_cost: ing.net_cost ? Number(ing.net_cost) : 0,
      wastage_cost: ing.wastage_cost ? Number(ing.wastage_cost) : 0,
    }));

    return Result.ok({
      ...converted,
      category: tb_recipe_category,
      cuisine: tb_recipe_cuisines,
      ingredients,
      preparation_steps: tb_recipe_preparation_steps,
      yield_variants: tb_recipe_yield_variants,
    });
  }

  /**
   * Find all recipes with pagination
   * ค้นหาสูตรอาหารทั้งหมดแบบแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipes / รายการสูตรอาหารแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, paginate, tenant_id: this.bu_code },
      RecipeService.name,
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
    const data = await this.prismaService.tb_recipe.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      include: {
        tb_recipe_category: {
          select: { id: true, name: true },
        },
        tb_recipe_cuisines: {
          select: { id: true, name: true },
        },
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const enrichedData = data.map((item) => {
      const { tb_recipe_category, tb_recipe_cuisines, ...rest } = item;
      const converted = this.recipeLogic.convertDecimalFields(rest);
      return {
        ...converted,
        category: tb_recipe_category,
        cuisine: tb_recipe_cuisines,
      };
    });

    const total = await this.prismaService.tb_recipe.count({
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
   * Create a new recipe with category and cuisine validation
   * สร้างสูตรอาหารใหม่พร้อมตรวจสอบหมวดหมู่และประเภทอาหาร
   * @param data - Recipe creation data / ข้อมูลสำหรับสร้างสูตรอาหาร
   * @returns Created recipe ID / รหัสสูตรอาหารที่สร้างแล้ว
   */
  @TryCatch
  async create(data: ICreateRecipe): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeService.name,
    );

    const found = await this.prismaService.tb_recipe.findFirst({
      where: {
        code: data.code,
        deleted_at: null,
      },
    });

    if (found) {
      return Result.error('Recipe already exists', ErrorCode.ALREADY_EXISTS);
    }

    // Mapper: validate category exists
    const category = await this.recipeLogic.validateCategory(data.category_id);
    if (!category) {
      return Result.error('Recipe category not found', ErrorCode.NOT_FOUND);
    }

    // Mapper: validate cuisine exists
    const cuisine = await this.recipeLogic.validateCuisine(data.cuisine_id);
    if (!cuisine) {
      return Result.error('Recipe cuisine not found', ErrorCode.NOT_FOUND);
    }

    const created = await this.prismaService.tb_recipe.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        note: data.note,
        is_active: data.is_active ?? true,
        images: data.images ?? [],
        category_id: data.category_id,
        cuisine_id: data.cuisine_id,
        difficulty: data.difficulty ?? 'MEDIUM',
        base_yield: data.base_yield,
        base_yield_unit: data.base_yield_unit,
        default_variant_id: data.default_variant_id ?? null,
        prep_time: data.prep_time ?? 0,
        cook_time: data.cook_time ?? 0,
        total_ingredient_cost: data.total_ingredient_cost ?? 0,
        labor_cost: data.labor_cost ?? 0,
        overhead_cost: data.overhead_cost ?? 0,
        cost_per_portion: data.cost_per_portion ?? 0,
        suggested_price: data.suggested_price,
        selling_price: data.selling_price,
        target_food_cost_percentage: data.target_food_cost_percentage,
        actual_food_cost_percentage: data.actual_food_cost_percentage,
        gross_margin: data.gross_margin,
        gross_margin_percentage: data.gross_margin_percentage,
        labor_cost_percentage: data.labor_cost_percentage,
        overhead_percentage: data.overhead_percentage,
        carbon_footprint: data.carbon_footprint ?? 0,
        deduct_from_stock: data.deduct_from_stock ?? true,
        status: data.status ?? 'DRAFT',
        tags: data.tags ?? [],
        allergens: data.allergens ?? [],
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: created.id });
  }

  /**
   * Update an existing recipe with status transition handling
   * อัปเดตสูตรอาหารที่มีอยู่พร้อมจัดการการเปลี่ยนสถานะ
   * @param data - Recipe update data / ข้อมูลสำหรับอัปเดตสูตรอาหาร
   * @returns Updated recipe ID / รหัสสูตรอาหารที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: IUpdateRecipe): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeService.name,
    );

    const recipe = await this.prismaService.tb_recipe.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!recipe) {
      return Result.error('Recipe not found', ErrorCode.NOT_FOUND);
    }

    const { id, category_id, cuisine_id, status, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    // Mapper: validate category if changed
    if (category_id !== undefined) {
      const category = await this.recipeLogic.validateCategory(category_id);
      if (!category) {
        return Result.error('Recipe category not found', ErrorCode.NOT_FOUND);
      }
      updateData.category_id = category_id;
    }

    // Mapper: validate cuisine if changed
    if (cuisine_id !== undefined) {
      const cuisine = await this.recipeLogic.validateCuisine(cuisine_id);
      if (!cuisine) {
        return Result.error('Recipe cuisine not found', ErrorCode.NOT_FOUND);
      }
      updateData.cuisine_id = cuisine_id;
    }

    // Auto-set timestamps on status transitions
    if (status !== undefined && status !== recipe.status) {
      updateData.status = status;
      if (status === 'PUBLISHED') {
        updateData.published_at = new Date().toISOString();
      } else if (status === 'ARCHIVED') {
        updateData.archived_at = new Date().toISOString();
      }
    }

    const updated = await this.prismaService.tb_recipe.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Partially update a recipe (patch specific fields only)
   * อัปเดตบางส่วนของสูตรอาหาร (เฉพาะฟิลด์ที่ระบุ)
   * @param data - Partial recipe update data / ข้อมูลสำหรับอัปเดตบางส่วนของสูตรอาหาร
   * @returns Updated recipe ID / รหัสสูตรอาหารที่อัปเดตแล้ว
   */
  @TryCatch
  async patch(data: IUpdateRecipe): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'patch', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeService.name,
    );

    const recipe = await this.prismaService.tb_recipe.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!recipe) {
      return Result.error('Recipe not found', ErrorCode.NOT_FOUND);
    }

    const { id, category_id, cuisine_id, status, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    if (category_id !== undefined) {
      const category = await this.recipeLogic.validateCategory(category_id);
      if (!category) {
        return Result.error('Recipe category not found', ErrorCode.NOT_FOUND);
      }
      updateData.category_id = category_id;
    }

    if (cuisine_id !== undefined) {
      const cuisine = await this.recipeLogic.validateCuisine(cuisine_id);
      if (!cuisine) {
        return Result.error('Recipe cuisine not found', ErrorCode.NOT_FOUND);
      }
      updateData.cuisine_id = cuisine_id;
    }

    if (status !== undefined && status !== recipe.status) {
      updateData.status = status;
      if (status === 'PUBLISHED') {
        updateData.published_at = new Date().toISOString();
      } else if (status === 'ARCHIVED') {
        updateData.archived_at = new Date().toISOString();
      }
    }

    const updated = await this.prismaService.tb_recipe.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Soft delete a recipe (checks for sub-recipe usage first)
   * ลบสูตรอาหารแบบ soft delete (ตรวจสอบการใช้เป็นสูตรอาหารย่อยก่อน)
   * @param id - Recipe ID / รหัสสูตรอาหาร
   * @returns Deleted recipe ID / รหัสสูตรอาหารที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeService.name,
    );

    const recipe = await this.prismaService.tb_recipe.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!recipe) {
      return Result.error('Recipe not found', ErrorCode.NOT_FOUND);
    }

    // Check if used as sub-recipe
    const subRecipeCount = await this.prismaService.tb_recipe_ingredient.count({
      where: {
        sub_recipe_id: id,
        deleted_at: null,
      },
    });

    if (subRecipeCount > 0) {
      return Result.error('Recipe is used as a sub-recipe in other recipes', ErrorCode.INVALID_ARGUMENT);
    }

    await this.prismaService.tb_recipe.update({
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
