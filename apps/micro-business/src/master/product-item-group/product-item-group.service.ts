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
   * Find a single product item group by ID
   * ค้นหารายการกลุ่มสินค้ารายการเดียวตาม ID
   * @param id - Product item group ID / รหัสกลุ่มสินค้า
   * @returns Product item group detail / รายละเอียดกลุ่มสินค้า
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
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

  /**
   * Find all product item groups with pagination
   * ค้นหารายการกลุ่มสินค้าทั้งหมดแบบแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of product item groups / รายการกลุ่มสินค้าแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
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

    const productItemGroups = data.map((item) => {
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

  /**
   * Create a new product item group
   * สร้างกลุ่มสินค้าใหม่
   * @param data - Product item group creation data / ข้อมูลสำหรับสร้างกลุ่มสินค้า
   * @returns Created product item group ID / รหัสกลุ่มสินค้าที่สร้างแล้ว
   */
  @TryCatch
  async create(
    data: ICreateProductItemGroup,
  ): Promise<Result<unknown>> {
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

    if (typeof data.name === 'string') data.name = data.name.trim();
    if (typeof data.code === 'string') data.code = data.code.trim().toUpperCase();

    // Business validation: check for duplicate
    const foundProductItemGroup = await this.prismaService.tb_product_item_group.findFirst({
      where: {
        code: { equals: data.code, mode: 'insensitive' },
        name: { equals: data.name, mode: 'insensitive' },
        product_subcategory_id: data.product_subcategory_id,
        deleted_at: null,
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

  /**
   * Update an existing product item group with optional cascade deviation to products
   * อัปเดตกลุ่มสินค้าที่มีอยู่ พร้อมตัวเลือกส่งค่าเบี่ยงเบนไปยังสินค้า
   * @param data - Product item group update data / ข้อมูลสำหรับอัปเดตกลุ่มสินค้า
   * @returns Updated product item group ID / รหัสกลุ่มสินค้าที่อัปเดตแล้ว
   */
  @TryCatch
  async update(
    data: IUpdateProductItemGroup,
  ): Promise<Result<unknown>> {
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

    if (typeof data.name === 'string') data.name = data.name.trim();
    if (typeof data.code === 'string') data.code = data.code.trim().toUpperCase();

    // Business validation: check for duplicate
    const foundProductItemGroup = await this.prismaService.tb_product_item_group.findFirst({
      where: {
        code: { equals: data.code ?? productItemGroup.code, mode: 'insensitive' },
        name: { equals: data.name ?? productItemGroup.name, mode: 'insensitive' },
        product_subcategory_id:
          data.product_subcategory_id ??
          productItemGroup.product_subcategory_id,
        deleted_at: null,
        NOT: {
          id: data.id,
        },
      },
    });

    if (foundProductItemGroup) {
      return Result.error('Product item group already exists', ErrorCode.ALREADY_EXISTS);
    }

    const { cascade_deviation, ...updateData } = data;

    const updateProductItemGroup = await this.prismaService.tb_product_item_group.update({
      where: {
        id: data.id,
      },
      data: {
        ...updateData,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    // Cascade deviation limits to products
    if (cascade_deviation && (data.price_deviation_limit !== undefined || data.qty_deviation_limit !== undefined)) {
      const deviationData = {
        ...(data.price_deviation_limit !== undefined && { price_deviation_limit: data.price_deviation_limit }),
        ...(data.qty_deviation_limit !== undefined && { qty_deviation_limit: data.qty_deviation_limit }),
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      };

      // Update all products under this item group
      await this.prismaService.tb_product.updateMany({
        where: { product_item_group_id: data.id, deleted_at: null },
        data: deviationData,
      });
    }

    return Result.ok({ id: updateProductItemGroup.id });
  }

  /**
   * Soft delete a product item group (checks for associated products first)
   * ลบกลุ่มสินค้าแบบ soft delete (ตรวจสอบสินค้าที่เกี่ยวข้องก่อน)
   * @param id - Product item group ID / รหัสกลุ่มสินค้า
   * @returns Deleted product item group ID / รหัสกลุ่มสินค้าที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
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
