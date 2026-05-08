import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import {
  TryCatch,
  Result,
  ErrorCode,
  createProductCategoryCreateValidation,
  createProductCategoryUpdateValidation,
  ProductCategoryDetailResponseSchema,
  ProductCategoryListItemResponseSchema,
} from '@/common';
import {
  ICreateProductCategory,
  IUpdateProductCategory,
} from './interface/product-category.interface';
import { TenantService } from '@/tenant/tenant.service';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

@Injectable()
export class ProductCategoryService {
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
    ProductCategoryService.name,
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
   * Find a single product category by ID
   * ค้นหารายการหมวดหมู่สินค้าเดียวตาม ID
   * @param id - Product category ID / ID ของหมวดหมู่สินค้า
   * @returns Product category detail or error if not found / รายละเอียดหมวดหมู่สินค้า หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      ProductCategoryService.name,
    );

    const productCategory = await this.prismaService.tb_product_category
      .findFirst({
        where: {
          id,
          is_active: true,
        },
      });

    if (!productCategory) {
      return Result.error('Product category not found', ErrorCode.NOT_FOUND);
    }

    const updatedRes = {
      ...productCategory,
      price_deviation_limit: Number(productCategory.price_deviation_limit),
      qty_deviation_limit: Number(productCategory.qty_deviation_limit),
    };

    const serializedProductCategory = ProductCategoryDetailResponseSchema.parse(updatedRes);
    return Result.ok(serializedProductCategory);
  }

  /**
   * Find all product categories with pagination
   * ค้นหารายการหมวดหมู่สินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of product categories / รายการหมวดหมู่สินค้าพร้อมการแบ่งหน้า
   */
  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      ProductCategoryService.name,
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
    const data = await this.prismaService.tb_product_category.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const productCategories = data.map((item) => {
      const updatedItem = {
        ...item,
        price_deviation_limit: Number(item.price_deviation_limit),
        qty_deviation_limit: Number(item.qty_deviation_limit),
      };
      return updatedItem;
    });

    const total = await this.prismaService.tb_product_category.count({ where: q.where() });

    const serializedProductCategories = productCategories.map((item) => ProductCategoryListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedProductCategories,
    });
  }

  /**
   * Create a new product category
   * สร้างหมวดหมู่สินค้าใหม่
   * @param data - Product category creation data / ข้อมูลการสร้างหมวดหมู่สินค้า
   * @returns Created product category ID or error if duplicate / ID ของหมวดหมู่สินค้าที่สร้างขึ้น หรือข้อผิดพลาดหากซ้ำ
   */
  @TryCatch
  async create(
    data: ICreateProductCategory,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductCategoryService.name,
    );

    // Validate using factory function
    const validationSchema = createProductCategoryCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    if (typeof data.name === 'string') data.name = data.name.trim();
    if (typeof data.code === 'string') data.code = data.code.trim().toUpperCase();

    // Business validation: check for duplicate
    const foundProductCategory =
      await this.prismaService.tb_product_category.findFirst({
        where: {
          OR: [
            { code: { equals: data.code, mode: 'insensitive' } },
            { name: { equals: data.name, mode: 'insensitive' } },
          ],
          deleted_at: null,
        },
      });

    if (foundProductCategory) {
      return Result.error('Product category already exists', ErrorCode.ALREADY_EXISTS);
    }

    const productCategory = await this.prismaService.tb_product_category.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: productCategory.id });
  }

  /**
   * Update an existing product category
   * อัปเดตหมวดหมู่สินค้าที่มีอยู่
   * @param data - Product category update data / ข้อมูลการอัปเดตหมวดหมู่สินค้า
   * @returns Updated product category ID or error if not found / ID ของหมวดหมู่สินค้าที่อัปเดต หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async update(
    data: IUpdateProductCategory,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductCategoryService.name,
    );

    // Validate using factory function
    const validationSchema = createProductCategoryUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    const productCategory = await this.prismaService.tb_product_category.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!productCategory) {
      return Result.error('Product category not found', ErrorCode.NOT_FOUND);
    }

    if (typeof data.name === 'string') data.name = data.name.trim();
    if (typeof data.code === 'string') data.code = data.code.trim().toUpperCase();

    // Business validation: check for duplicate
    const dupConditions: Array<Record<string, unknown>> = [];
    if (data.code && data.code.toLowerCase() !== productCategory.code.toLowerCase()) {
      dupConditions.push({ code: { equals: data.code, mode: 'insensitive' } });
    }
    if (data.name && data.name.toLowerCase() !== productCategory.name.toLowerCase()) {
      dupConditions.push({ name: { equals: data.name, mode: 'insensitive' } });
    }
    if (dupConditions.length > 0) {
      const foundProductCategory = await this.prismaService.tb_product_category.findFirst({
        where: {
          OR: dupConditions,
          deleted_at: null,
          NOT: { id: data.id },
        },
      });

      if (foundProductCategory) {
        return Result.error('Product category already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const { cascade_deviation, ...updateData } = data;

    const updatedProductCategory = await this.prismaService.tb_product_category.update({
      where: {
        id: data.id,
      },
      data: {
        ...updateData,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    // Cascade deviation limits to sub-categories, item groups, and products
    if (cascade_deviation && (data.price_deviation_limit !== undefined || data.qty_deviation_limit !== undefined)) {
      const deviationData = {
        ...(data.price_deviation_limit !== undefined && { price_deviation_limit: data.price_deviation_limit }),
        ...(data.qty_deviation_limit !== undefined && { qty_deviation_limit: data.qty_deviation_limit }),
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      };

      // 1) Update all sub-categories under this category
      await this.prismaService.tb_product_sub_category.updateMany({
        where: { product_category_id: data.id, deleted_at: null },
        data: deviationData,
      });

      // 2) Update all item groups under those sub-categories
      await this.prismaService.tb_product_item_group.updateMany({
        where: {
          tb_product_sub_category: { product_category_id: data.id, deleted_at: null },
          deleted_at: null,
        },
        data: deviationData,
      });

      // 3) Update all products under those item groups
      await this.prismaService.tb_product.updateMany({
        where: {
          tb_product_item_group: {
            tb_product_sub_category: { product_category_id: data.id, deleted_at: null },
            deleted_at: null,
          },
          deleted_at: null,
        },
        data: deviationData,
      });
    }

    return Result.ok({ id: updatedProductCategory.id });
  }

  /**
   * Delete a product category (soft delete)
   * ลบหมวดหมู่สินค้า (ลบแบบซอฟต์)
   * @param id - Product category ID / ID ของหมวดหมู่สินค้า
   * @returns Empty object on success or error if not found / อ็อบเจกต์ว่างเมื่อสำเร็จ หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      ProductCategoryService.name,
    );

    const productCategory = await this.prismaService.tb_product_category.findFirst({
      where: {
        id,
      },
    });

    if (!productCategory) {
      return Result.error('Product category not found', ErrorCode.NOT_FOUND);
    }

    const productSubCategoriesCount =
      await this.prismaService.tb_product_sub_category.count({
        where: {
          product_category_id: id,
        },
      });

    if (productSubCategoriesCount > 0) {
      return Result.error('Product category is associated with product sub category', ErrorCode.ALREADY_EXISTS);
    } else {
      await this.prismaService.tb_product_category.update({
        where: {
          id,
        }, data: {
          deleted_at: new Date().toISOString(),
          deleted_by_id: this.userId,
          is_active: false,
        },
      });
    }

    return Result.ok(null);
  }
}
