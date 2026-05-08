import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { ICreateRecipeEquipmentCategory, IUpdateRecipeEquipmentCategory } from './interface/recipe-equipment-category.interface';
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
export class RecipeEquipmentCategoryService {
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
    RecipeEquipmentCategoryService.name,
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

  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_equipment_category.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe equipment category not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(category);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, paginate, tenant_id: this.bu_code },
      RecipeEquipmentCategoryService.name,
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
    const data = await this.prismaService.tb_recipe_equipment_category.findMany({
      where: {
        ...q.where(),
        deleted_at: null,
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_recipe_equipment_category.count({
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

  @TryCatch
  async create(data: ICreateRecipeEquipmentCategory): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentCategoryService.name,
    );

    const found = await this.prismaService.tb_recipe_equipment_category.findFirst({
      where: {
        name: data.name,
        deleted_at: null,
      },
    });

    if (found) {
      return Result.error('Recipe equipment category already exists', ErrorCode.ALREADY_EXISTS);
    }

    const created = await this.prismaService.tb_recipe_equipment_category.create({
      data: {
        name: data.name,
        description: data.description,
        note: data.note,
        is_active: data.is_active ?? true,
        info: data.info ?? {},
        dimension: data.dimension ?? [],
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: created.id });
  }

  @TryCatch
  async update(data: IUpdateRecipeEquipmentCategory): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_equipment_category.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe equipment category not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...fields } = data;
    const updated = await this.prismaService.tb_recipe_equipment_category.update({
      where: { id },
      data: {
        ...fields,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updated.id });
  }

  @TryCatch
  async patch(data: IUpdateRecipeEquipmentCategory): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'patch', data, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_equipment_category.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe equipment category not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...fields } = data;
    const updated = await this.prismaService.tb_recipe_equipment_category.update({
      where: { id },
      data: {
        ...fields,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updated.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      RecipeEquipmentCategoryService.name,
    );

    const category = await this.prismaService.tb_recipe_equipment_category.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!category) {
      return Result.error('Recipe equipment category not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_recipe_equipment_category.update({
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
