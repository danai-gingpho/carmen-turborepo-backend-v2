import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateProductSubCategory,
  IUpdateProductSubCategory,
} from './interface/product-sub-category.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import {
  TryCatch,
  Result,
  ErrorCode,
  createProductSubCategoryCreateValidation,
  createProductSubCategoryUpdateValidation,
  ProductSubCategoryDetailResponseSchema,
  ProductSubCategoryListItemResponseSchema,
} from '@/common';

@Injectable()
export class ProductSubCategoryService {
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
    ProductSubCategoryService.name,
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
      ProductSubCategoryService.name,
    );

    const productSubCategory = await this.prismaService.tb_product_sub_category
      .findFirst({
        where: {
          id,
        },
        include: {
          tb_product_category: true,
        },
      })
      .then((res) => {
        if (!res) {
          throw new Error('Product sub category not found');
        }
        const category = res.tb_product_category;
        delete res.tb_product_category;

        const updatedRes = {
          ...res,
          category: {
            id: category.id,
            code: category.code,
            name: category.name,
          },
          price_deviation_limit: Number(res.price_deviation_limit),
          qty_deviation_limit: Number(res.qty_deviation_limit),
        };
        return updatedRes;
      });

    const serializedProductSubCategory = ProductSubCategoryDetailResponseSchema.parse(productSubCategory);
    return Result.ok(serializedProductSubCategory);
  }

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      ProductSubCategoryService.name,
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
    const data = await this.prismaService.tb_product_sub_category.findMany({
      where: q.where(),
      include: {
        tb_product_category: true,
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const productSubCategories = data.map((item: any) => {
      const category = item.tb_product_category;
      delete item.tb_product_category;

      const updatedItem = {
        ...item,
        category: {
          id: category.id,
          code: category.code,
          name: category.name,
        },
        price_deviation_limit: Number(item.price_deviation_limit),
        qty_deviation_limit: Number(item.qty_deviation_limit),
      };
      return updatedItem;
    });

    const total = await this.prismaService.tb_product_sub_category.count({ where: q.where() });

    const serializedProductSubCategories = productSubCategories.map((item) => ProductSubCategoryListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedProductSubCategories,
    });
  }

  @TryCatch
  async create(
    data: ICreateProductSubCategory,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductSubCategoryService.name,
    );

    // Validate using factory function
    const validationSchema = createProductSubCategoryCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Business validation: check for duplicate
    const foundProductSubCategory =
      await this.prismaService.tb_product_sub_category.findFirst({
        where: {
          name: data.name,
          code: data.code.toUpperCase(),
          product_category_id: data.product_category_id,
        },
      });

    if (foundProductSubCategory) {
      return Result.error('Product sub category already exists', ErrorCode.ALREADY_EXISTS);
    }

    data.code = data.code.toUpperCase();

    const createProductSubCategory =
      await this.prismaService.tb_product_sub_category.create({
        data: {
          ...data,
          created_by_id: this.userId,
        },
      });

    return Result.ok({ id: createProductSubCategory.id });
  }

  @TryCatch
  async update(
    data: IUpdateProductSubCategory,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductSubCategoryService.name,
    );

    // Validate using factory function
    const validationSchema = createProductSubCategoryUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    const productSubCategory = await this.prismaService.tb_product_sub_category.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!productSubCategory) {
      return Result.error('Product sub category not found', ErrorCode.NOT_FOUND);
    }

    // Business validation: check for duplicate
    const foundProductSubCategory =
      await this.prismaService.tb_product_sub_category.findFirst({
        where: {
          name: data.name ?? productSubCategory.name,
          code: data.code.toUpperCase() ?? productSubCategory.code,
          product_category_id:
            data.product_category_id ?? productSubCategory.product_category_id,
          NOT: {
            id: data.id,
          },
        },
      });

    if (foundProductSubCategory) {
      return Result.error('Product sub category already exists', ErrorCode.ALREADY_EXISTS);
    }

    const updateProductSubCategory =
      await this.prismaService.tb_product_sub_category.update({
        where: {
          id: data.id,
        },
        data: {
          ...data,
          updated_by_id: this.userId,
          updated_at: new Date().toISOString(),
        },
      });

    return Result.ok({ id: updateProductSubCategory.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      ProductSubCategoryService.name,
    );
    const productSubCategory = await this.prismaService.tb_product_sub_category.findFirst({
      where: {
        id,
      },
    });

    if (!productSubCategory) {
      return Result.error('Product sub category not found', ErrorCode.NOT_FOUND);
    }

    const productItemGroupCount = await this.prismaService.tb_product_item_group.count({
      where: {
        product_subcategory_id: id,
      },
    });

    if (productItemGroupCount > 0) {
      return Result.error('Product sub category is associated with product item group', ErrorCode.ALREADY_EXISTS);
    } else {
      await this.prismaService.tb_product_sub_category.update({
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
