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

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
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

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
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

  @TryCatch
  async create(
    data: ICreateProductCategory,
  ): Promise<Result<any>> {
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

    // Business validation: check for duplicate
    const foundProductCategory =
      await this.prismaService.tb_product_category.findFirst({
        where: {
          code: data.code.toUpperCase(),
          name: data.name,
        },
      });

    if (foundProductCategory) {
      return Result.error('Product category already exists', ErrorCode.ALREADY_EXISTS);
    }

    data.code = data.code.toUpperCase();

    const productCategory = await this.prismaService.tb_product_category.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: productCategory.id });
  }

  @TryCatch
  async update(
    data: IUpdateProductCategory,
  ): Promise<Result<any>> {
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

    // Business validation: check for duplicate
    const foundProductCategory = await this.prismaService.tb_product_category.findFirst({
      where: {
        code: data.code.toUpperCase() ?? productCategory.code,
        name: data.name ?? productCategory.name,
        NOT: {
          id: data.id,
        },
      },
    });

    if (foundProductCategory) {
      return Result.error('Product category already exists', ErrorCode.ALREADY_EXISTS);
    }

    if (data.code) {
      data.code = data.code.toUpperCase();
    }

    const updatedProductCategory = await this.prismaService.tb_product_category.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updatedProductCategory.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
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
