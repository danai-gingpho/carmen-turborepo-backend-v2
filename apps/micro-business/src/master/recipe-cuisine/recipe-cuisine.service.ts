import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { ICreateRecipeCuisine, IUpdateRecipeCuisine } from './interface/recipe-cuisine.interface';
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
export class RecipeCuisineService {
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
    RecipeCuisineService.name,
  );

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
   * Find a single recipe cuisine by ID
   * ค้นหารายการประเภทอาหารตามสูตรเดียวตาม ID
   * @param id - Recipe cuisine ID / ID ของประเภทอาหารตามสูตร
   * @returns Recipe cuisine detail or error if not found / รายละเอียดประเภทอาหารตามสูตร หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCuisineService.name,
    );

    const cuisine = await this.prismaService.tb_recipe_cuisines.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!cuisine) {
      return Result.error('Recipe cuisine not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(cuisine);
  }

  /**
   * Find all recipe cuisines with pagination, search, and sorting
   * ค้นหารายการประเภทอาหารตามสูตรทั้งหมดพร้อมการแบ่งหน้า ค้นหา และเรียงลำดับ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of recipe cuisines / รายการประเภทอาหารตามสูตรพร้อมการแบ่งหน้า
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, paginate, tenant_id: this.bu_code },
      RecipeCuisineService.name,
    );

    const defaultSearchFields = ['name'];

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
    const data = await this.prismaService.tb_recipe_cuisines.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_recipe_cuisines.count({
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
      data: data,
    });
  }

  /**
   * Create a new recipe cuisine with duplicate name check
   * สร้างประเภทอาหารตามสูตรใหม่พร้อมตรวจสอบชื่อซ้ำ
   * @param data - Recipe cuisine creation data / ข้อมูลสำหรับสร้างประเภทอาหารตามสูตร
   * @returns Created recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่สร้างขึ้น
   */
  @TryCatch
  async create(data: ICreateRecipeCuisine): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCuisineService.name,
    );

    const found = await this.prismaService.tb_recipe_cuisines.findFirst({
      where: {
        name: data.name,
        deleted_at: null,
      },
    });

    if (found) {
      return Result.error('Recipe cuisine already exists', ErrorCode.ALREADY_EXISTS);
    }

    const created = await this.prismaService.tb_recipe_cuisines.create({
      data: {
        name: data.name,
        description: data.description,
        note: data.note,
        is_active: data.is_active ?? true,
        region: data.region,
        popular_dishes: data.popular_dishes ?? [],
        key_ingredients: data.key_ingredients ?? [],
        info: data.info ?? {},
        dimension: data.dimension ?? [],
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: created.id });
  }

  /**
   * Update an existing recipe cuisine
   * อัปเดตประเภทอาหารตามสูตรที่มีอยู่
   * @param data - Recipe cuisine update data / ข้อมูลสำหรับอัปเดตประเภทอาหารตามสูตร
   * @returns Updated recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่อัปเดต
   */
  @TryCatch
  async update(data: IUpdateRecipeCuisine): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCuisineService.name,
    );

    const cuisine = await this.prismaService.tb_recipe_cuisines.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!cuisine) {
      return Result.error('Recipe cuisine not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    const updated = await this.prismaService.tb_recipe_cuisines.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Partially update a recipe cuisine
   * อัปเดตประเภทอาหารตามสูตรบางส่วน
   * @param data - Partial recipe cuisine update data / ข้อมูลสำหรับอัปเดตประเภทอาหารตามสูตรบางส่วน
   * @returns Updated recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่อัปเดต
   */
  @TryCatch
  async patch(data: IUpdateRecipeCuisine): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'patch', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCuisineService.name,
    );

    const cuisine = await this.prismaService.tb_recipe_cuisines.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!cuisine) {
      return Result.error('Recipe cuisine not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...fields } = data;
    const updateData: Record<string, unknown> = {
      ...fields,
      updated_by_id: this.userId,
      updated_at: new Date().toISOString(),
    };

    const updated = await this.prismaService.tb_recipe_cuisines.update({
      where: { id },
      data: updateData,
    });

    return Result.ok({ id: updated.id });
  }

  /**
   * Delete a recipe cuisine (soft delete) with usage check against recipes
   * ลบประเภทอาหารตามสูตร (ลบแบบซอฟต์) พร้อมตรวจสอบการใช้งานกับสูตรอาหาร
   * @param id - Recipe cuisine ID / ID ของประเภทอาหารตามสูตร
   * @returns Deleted recipe cuisine ID / ID ของประเภทอาหารตามสูตรที่ลบ
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeCuisineService.name,
    );

    const cuisine = await this.prismaService.tb_recipe_cuisines.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!cuisine) {
      return Result.error('Recipe cuisine not found', ErrorCode.NOT_FOUND);
    }

    const recipeCount = await this.prismaService.tb_recipe.count({
      where: {
        cuisine_id: id,
        deleted_at: null,
      },
    });

    if (recipeCount > 0) {
      return Result.error('Recipe cuisine is in use by recipes', ErrorCode.INVALID_ARGUMENT);
    }

    await this.prismaService.tb_recipe_cuisines.update({
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
