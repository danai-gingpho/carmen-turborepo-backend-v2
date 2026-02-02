import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import {
  ICreateProductItemGroup,
  IUpdateProductItemGroup,
} from './interface/product-item-group.interface';
import { TenantService } from '@/tenant/tenant.service';
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
  createProductItemGroupCreateValidation,
  createProductItemGroupUpdateValidation,
  ProductItemGroupDetailResponseSchema,
  ProductItemGroupListItemResponseSchema,
} from '@/common';

@Injectable()
export class ProductItemGroupService {
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
    ProductItemGroupService.name,
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
      ProductItemGroupService.name,
    );

    const productItemGroup = await this.prismaService.tb_product_item_group
      .findFirst({
        where: {
          id,
        },
        include: {
          tb_product_sub_category: {
            include: {
              tb_product_category: true,
            },
          },
        },
      })
      .then((res) => {
        if (!res) {
          throw new Error('Product item group not found');
        }

        const subCategory = res.tb_product_sub_category;
        const category = subCategory.tb_product_category;
        delete res.tb_product_sub_category;

        const updatedRes = {
          ...res,
          sub_category: {
            id: subCategory.id,
            code: subCategory.code,
            name: subCategory.name,
          },
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

    const serializedProductItemGroup = ProductItemGroupDetailResponseSchema.parse(productItemGroup);
    return Result.ok(serializedProductItemGroup);
  }

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      ProductItemGroupService.name,
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
    const data = await this.prismaService.tb_product_item_group.findMany({
      where: q.where(),
      include: {
        tb_product_sub_category: {
          include: {
            tb_product_category: true,
          },
        },
      },
      orderBy: q.orderBy(),
      ...pagination,
    });

    const productItemGroups = data.map((item: any) => {
      const subCategory = item.tb_product_sub_category;
      const category = subCategory.tb_product_category;
      delete item.tb_product_sub_category;
      const updatedItem = {
        ...item,
        sub_category: {
          id: subCategory.id,
          code: subCategory.code,
          name: subCategory.name,
        },
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

    const total = await this.prismaService.tb_product_item_group.count({ where: q.where() });

    const serializedProductItemGroups = productItemGroups.map((item) => ProductItemGroupListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedProductItemGroups,
    });
  }

  @TryCatch
  async create(
    data: ICreateProductItemGroup,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductItemGroupService.name,
    );

    // Validate using factory function
    const validationSchema = createProductItemGroupCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Business validation: check for duplicate
    const foundProductItemGroup = await this.prismaService.tb_product_item_group.findFirst({
      where: {
        code: data.code.toUpperCase(),
        name: data.name,
        product_subcategory_id: data.product_subcategory_id,
      },
    });

    if (foundProductItemGroup) {
      return Result.error('Product item group already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createProductItemGroup = await this.prismaService.tb_product_item_group.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createProductItemGroup.id });
  }

  @TryCatch
  async update(
    data: IUpdateProductItemGroup,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductItemGroupService.name,
    );

    // Validate using factory function
    const validationSchema = createProductItemGroupUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    const productItemGroup = await this.prismaService.tb_product_item_group.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!productItemGroup) {
      return Result.error('Product item group not found', ErrorCode.NOT_FOUND);
    }

    // Business validation: check for duplicate
    const foundProductItemGroup = await this.prismaService.tb_product_item_group.findFirst({
      where: {
        code: data.code.toUpperCase() ?? productItemGroup.code,
        name: data.name ?? productItemGroup.name,
        product_subcategory_id:
          data.product_subcategory_id ??
          productItemGroup.product_subcategory_id,
        NOT: {
          id: data.id,
        },
      },
    });

    if (foundProductItemGroup) {
      return Result.error('Product item group already exists', ErrorCode.ALREADY_EXISTS);
    }

    const updateProductItemGroup = await this.prismaService.tb_product_item_group.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updateProductItemGroup.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      ProductItemGroupService.name,
    );

    const productItemGroup = await this.prismaService.tb_product_item_group.findFirst({
      where: {
        id,
      },
    });

    if (!productItemGroup) {
      return Result.error('Product item group not found', ErrorCode.NOT_FOUND);
    }

    // get count all products under this item group
    const productCount = await this.prismaService.tb_product.count({
      where: {
        product_item_group_id: id,
      },
    });

    if (productCount > 0) {
      return Result.error('Product item group is associated with products', ErrorCode.ALREADY_EXISTS);
    } else {
      await this.prismaService.tb_product_item_group.update({
        where: {
          id,
        }, data: {
          deleted_at: new Date().toISOString(),
          deleted_by_id: this.userId,
          is_active: false,
        },
      });
    }

    return Result.ok({ id });
  }
}
