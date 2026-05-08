import { HttpStatus, Inject, Injectable, Logger, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import { enum_calculation_method, enum_product_status_type, enum_unit_type, PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  ICreateProduct,
  IProductInfo,
  IUpdateProduct,
} from './interface/products.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  TryCatch,
  Result,
  ErrorCode,
  createProductCreateValidation,
  createProductUpdateValidation,
  ProductDetailResponseSchema,
  ProductListItemResponseSchema,
  ProductLocationListItemResponseSchema,
  ProductItemGroupResponseSchema,
} from '@/common';

@Injectable()
export class ProductsService {
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

  private readonly logger: BackendLogger = new BackendLogger(
    ProductsService.name,
  );

  constructor(
    private readonly tenantService: TenantService,
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) { }

  /**
   * Find a single product by ID with full details including locations, units, and category hierarchy
   * ค้นหารายการสินค้าเดียวตาม ID พร้อมรายละเอียดทั้งหมดรวมถึงสถานที่ หน่วย และลำดับชั้นหมวดหมู่
   * @param id - Product ID / ID ของสินค้า
   * @returns Product detail with related data or error if not found / รายละเอียดสินค้าพร้อมข้อมูลที่เกี่ยวข้อง หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );


    const product = await this.prismaService.tb_product
      .findFirst({
        where: { id },
        include: {
          tb_unit: true,
        },
      })
      .then(async (res) => {
        const productLocation = await this.prismaService.tb_product_location.findMany({
          where: { product_id: res.id },
          include: {
            tb_location: true,
          },
        });

        const productOrderUnit = await this.prismaService.tb_unit_conversion.findMany({
          where: {
            product_id: res.id,
            unit_type: enum_unit_type.order_unit,
          },
        });

        const productIngredientUnit = await this.prismaService.tb_unit_conversion.findMany({
          where: {
            product_id: res.id,
            unit_type: enum_unit_type.ingredient_unit,
          },
        });

        let productItemGroup;
        let productSubCategory;
        let productCategory;

        if (res.product_item_group_id) {
          productItemGroup = await this.prismaService.tb_product_item_group.findFirst({
            where: {
              id: res.product_item_group_id,
            },
          });

          if (productItemGroup) {
            productSubCategory =
              await this.prismaService.tb_product_sub_category.findFirst({
                where: {
                  id: productItemGroup.product_subcategory_id,
                },
              });

            if (productSubCategory) {
              productCategory = await this.prismaService.tb_product_category.findFirst({
                where: {
                  id: productSubCategory.product_category_id,
                },
              });
            }
          }
        }

        if (!res) {
          throw new Error('Product not found');
        }

        return {
          id: res.id,
          code: res.code,
          barcode: res.barcode,
          sku: res.sku,
          name: res.name,
          local_name: res.local_name,
          description: res.description,
          product_status_type: res.product_status_type,
          inventory_unit: {
            id: res.inventory_unit_id,
            name: res.tb_unit?.name ?? res.inventory_unit_name,
          },
          is_sold_directly: res.is_sold_directly,
          is_used_in_recipe: res.is_used_in_recipe,
          price_deviation_limit: Number(res.price_deviation_limit),
          qty_deviation_limit: Number(res.qty_deviation_limit),
          standard_cost: Number(res.standard_cost),
          tax_profile_id: res.tax_profile_id,
          tax_profile_name: res.tax_profile_name,
          tax_rate: Number(res.tax_rate),
          info: (res?.info as unknown as Record<string, unknown>)?.attributes ?? [],
          product_item_group: productItemGroup
            ? {
              id: productItemGroup.id,
              name: productItemGroup.name,
            }
            : {},
          locations:
            productLocation.map((location) => ({
              id: location.id,
              location_id: location.location_id,
              location_code: location.tb_location?.code,
              location_name: location.tb_location?.name,
              location_type: location.tb_location?.location_type,
              is_active: location.tb_location?.is_active,
              delivery_point_id: location.tb_location?.delivery_point_id,
              delivery_point: location.tb_location?.delivery_point_name,
              min_qty: location.min_qty != null ? Number(location.min_qty) : null,
              max_qty: location.max_qty != null ? Number(location.max_qty) : null,
              reorder_qty: location.re_order_qty != null ? Number(location.re_order_qty) : null,
              par_qty: location.par_qty != null ? Number(location.par_qty) : null,
            })) || [],
          order_units:
            productOrderUnit.map((orderUnit) => ({
              id: orderUnit.id,
              from_unit_id: orderUnit.from_unit_id,
              from_unit_name: orderUnit.from_unit_name,
              from_unit_qty: Number(orderUnit.from_unit_qty),
              to_unit_id: orderUnit.to_unit_id,
              to_unit_name: orderUnit.to_unit_name,
              to_unit_qty: Number(orderUnit.to_unit_qty),
              unit_type: orderUnit.unit_type,
              description: orderUnit.description,
              is_active: orderUnit.is_active,
              is_default: orderUnit.is_default,
            })) || [],
          ingredient_units:
            productIngredientUnit.map((ingredientUnit) => ({
              id: ingredientUnit.id,
              from_unit_id: ingredientUnit.from_unit_id,
              from_unit_name: ingredientUnit.from_unit_name,
              from_unit_qty: Number(ingredientUnit.from_unit_qty),
              to_unit_id: ingredientUnit.to_unit_id,
              to_unit_name: ingredientUnit.to_unit_name,
              to_unit_qty: Number(ingredientUnit.to_unit_qty),
              unit_type: ingredientUnit.unit_type,
              description: ingredientUnit.description,
              is_active: ingredientUnit.is_active,
              is_default: ingredientUnit.is_default,
            })) || [],
          product_sub_category: productSubCategory
            ? {
              id: productSubCategory.id,
              name: productSubCategory.name,
            }
            : {},
          product_category: productCategory
            ? {
              id: productCategory.id,
              name: productCategory.name,
            }
            : {},
        };
      });

    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedProduct = ProductDetailResponseSchema.parse(product);

    return Result.ok(serializedProduct);
  }

  /**
   * Get products by location ID with pagination
   * ดึงรายการสินค้าตาม ID สถานที่พร้อมการแบ่งหน้า
   * @param location_id - Location ID / ID ของสถานที่
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of products at the location / รายการสินค้าที่สถานที่พร้อมการแบ่งหน้า
   */
  @TryCatch
  async getByLocationId(
    location_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getByLocationId',
        user_id: this.userId,
        tenant_id: this.bu_code,
        location_id,
        paginate,
        version,
      },
      ProductsService.name,
    );
    const defaultSearchFields = ['name', 'code', 'local_name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter as any : {},
      paginate.sort,
      paginate.advance,
    );

    const products = await this.prismaService.tb_product
      .findMany({
        ...q.findMany(),
        where: {
          ...q.where(),
          tb_product_location: {
            some: {
              location_id: location_id,
            },
          },
        },
        include: {
          tb_unit: true,
        },
      })
      .then(async (res) => {
        const products = await Promise.all(
          res.map(async (product) => {
            return {
              id: product.id,
              name: product.name,
              code: product.code,
              inventory_unit: {
                id: product.inventory_unit_id,
                name: product.tb_unit?.name ?? product.inventory_unit_name,
              },
            };
          }),
        );
        return products;
      });

    const total = await this.prismaService.tb_product.count({
      where: {
        ...q.where(),
        tb_product_location: {
          some: {
            location_id: location_id,
          },
        },
      },
    });

    // Serialize response data
    const serializedProducts = products.map((product) => ProductLocationListItemResponseSchema.parse(product));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedProducts,
    });
  }

  /**
   * ค้นหา product_location ตาม product_id
   * @param product_id - Product ID / รหัสสินค้า
   * @returns รายการ product_location ที่ผูกกับสินค้า
   */
  @TryCatch
  async findProductLocationsByProductId(
    product_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findProductLocationsByProductId', product_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const productLocations = await this.prismaService.tb_product_location.findMany({
      where: {
        product_id,
        deleted_at: null,
      },
      select: {
        id: true,
        product_id: true,
        location_id: true,
        min_qty: true,
        max_qty: true,
        re_order_qty: true,
        par_qty: true,
        note: true,
        info: true,
        dimension: true,
        tb_product: {
          select: {
            code: true,
            name: true,
            local_name: true,
            sku: true,
          },
        },
        tb_location: {
          select: {
            code: true,
            name: true,
            location_type: true,
          },
        },
      },
    });

    const result = productLocations.map((pl) => ({
      id: pl.id,
      product_id: pl.product_id,
      product_code: pl.tb_product?.code ?? null,
      product_name: pl.tb_product?.name ?? null,
      product_local_name: pl.tb_product?.local_name ?? null,
      product_sku: pl.tb_product?.sku ?? null,
      location_id: pl.location_id,
      location_code: pl.tb_location?.code ?? null,
      location_name: pl.tb_location?.name ?? null,
      location_type: pl.tb_location?.location_type ?? null,
      min_qty: pl.min_qty,
      max_qty: pl.max_qty,
      re_order_qty: pl.re_order_qty,
      par_qty: pl.par_qty,
      note: pl.note,
      info: pl.info,
      dimension: pl.dimension,
    }));

    return Result.ok(result);
  }

  /**
   * ค้นหา location ทั้งหมดพร้อม product ที่อยู่ในแต่ละ location
   * @returns รายการ location พร้อม products ในแต่ละ location
   */
  @TryCatch
  async findAllLocationsWithProducts(
    paginate: IPaginate,
    search?: string,
    category_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllLocationsWithProducts', paginate, search, category_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const searchTerm = search?.trim();
    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search || searchTerm,
      paginate.searchfields,
      ['name', 'code'],
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );
    const pagination = getPaginationParams(q.page, q.perpage);

    // Build product filter for nested relation
    const productLocationWhere: Record<string, unknown> = { deleted_at: null };
    if (searchTerm || category_id) {
      const productWhere: Record<string, unknown> = {};
      if (searchTerm) {
        productWhere.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { local_name: { contains: searchTerm, mode: 'insensitive' } },
          { code: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
      if (category_id) {
        productWhere.product_item_group_id = category_id;
      }
      productLocationWhere.tb_product = productWhere;
    }

    // Build location filter
    const locationWhere: Record<string, unknown> = { deleted_at: null, is_active: true };
    if (searchTerm) {
      locationWhere.OR = [
        { code: { contains: searchTerm, mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { tb_product_location: { some: productLocationWhere } },
      ];
    }

    const MAX_PRODUCTS_PER_LOCATION = 10;

    // Count total locations matching filter
    const total = await this.prismaService.tb_location.count({ where: locationWhere });

    // Step 1: Fetch locations (paginated) without products
    const locations = await this.prismaService.tb_location.findMany({
      where: locationWhere,
      select: { id: true, code: true, name: true, location_type: true },
      orderBy: { code: 'asc' },
      ...pagination,
    });

    const locationIds = locations.map((loc) => loc.id);

    // Step 2: Fetch stock per product+location from cost layers
    const stockMap = new Map<string, number>();
    if (locationIds.length > 0) {
      const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
        where: {
          location_id: { in: locationIds },
          deleted_at: null,
        },
        select: { product_id: true, location_id: true, in_qty: true, out_qty: true },
      });

      for (const layer of layers) {
        const key = `${layer.product_id}:${layer.location_id}`;
        const existing = stockMap.get(key) ?? 0;
        stockMap.set(key, existing + Number(layer.in_qty ?? 0) - Number(layer.out_qty ?? 0));
      }
    }

    // Step 3: For each location, pick top products by stock + fill with recent
    const data = await Promise.all(locations.map(async (loc) => {
      // Get stock > 0 products for this location, sorted desc
      const stockEntries = [...stockMap.entries()]
        .filter(([key, qty]) => key.endsWith(`:${loc.id}`) && qty > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_PRODUCTS_PER_LOCATION);

      const topProductIds = stockEntries.map(([key]) => key.split(':')[0]);
      const selectedProductIds = new Set(topProductIds);

      // If < 10, fill with most recently added products at this location
      if (selectedProductIds.size < MAX_PRODUCTS_PER_LOCATION) {
        const remaining = MAX_PRODUCTS_PER_LOCATION - selectedProductIds.size;
        const recentProducts = await this.prismaService.tb_product_location.findMany({
          where: {
            location_id: loc.id,
            deleted_at: null,
            ...(selectedProductIds.size > 0 ? { product_id: { notIn: [...selectedProductIds] } } : {}),
            ...((searchTerm || category_id) ? { tb_product: productLocationWhere.tb_product } : {}),
          },
          select: { product_id: true },
          orderBy: { created_at: 'desc' },
          take: remaining,
        });
        for (const rp of recentProducts) {
          selectedProductIds.add(rp.product_id);
        }
      }

      // Count total products for this location
      const totalProducts = await this.prismaService.tb_product_location.count({
        where: { location_id: loc.id, deleted_at: null, ...((searchTerm || category_id) ? { tb_product: productLocationWhere.tb_product } : {}) },
      });

      // Fetch full product_location data for selected products
      const productLocations = selectedProductIds.size > 0
        ? await this.prismaService.tb_product_location.findMany({
          where: {
            location_id: loc.id,
            product_id: { in: [...selectedProductIds] },
            deleted_at: null,
          },
          select: {
            id: true,
            product_id: true,
            min_qty: true,
            max_qty: true,
            re_order_qty: true,
            par_qty: true,
            note: true,
            tb_product: {
              select: {
                code: true,
                name: true,
                local_name: true,
                sku: true,
                is_active: true,
                product_item_group_id: true,
                tb_product_item_group: {
                  select: {
                    id: true,
                    name: true,
                    tb_product_sub_category: {
                      select: {
                        id: true,
                        name: true,
                        tb_product_category: {
                          select: { id: true, name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        })
        : [];

      const products = productLocations.map((pl) => {
        const itemGroup = pl.tb_product?.tb_product_item_group;
        const subCategory = itemGroup?.tb_product_sub_category;
        const category = subCategory?.tb_product_category;
        const parQty = Number(pl.par_qty ?? 0);
        const currentQty = stockMap.get(`${pl.product_id}:${loc.id}`) ?? 0;
        const needQty = Math.max(0, parQty - currentQty);

        let status: 'normal' | 'low' | 'warning' | 'critical' = 'normal';
        if (parQty > 0) {
          const ratio = currentQty / parQty;
          if (ratio <= 0.25) status = 'critical';
          else if (ratio <= 0.5) status = 'warning';
          else if (ratio <= 0.75) status = 'low';
        }

        return {
          id: pl.id,
          product_id: pl.product_id,
          product_code: pl.tb_product?.code ?? null,
          product_name: pl.tb_product?.name ?? null,
          product_local_name: pl.tb_product?.local_name ?? null,
          product_sku: pl.tb_product?.sku ?? null,
          is_active: pl.tb_product?.is_active ?? true,
          category_id: category?.id ?? null,
          category_name: category?.name ?? null,
          sub_category_id: subCategory?.id ?? null,
          sub_category_name: subCategory?.name ?? null,
          item_group_id: itemGroup?.id ?? null,
          item_group_name: itemGroup?.name ?? null,
          current_qty: currentQty,
          par_qty: parQty,
          need_qty: needQty,
          min_qty: Number(pl.min_qty ?? 0),
          max_qty: Number(pl.max_qty ?? 0),
          re_order_qty: Number(pl.re_order_qty ?? 0),
          status,
          note: pl.note,
        };
      });

      // Sort by stock descending
      products.sort((a, b) => b.current_qty - a.current_qty);

      return {
        location_id: loc.id,
        location_code: loc.code,
        location_name: loc.name,
        location_type: loc.location_type,
        total_products: totalProducts,
        products,
      };
    }));

    return Result.ok({
      paginate: {
        total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? total : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data,
    });
  }

  /**
   * ค้นหา product_location ตาม location_id
   * @param location_id - Location ID / รหัสสถานที่
   * @returns รายการ product_location ที่ผูกกับสถานที่
   */
  @TryCatch
  async findProductLocationsByLocationId(
    location_id: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findProductLocationsByLocationId', location_id, paginate, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      ['tb_product.code', 'tb_product.name', 'tb_product.local_name', 'tb_product.sku'],
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const whereClause = {
      location_id,
      deleted_at: null,
    };

    const selectFields = {
      id: true,
      product_id: true,
      tb_product: {
        select: {
          code: true,
          name: true,
          local_name: true,
          sku: true,
          inventory_unit_id: true,
          tb_unit: {
            select: {
              name: true,
            },
          },
        },
      },
    };

    const [productLocations, total] = await Promise.all([
      this.prismaService.tb_product_location.findMany({
        where: whereClause,
        select: selectFields,
        ...pagination,
      }),
      this.prismaService.tb_product_location.count({
        where: whereClause,
      }),
    ]);

    const result = productLocations.map((pl) => ({
      id: pl.id,
      product_id: pl.product_id,
      product_code: pl.tb_product?.code ?? null,
      product_name: pl.tb_product?.name ?? null,
      product_local_name: pl.tb_product?.local_name ?? null,
      product_sku: pl.tb_product?.sku ?? null,
      inventory_unit_id: pl.tb_product?.inventory_unit_id ?? null,
      inventory_unit_name: pl.tb_product?.tb_unit?.name ?? null,
    }));

    return Result.ok({
      paginate: {
        total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: result,
    });
  }

  /**
   * เปรียบเทียบสินค้าระหว่าง 2 สถานที่ แสดงเฉพาะสินค้าที่อยู่ในทั้ง 2 สถานที่
   * @param location_id_1 - Location ID 1 / รหัสสถานที่ 1
   * @param location_id_2 - Location ID 2 / รหัสสถานที่ 2
   * @returns รายการสินค้าที่อยู่ในทั้ง 2 สถานที่ พร้อมข้อมูลปริมาณจากแต่ละสถานที่
   */
  @TryCatch
  async compareProductLocations(
    location_id_1: string,
    location_id_2: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'compareProductLocations', location_id_1, location_id_2, paginate, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      [],
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const selectFields = {
      product_id: true,
      tb_product: {
        select: {
          code: true,
          name: true,
          local_name: true,
          sku: true,
          inventory_unit_id: true,
          tb_unit: {
            select: {
              name: true,
            },
          },
        },
      },
    };

    const [productsAtLocation1, productsAtLocation2] = await Promise.all([
      this.prismaService.tb_product_location.findMany({
        where: { location_id: location_id_1, deleted_at: null },
        select: selectFields,
      }),
      this.prismaService.tb_product_location.findMany({
        where: { location_id: location_id_2, deleted_at: null },
        select: selectFields,
      }),
    ]);

    const location2Map = new Map(
      productsAtLocation2.map((pl) => [pl.product_id, pl]),
    );

    const allMatched = productsAtLocation1
      .filter((pl1) => location2Map.has(pl1.product_id))
      .map((pl1) => ({
        product_id: pl1.product_id,
        product_code: pl1.tb_product?.code ?? null,
        product_name: pl1.tb_product?.name ?? null,
        product_local_name: pl1.tb_product?.local_name ?? null,
        product_sku: pl1.tb_product?.sku ?? null,
        inventory_unit_id: pl1.tb_product?.inventory_unit_id ?? null,
        inventory_unit_name: pl1.tb_product?.tb_unit?.name ?? null,
      }));

    const total = allMatched.length;
    const page = q.perpage < 0 ? 1 : q.page;
    const perpage = q.perpage < 0 ? total : q.perpage;
    const skip = (page - 1) * perpage;
    const data = allMatched.slice(skip, skip + perpage);

    return Result.ok({
      paginate: {
        total,
        page,
        perpage,
        pages: total === 0 || perpage <= 0 ? 1 : Math.ceil(total / perpage),
      },
      data,
    });
  }

  /**
   * Refresh denormalized fields in tb_product_location
   * อัปเดตฟิลด์ denormalized (product_code, product_name, product_local_name, product_sku, location_code, location_name)
   * โดยดึงค่าจริงจาก tb_product และ tb_location
   * @returns จำนวนรายการที่อัปเดต
   */
  @TryCatch
  async refreshProductLocations(): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'refreshProductLocations', user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const now = new Date().toISOString();

    const result = await this.prismaService.$executeRaw`
      UPDATE tb_product_location AS pl
      SET
        updated_at = ${now}::timestamptz,
        updated_by_id = ${this.userId}::uuid
      FROM tb_product p, tb_location l
      WHERE p.id = pl.product_id
        AND l.id = pl.location_id
        AND pl.deleted_at IS NULL
    `;

    return Result.ok({ updated: result });
  }

  /**
   * Find all products with pagination, search, and sorting
   * ค้นหารายการสินค้าทั้งหมดพร้อมการแบ่งหน้า ค้นหา และเรียงลำดับ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of products with category hierarchy / รายการสินค้าพร้อมลำดับชั้นหมวดหมู่และการแบ่งหน้า
   */
  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      ProductsService.name,
    );
    const defaultSearchFields = ['name', 'code', 'local_name'];

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
    const whereClause: Record<string, unknown> = q.where();

    // tb_product has no direct product_category_id / product_sub_category_id / product_item_group_id columns.
    // Translate these filters (which QueryParams emits inside `AND: [{ key: value }, ...]`)
    // into nested relations: product → item_group → sub_category → category.
    let productCategoryId: string | undefined;
    let productSubCategoryId: string | undefined;
    let productItemGroupId: string | undefined;

    const rewriteAndEntry = (entry: Record<string, unknown>): Record<string, unknown> | null => {
      if ('product_category_id' in entry) {
        productCategoryId = entry.product_category_id as string;
        return null;
      }
      if ('product_sub_category_id' in entry) {
        productSubCategoryId = entry.product_sub_category_id as string;
        return null;
      }
      if ('product_item_group_id' in entry) {
        productItemGroupId = entry.product_item_group_id as string;
        return null;
      }
      return entry;
    };

    if (Array.isArray(whereClause.AND)) {
      whereClause.AND = (whereClause.AND as Record<string, unknown>[])
        .map(rewriteAndEntry)
        .filter((e): e is Record<string, unknown> => e !== null);
    }

    if (productCategoryId || productSubCategoryId || productItemGroupId) {
      whereClause.tb_product_item_group = {
        ...(productItemGroupId ? { id: productItemGroupId } : {}),
        ...(productSubCategoryId || productCategoryId
          ? {
            tb_product_sub_category: {
              ...(productSubCategoryId ? { id: productSubCategoryId } : {}),
              ...(productCategoryId ? { product_category_id: productCategoryId } : {}),
            },
          }
          : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prismaService.tb_product.findMany({
        where: whereClause,
        orderBy: q.orderBy(),
        ...pagination,
        select: {
          id: true,
          code: true,
          name: true,
          local_name: true,
          description: true,
          product_status_type: true,
          inventory_unit_id: true,
          inventory_unit_name: true,
          created_at: true,
          created_by_id: true,
          updated_at: true,
          updated_by_id: true,
          deleted_at: true,
          deleted_by_id: true,
          tb_unit: {
            select: { id: true, name: true },
          },
          tb_product_item_group: {
            select: {
              id: true,
              name: true,
              tb_product_sub_category: {
                select: {
                  id: true,
                  name: true,
                  tb_product_category: {
                    select: { id: true, name: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prismaService.tb_product.count({ where: whereClause }),
    ]);

    const products = data.map((product) => {
      const itemGroup = product.tb_product_item_group;
      const subCategory = itemGroup?.tb_product_sub_category;
      const category = subCategory?.tb_product_category;

      return {
        id: product.id,
        code: product.code,
        name: product.name,
        local_name: product.local_name,
        description: product.description,
        product_status_type: product.product_status_type,
        inventory_unit_id: product.inventory_unit_id,
        inventory_unit_name: product.inventory_unit_name || product.tb_unit?.name,
        product_item_group: itemGroup
          ? { id: itemGroup.id, name: itemGroup.name }
          : {},
        product_sub_category: subCategory
          ? { id: subCategory.id, name: subCategory.name }
          : {},
        product_category: category
          ? { id: category.id, name: category.name }
          : {},
        created_at: product.created_at,
        created_by_id: product.created_by_id,
        updated_at: product.updated_at,
        updated_by_id: product.updated_by_id,
        deleted_at: product.deleted_at,
        deleted_by_id: product.deleted_by_id,
      };
    });

    // Serialize response data
    const serializedProducts = products.map((product) => ProductListItemResponseSchema.parse(product));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedProducts,
    });
  }

  /**
   * Find multiple products by their IDs
   * ค้นหารายการสินค้าหลายรายการตาม ID
   * @param ids - Array of product IDs / อาร์เรย์ของ ID สินค้า
   * @returns List of products matching the IDs / รายการสินค้าที่ตรงกับ ID
   */
  @TryCatch
  async findManyById(
    ids: string[],
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findManyById', ids, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const products = await this.prismaService.tb_product.findMany({
      where: {
        id: { in: ids },
      },
    });

    // Serialize response data
    const serializedProducts = products.map((product) => ProductListItemResponseSchema.parse(product));

    return Result.ok(serializedProducts);
  }

  /**
   * Create a new product with locations, order units, and ingredient units in a transaction
   * สร้างสินค้าใหม่พร้อมสถานที่ หน่วยสั่งซื้อ และหน่วยส่วนผสมในธุรกรรม
   * @param data - Product creation data / ข้อมูลสำหรับสร้างสินค้า
   * @returns Created product ID / ID ของสินค้าที่สร้างขึ้น
   */
  @TryCatch
  async create(
    data: ICreateProduct,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    // Validate using factory function
    const validationSchema = createProductCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Business validation: check duplicate name/code
    const foundProduct = await this.prismaService.tb_product.findFirst({
      where: {
        OR: [
          { name: data.name },
          { code: data.code }
        ]
      },
    });

    if (foundProduct) {
      return Result.error('Product already exists', ErrorCode.ALREADY_EXISTS);
    }

    // Check for duplicate locations in the request
    if (data.locations?.add) {
      const locationIds = data.locations.add.map((location) => location.location_id);
      if (new Set(locationIds).size !== locationIds.length) {
        return Result.error('Add Location duplicate', ErrorCode.ALREADY_EXISTS);
      }
    }

    // Get inventory unit name for denormalization
    const inventoryUnit = await this.prismaService.tb_unit.findFirst({
      where: { id: data.inventory_unit_id },
    });

    const tx = await this.prismaService.$transaction(async (prisma) => {
      const productObject: ICreateProduct = {
        ...data,
        inventory_unit_name: inventoryUnit.name,
      };
      const info = { ...productObject.product_info as IProductInfo }
      delete productObject.product_info;
      delete productObject.locations;
      delete productObject.order_units;
      delete productObject.ingredient_units;

      const createProduct = await prisma.tb_product.create({
        data: {
          ...productObject,
          ...info,
          created_by_id: this.userId,
        },
      });

      if (data.locations?.add?.length > 0) {
        const productLocationObj = data.locations?.add?.map((location) => ({
          location_id: location.location_id,
          product_id: createProduct.id,
          min_qty: location.min_qty ?? 0,
          max_qty: location.max_qty ?? 0,
          re_order_qty: location.re_order_qty ?? 0,
          par_qty: location.par_qty ?? 0,
        }));

        await prisma.tb_product_location.createMany({
          data: productLocationObj,
        });
      }

      if (data.order_units?.add?.length > 0) {
        const productOrderUnitObj = await Promise.all(
          data.order_units.add.map(async (orderUnit) => {
            const fromUnit = await prisma.tb_unit.findFirst({
              where: {
                id: orderUnit.from_unit_id,
              },
            });

            const toUnit = await prisma.tb_unit.findFirst({
              where: {
                id: orderUnit.to_unit_id,
              },
            });

            return {
              product_id: createProduct.id,
              from_unit_id: orderUnit.from_unit_id,
              from_unit_name: fromUnit.name,
              from_unit_qty: orderUnit.from_unit_qty,
              to_unit_id: orderUnit.to_unit_id,
              to_unit_name: toUnit.name,
              to_unit_qty: orderUnit.to_unit_qty,
              unit_type: enum_unit_type.order_unit,
              description: orderUnit.description ?? null,
              is_active: true,
              is_default: orderUnit.is_default ?? false,
              decimal_place: orderUnit.decimal_place,
              created_by_id: this.userId
            };
          }),
        );

        await prisma.tb_unit_conversion.createMany({
          data: productOrderUnitObj,
        });
      }

      if (data.ingredient_units?.add?.length > 0) {
        const productIngredientUnitObj = await Promise.all(
          data.ingredient_units.add.map(async (ingredientUnit) => {
            const fromUnit = await prisma.tb_unit.findFirst({
              where: {
                id: ingredientUnit.from_unit_id,
              },
            });

            const toUnit = await prisma.tb_unit.findFirst({
              where: {
                id: ingredientUnit.to_unit_id,
              },
            });

            return {
              product_id: createProduct.id,
              from_unit_id: ingredientUnit.from_unit_id,
              from_unit_name: fromUnit.name,
              from_unit_qty: ingredientUnit.from_unit_qty,
              to_unit_id: ingredientUnit.to_unit_id,
              to_unit_name: toUnit.name,
              to_unit_qty: ingredientUnit.to_unit_qty,
              unit_type: enum_unit_type.ingredient_unit,
              description: ingredientUnit.description ?? null,
              is_active: true,
              is_default: ingredientUnit.is_default ?? false,
              decimal_place: ingredientUnit.decimal_place,
              created_by_id: this.userId,
            };
          }),
        );

        await prisma.tb_unit_conversion.createMany({
          data: productIngredientUnitObj,
        });
      }

      return { id: createProduct.id };
    });

    return Result.ok(tx);
  }

  /**
   * Update an existing product with locations, order units, and ingredient units in a transaction
   * อัปเดตสินค้าที่มีอยู่พร้อมสถานที่ หน่วยสั่งซื้อ และหน่วยส่วนผสมในธุรกรรม
   * @param data - Product update data / ข้อมูลสำหรับอัปเดตสินค้า
   * @returns Updated product ID / ID ของสินค้าที่อัปเดต
   */
  @TryCatch
  async update(
    data: IUpdateProduct,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    // Validate using factory function
    const validationSchema = createProductUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Check if product exists
    const product = await this.prismaService.tb_product.findFirst({
      where: { id: data.id },
    });

    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    // Business validation: check duplicate name/code
    if (data.name || data.code) {
      const foundProduct = await this.prismaService.tb_product.findFirst({
        where: {
          name: data.name ?? product.name,
          code: data.code ?? product.code,
          id: { not: data.id },
        },
      });

      if (foundProduct) {
        return Result.error('Product already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    // Business validation: check if locations already exist for product
    if (data.locations?.add) {
      const productLocation = await this.prismaService.tb_product_location.findMany({
        where: {
          product_id: data.id,
          location_id: { in: data.locations.add.map((location) => location.location_id) },
        },
      });

      if (productLocation.length > 0) {
        return Result.error('Add Location already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    // Business validation: check if product locations to remove exist
    if (data.locations?.remove) {
      const locationIds = data.locations.remove.map((l) => l.location_id);
      const existingLocations = await this.prismaService.tb_product_location.findMany({
        where: { product_id: data.id, location_id: { in: locationIds } },
      });

      if (existingLocations.length !== locationIds.length) {
        return Result.error('Remove Location not found', ErrorCode.NOT_FOUND);
      }
    }

    // Business validation: check if order units to update/remove exist
    if (data.order_units?.update) {
      const orderUnitIds = data.order_units.update.map((u) => u.product_order_unit_id);
      const existingOrderUnits = await this.prismaService.tb_unit_conversion.findMany({
        where: { id: { in: orderUnitIds } },
      });

      if (existingOrderUnits.length !== orderUnitIds.length) {
        return Result.error('Update Order Unit not found', ErrorCode.NOT_FOUND);
      }
    }

    if (data.order_units?.remove) {
      const orderUnitIds = data.order_units.remove.map((u) => u.product_order_unit_id);
      const existingOrderUnits = await this.prismaService.tb_unit_conversion.findMany({
        where: { id: { in: orderUnitIds } },
      });

      if (existingOrderUnits.length !== orderUnitIds.length) {
        return Result.error('Remove Order Unit not found', ErrorCode.NOT_FOUND);
      }
    }

    // Business validation: check if ingredient units to update/remove exist
    if (data.ingredient_units?.update) {
      const ingredientUnitIds = data.ingredient_units.update.map((u) => u.product_ingredient_unit_id);
      const existingIngredientUnits = await this.prismaService.tb_unit_conversion.findMany({
        where: { id: { in: ingredientUnitIds } },
      });

      if (existingIngredientUnits.length !== ingredientUnitIds.length) {
        return Result.error('Update Ingredient Unit not found', ErrorCode.NOT_FOUND);
      }
    }

    if (data.ingredient_units?.remove) {
      const ingredientUnitIds = data.ingredient_units.remove.map((u) => u.product_ingredient_unit_id);
      const existingIngredientUnits = await this.prismaService.tb_unit_conversion.findMany({
        where: { id: { in: ingredientUnitIds } },
      });

      if (existingIngredientUnits.length !== ingredientUnitIds.length) {
        return Result.error('Remove Ingredient Unit not found', ErrorCode.NOT_FOUND);
      }
    }

    // Get inventory unit name for denormalization
    let inventoryUnitName: string | undefined;
    if (data.inventory_unit_id) {
      const inventoryUnit = await this.prismaService.tb_unit.findFirst({
        where: { id: data.inventory_unit_id },
      });
      inventoryUnitName = inventoryUnit?.name;
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      const productObject: Record<string, unknown> = { ...data };

      // Remove fields that are not direct tb_product columns
      delete productObject.id;
      delete productObject.product_info;
      delete productObject.locations;
      delete productObject.order_units;
      delete productObject.ingredient_units;

      // Extract relation IDs — Prisma update requires connect syntax
      const inventoryUnitId = productObject.inventory_unit_id as string | undefined;
      const productItemGroupId = productObject.product_item_group_id as string | undefined;
      const taxProfileId = productObject.tax_profile_id as string | undefined;
      delete productObject.inventory_unit_id;
      delete productObject.product_item_group_id;
      delete productObject.tax_profile_id;

      if (data.inventory_unit_id) {
        productObject.inventory_unit_name = inventoryUnitName;
      }

      // Extract product_info fields that are direct columns on tb_product
      const info = data.product_info ?? {};
      const productInfoFields: Record<string, unknown> = {};
      if ('is_used_in_recipe' in info) productInfoFields.is_used_in_recipe = info.is_used_in_recipe;
      if ('is_sold_directly' in info) productInfoFields.is_sold_directly = info.is_sold_directly;
      if ('barcode' in info) productInfoFields.barcode = info.barcode;
      if ('sku' in info) productInfoFields.sku = info.sku;
      if ('price_deviation_limit' in info) productInfoFields.price_deviation_limit = info.price_deviation_limit;
      if ('qty_deviation_limit' in info) productInfoFields.qty_deviation_limit = info.qty_deviation_limit;
      if ('standard_cost' in info) productInfoFields.standard_cost = info.standard_cost;
      if ('tax_profile_name' in info) productInfoFields.tax_profile_name = info.tax_profile_name;
      if ('tax_profile_rate' in info) productInfoFields.tax_profile_rate = info.tax_profile_rate;
      if ('info' in info) productInfoFields.info = info.info ? { attributes: info.info } : undefined;

      const updateData: Record<string, unknown> = {
        ...productObject,
        ...productInfoFields,
        ...(inventoryUnitId && { tb_unit: { connect: { id: inventoryUnitId } } }),
        ...(productItemGroupId && { tb_product_item_group: { connect: { id: productItemGroupId } } }),
        ...(taxProfileId && { tb_tax_profile: { connect: { id: taxProfileId } } }),
        updated_by_id: this.userId,
      };

      if (Object.keys(updateData).length > 1) {
        await prisma.tb_product.update({
          where: {
            id: data.id,
          },
          data: updateData,
        });
      }

      if (data.product_info) {
        const productInfoObject: IProductInfo = { ...data.product_info };

        if (productInfoObject.info) {
          productInfoObject.info = {
            attributes: productInfoObject.info,
          };
        }
      }

      if (data.locations) {
        if (data.locations.add?.length > 0) {
          const productLocationAddObj = data.locations.add.map(
            (location) => ({
              location_id: location.location_id,
              product_id: data.id,
              min_qty: location.min_qty ?? 0,
              max_qty: location.max_qty ?? 0,
              re_order_qty: location.re_order_qty ?? 0,
              par_qty: location.par_qty ?? 0,
            }),
          );

          await prisma.tb_product_location.createMany({
            data: productLocationAddObj,
          });
        }

        if (data.locations.update?.length > 0) {
          for (const location of data.locations.update) {
            await prisma.tb_product_location.updateMany({
              where: {
                product_id: data.id,
                location_id: location.location_id,
                deleted_at: null,
              },
              data: {
                min_qty: location.min_qty,
                max_qty: location.max_qty,
                re_order_qty: location.re_order_qty,
                par_qty: location.par_qty,
                updated_by_id: this.userId,
                updated_at: new Date().toISOString(),
              },
            });
          }
        }

        if (data.locations.remove?.length > 0) {
          const locationIds = data.locations.remove.map(
            (location) => location.location_id,
          );

          await prisma.tb_product_location.deleteMany({
            where: {
              product_id: data.id,
              location_id: { in: locationIds },
            },
          });
        }
      }

      if (data.order_units) {
        if (data.order_units.add?.length > 0) {
          const productOrderUnitAddObj = await Promise.all(
            data.order_units.add.map(async (orderUnit) => {
              const fromUnit = await prisma.tb_unit.findFirst({
                where: { id: orderUnit.from_unit_id },
              });

              const toUnit = await prisma.tb_unit.findFirst({
                where: { id: orderUnit.to_unit_id },
              });

              return {
                product_id: data.id,
                from_unit_id: orderUnit.from_unit_id,
                from_unit_name: fromUnit.name,
                from_unit_qty: orderUnit.from_unit_qty,
                to_unit_id: orderUnit.to_unit_id,
                to_unit_name: toUnit.name,
                to_unit_qty: orderUnit.to_unit_qty,
                unit_type: enum_unit_type.order_unit,
                description: orderUnit.description ?? null,
                is_active: orderUnit.is_active ?? true,
                is_default: orderUnit.is_default ?? false,
                decimal_place: orderUnit.decimal_place,
                created_by_id: this.userId,
                created_at: new Date().toISOString()
              };
            }),
          );

          await prisma.tb_unit_conversion.createMany({
            data: productOrderUnitAddObj,
          });
        }

        if (data.order_units.update?.length > 0) {
          await Promise.all(
            data.order_units.update.map(async (orderUnit) => {
              const productOrderUnit =
                await prisma.tb_unit_conversion.findFirst({
                  where: { id: orderUnit.product_order_unit_id },
                });

              const fromUnit = await prisma.tb_unit.findFirst({
                where: { id: orderUnit.from_unit_id },
              });

              const toUnit = await prisma.tb_unit.findFirst({
                where: { id: orderUnit.to_unit_id },
              });

              const data = {
                id: productOrderUnit.id,
                from_unit_id: fromUnit.id ?? productOrderUnit.from_unit_id,
                from_unit_name:
                  fromUnit.name ?? productOrderUnit.from_unit_name,
                from_unit_qty:
                  orderUnit.from_unit_qty ?? productOrderUnit.from_unit_qty,
                to_unit_id: toUnit.id ?? productOrderUnit.to_unit_id,
                to_unit_name: toUnit.name ?? productOrderUnit.to_unit_name,
                to_unit_qty:
                  orderUnit.to_unit_qty ?? productOrderUnit.to_unit_qty,
                description:
                  orderUnit.description ?? productOrderUnit.description,
                is_default: orderUnit.is_default ?? productOrderUnit.is_default,
                is_active: orderUnit.is_active ?? productOrderUnit.is_active,
                decimal_place:
                  orderUnit.decimal_place ?? productOrderUnit.decimal_place,
                updated_by_id: this.userId,
              };

              await prisma.tb_unit_conversion.updateMany({
                where: { id: data.id },
                data: { ...data },
              });
            }),
          );
        }

        if (data.order_units.remove?.length > 0) {
          const productOrderUnitIds = data.order_units?.remove?.map(
            (orderUnit) => orderUnit.product_order_unit_id,
          );

          await prisma.tb_unit_conversion.deleteMany({
            where: { id: { in: productOrderUnitIds } },
          });
        }
      }

      if (data.ingredient_units) {
        if (data.ingredient_units.add?.length > 0) {
          const productIngredientUnitObj = await Promise.all(
            data.ingredient_units.add.map(async (ingredientUnit) => {
              const fromUnit = await prisma.tb_unit.findFirst({
                where: {
                  id: ingredientUnit.from_unit_id,
                },
              });

              const toUnit = await prisma.tb_unit.findFirst({
                where: {
                  id: ingredientUnit.to_unit_id,
                },
              });

              return {
                product_id: data.id,
                from_unit_id: ingredientUnit.from_unit_id,
                from_unit_name: fromUnit.name,
                from_unit_qty: ingredientUnit.from_unit_qty,
                to_unit_id: ingredientUnit.to_unit_id,
                to_unit_name: toUnit.name,
                to_unit_qty: ingredientUnit.to_unit_qty,
                unit_type: enum_unit_type.ingredient_unit,
                description: ingredientUnit.description ?? null,
                is_active: ingredientUnit.is_active ?? true,
                is_default: ingredientUnit.is_default ?? false,
                decimal_place: ingredientUnit.decimal_place,
                created_by_id: this.userId,
                created_at: new Date().toISOString(),
              };
            }),
          );

          await prisma.tb_unit_conversion.createMany({
            data: productIngredientUnitObj,
          });
        }

        if (data.ingredient_units.update?.length > 0) {
          await Promise.all(
            data.ingredient_units.update.map(async (ingredientUnit) => {
              const productIngredientUnit =
                await prisma.tb_unit_conversion.findFirst({
                  where: { id: ingredientUnit.product_ingredient_unit_id },
                });

              const fromUnit = await prisma.tb_unit.findFirst({
                where: { id: ingredientUnit.from_unit_id },
              });

              const toUnit = await prisma.tb_unit.findFirst({
                where: { id: ingredientUnit.to_unit_id },
              });

              const data = {
                id: productIngredientUnit.id,
                from_unit_id: fromUnit.id ?? productIngredientUnit.from_unit_id,
                from_unit_name:
                  fromUnit.name ?? productIngredientUnit.from_unit_name,
                from_unit_qty:
                  ingredientUnit.from_unit_qty ??
                  productIngredientUnit.from_unit_qty,
                to_unit_id: toUnit.id ?? productIngredientUnit.to_unit_id,
                to_unit_name: toUnit.name ?? productIngredientUnit.to_unit_name,
                to_unit_qty:
                  ingredientUnit.to_unit_qty ??
                  productIngredientUnit.to_unit_qty,
                description:
                  ingredientUnit.description ??
                  productIngredientUnit.description,
                is_default:
                  ingredientUnit.is_default ?? productIngredientUnit.is_default,
                is_active:
                  ingredientUnit.is_active ?? productIngredientUnit.is_active,
                decimal_place:
                  ingredientUnit.decimal_place ??
                  productIngredientUnit.decimal_place,
                updated_by_id: this.userId,
              };

              await prisma.tb_unit_conversion.updateMany({
                where: { id: data.id },
                data: { ...data },
              });
            }),
          );
        }

        if (data.ingredient_units.remove?.length > 0) {
          const productIngredientUnitIds = data.ingredient_units?.remove?.map(
            (ingredientUnit) => ingredientUnit.product_ingredient_unit_id,
          );

          await prisma.tb_unit_conversion.deleteMany({
            where: { id: { in: productIngredientUnitIds } },
          });
        }
      }

      return { id: data.id };
    });

    return Result.ok(tx);
  }

  /**
   * Delete a product (soft delete) and deactivate related unit conversions
   * ลบสินค้า (ลบแบบซอฟต์) และปิดการใช้งานการแปลงหน่วยที่เกี่ยวข้อง
   * @param id - Product ID / ID ของสินค้า
   * @returns Deleted product ID / ID ของสินค้าที่ลบ
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code }, ProductsService.name);

    const product = await this.prismaService.tb_product.findFirst({
      where: {
        id,
      },
    });

    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    // await prisma.tb_product_info.delete({
    //   where: { product_id: product.id },
    // });

    // await prisma.tb_product_location.deleteMany({
    //   where: { product_id: product.id },
    // });

    await this.prismaService.tb_product.update({
      where: { id: product.id },
      data: {
        product_status_type: enum_product_status_type.inactive,
        updated_by_id: this.userId,
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    await this.prismaService.tb_unit_conversion.updateMany({
      where: { product_id: product.id },
      data: {
        is_active: false,
        updated_by_id: this.userId,
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id });
  }

  /**
   * Find the item group hierarchy (item group, sub-category, category) by item group ID
   * ค้นหาลำดับชั้นกลุ่มสินค้า (กลุ่มสินค้า หมวดหมู่ย่อย หมวดหมู่) ตาม ID กลุ่มสินค้า
   * @param id - Product item group ID / ID ของกลุ่มสินค้า
   * @returns Item group with sub-category and category details / กลุ่มสินค้าพร้อมรายละเอียดหมวดหมู่ย่อยและหมวดหมู่
   */
  @TryCatch
  async findItemGroup(
    id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findItemGroup', id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const productItemGroup = await this.prismaService.tb_product_item_group.findFirst({
      where: {
        id,
      },
    });

    const productSubCategory = await this.prismaService.tb_product_sub_category.findFirst({
      where: {
        id: productItemGroup.product_subcategory_id,
      },
    });

    const productCategory = await this.prismaService.tb_product_category.findFirst({
      where: {
        id: productSubCategory.product_category_id,
      },
    });

    const res = {
      product_item_group: productItemGroup
        ? {
          id: productItemGroup.id,
          name: productItemGroup.name,
        }
        : {},
      product_subcategory: productSubCategory
        ? {
          id: productSubCategory.id,
          name: productSubCategory.name,
        }
        : {},
      product_category: productCategory
        ? {
          id: productCategory.id,
          name: productCategory.name,
        }
        : {},
    };

    // Serialize response data
    const serializedRes = ProductItemGroupResponseSchema.parse(res);

    return Result.ok(serializedRes);
  }

  /**
   * Get last GRN detail by product ID and receiving date
   * ค้นหาใบรับสินค้าล่าสุดตาม ID สินค้าและวันที่รับ
   * @param product_id - Product ID / รหัสสินค้า
   * @param date - Receiving date (YYYY-MM-DD) / วันที่รับ
   * @returns Last GRN detail for this product / รายละเอียดใบรับสินค้าล่าสุด
   */
  @TryCatch
  async getLastPurchase(product_id: string, date: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getLastPurchase', product_id, date, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const endDate = new Date(`${date}T23:59:59.999Z`);

    const grnDetail = await this.prismaService.tb_good_received_note_detail.findFirst({
      where: {
        product_id,
        tb_good_received_note: {
          grn_date: { lte: endDate },
          doc_status: 'committed',
          deleted_at: null,
        },
      },
      orderBy: {
        tb_good_received_note: { grn_date: 'desc' },
      },
      select: {
        id: true,
        good_received_note_id: true,
        product_id: true,
        product_code: true,
        product_name: true,
        product_local_name: true,
        location_id: true,
        location_code: true,
        location_name: true,
        tb_good_received_note: {
          select: {
            id: true,
            grn_no: true,
            grn_date: true,
            vendor_id: true,
            vendor_name: true,
            currency_code: true,
            exchange_rate: true,
          },
        },
        tb_good_received_note_detail_item: {
          select: {
            id: true,
            received_qty: true,
            received_unit_name: true,
            received_base_qty: true,
            sub_total_price: true,
            net_amount: true,
            total_price: true,
            base_total_price: true,
            tax_rate: true,
            tax_amount: true,
            discount_rate: true,
            discount_amount: true,
          },
        },
      },
    });

    if (!grnDetail) {
      return Result.error('No GRN found for this product', ErrorCode.NOT_FOUND);
    }

    const items = grnDetail.tb_good_received_note_detail_item.map((item) => ({
      id: item.id,
      received_qty: Number(item.received_qty),
      received_unit_name: item.received_unit_name,
      received_base_qty: Number(item.received_base_qty),
      sub_total_price: Number(item.sub_total_price),
      net_amount: Number(item.net_amount),
      total_price: Number(item.total_price),
      base_total_price: Number(item.base_total_price),
      tax_rate: Number(item.tax_rate),
      tax_amount: Number(item.tax_amount),
      discount_rate: Number(item.discount_rate),
      discount_amount: Number(item.discount_amount),
    }));

    return Result.ok({
      id: grnDetail.id,
      grn_id: grnDetail.good_received_note_id,
      grn_no: grnDetail.tb_good_received_note.grn_no,
      grn_date: grnDetail.tb_good_received_note.grn_date,
      vendor_id: grnDetail.tb_good_received_note.vendor_id,
      vendor_name: grnDetail.tb_good_received_note.vendor_name,
      currency_code: grnDetail.tb_good_received_note.currency_code,
      exchange_rate: Number(grnDetail.tb_good_received_note.exchange_rate),
      product_id: grnDetail.product_id,
      product_code: grnDetail.product_code,
      product_name: grnDetail.product_name,
      product_local_name: grnDetail.product_local_name,
      location_id: grnDetail.location_id,
      location_code: grnDetail.location_code,
      location_name: grnDetail.location_name,
      items,
    });
  }

  /**
   * Get on-hand quantity for a product, optionally filtered by location
   * ดึงจำนวนสินค้าคงเหลือ โดยกรองตามสถานที่ได้
   * @param product_id - Product ID / รหัสสินค้า
   * @param location_id - Optional location ID / รหัสสถานที่ (ไม่บังคับ)
   * @returns On-hand balance per location / ยอดคงเหลือตามสถานที่
   */
  @TryCatch
  async getOnHand(product_id: string, location_id?: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getOnHand', product_id, location_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    // Fetch product info with unit relation
    const product = await this.prismaService.tb_product.findFirst({
      where: { id: product_id, deleted_at: null },
      select: {
        id: true,
        code: true,
        name: true,
        local_name: true,
        sku: true,
        inventory_unit_id: true,
        inventory_unit_name: true,
        tb_unit: { select: { name: true } },
      },
    });

    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    // Fetch product-location settings (min/max qty)

    const plWhere: any = { product_id, deleted_at: null };
    if (location_id) plWhere.location_id = location_id;

    const productLocations = await this.prismaService.tb_product_location.findMany({
      where: plWhere,
      select: {
        location_id: true,
        min_qty: true,
        max_qty: true,
        tb_location: {
          select: {
            code: true,
            name: true,
            location_type: true,
          },
        },
      },
    });
    const plMap = new Map(productLocations.map((pl) => [pl.location_id, {
      ...pl,
      location_code: pl.tb_location?.code ?? null,
      location_name: pl.tb_location?.name ?? null,
      location_type: pl.tb_location?.location_type ?? null,
    }]));

    // Fetch cost layers

    const layerWhere: any = { product_id, deleted_at: null };
    if (location_id) layerWhere.location_id = location_id;

    const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
      where: layerWhere,
      select: {
        product_id: true,
        location_id: true,
        location_code: true,
        in_qty: true,
        out_qty: true,
        average_cost_per_unit: true,
      },
    });

    // Aggregate per location
    const balanceMap = new Map<string, {
      location_id: string | null;
      location_code: string | null;
      total_in: number;
      total_out: number;
      latest_avg_cost: number;
    }>();

    for (const layer of layers) {
      const key = layer.location_id || '_no_location_';
      const existing = balanceMap.get(key);
      if (existing) {
        existing.total_in += Number(layer.in_qty);
        existing.total_out += Number(layer.out_qty);
        existing.latest_avg_cost = Number(layer.average_cost_per_unit) || existing.latest_avg_cost;
      } else {
        balanceMap.set(key, {
          location_id: layer.location_id,
          location_code: layer.location_code,
          total_in: Number(layer.in_qty),
          total_out: Number(layer.out_qty),
          latest_avg_cost: Number(layer.average_cost_per_unit),
        });
      }
    }

    // Fetch last counted date per location from physical count details
    const locationIds = [...balanceMap.keys()].filter((k) => k !== '_no_location_');
    const lastCountedMap = new Map<string, Date>();
    if (locationIds.length > 0) {
      const lastCounted = await this.prismaService.tb_physical_count.findMany({
        where: {
          location_id: { in: locationIds },
          status: 'completed',
          deleted_at: null,
        },
        select: {
          location_id: true,
          completed_at: true,
        },
        orderBy: { completed_at: 'desc' },
      });
      for (const lc of lastCounted) {
        if (lc.completed_at && !lastCountedMap.has(lc.location_id)) {
          lastCountedMap.set(lc.location_id, lc.completed_at);
        }
      }
    }

    const locations = [...balanceMap.values()].map((item) => {
      const balance = item.total_in - item.total_out;
      const pl = item.location_id ? plMap.get(item.location_id) : undefined;
      return {
        location_id: item.location_id,
        location_code: pl?.location_code || null,
        location_name: pl?.location_name || null,
        location_type: pl?.location_type || null,
        on_hand_qty: balance,
        max_qty: pl ? Number(pl.max_qty) : 0,
        min_qty: pl ? Number(pl.min_qty) : 0,
        last_counted_date: item.location_id ? (lastCountedMap.get(item.location_id) || null) : null,
      };
    });

    const total_on_hand = locations.reduce((sum, loc) => sum + loc.on_hand_qty, 0);

    // Fetch inventory transactions for this product
    const txDetailWhere: any = { product_id };
    if (location_id) txDetailWhere.location_id = location_id;

    const transactionDetails = await this.prismaService.tb_inventory_transaction_detail.findMany({
      where: txDetailWhere,
      select: {
        id: true,
        inventory_transaction_id: true,
        location_id: true,
        location_code: true,
        product_id: true,
        qty: true,
        cost_per_unit: true,
        total_cost: true,
        current_lot_no: true,
        created_at: true,
        tb_inventory_transaction: {
          select: {
            inventory_doc_type: true,
            inventory_doc_no: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const transactions = transactionDetails.map((td: any) => ({
      id: td.id,
      inventory_transaction_id: td.inventory_transaction_id,
      doc_type: td.tb_inventory_transaction?.inventory_doc_type || null,
      doc_id: td.tb_inventory_transaction?.inventory_doc_no || null,
      location_id: td.location_id,
      location_code: td.location_code,
      qty: Number(td.qty),
      cost_per_unit: Number(td.cost_per_unit),
      total_cost: Number(td.total_cost),
      lot_no: td.current_lot_no,
      created_at: td.created_at || td.tb_inventory_transaction?.created_at,
    }));

    return Result.ok({
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      product_local_name: product.local_name,
      inventory_unit_id: product.inventory_unit_id,
      inventory_unit_name: product.inventory_unit_name || product.tb_unit?.name,
      sku: product.sku,
      total_on_hand,
      locations,
      transactions,
    });
  }

  /**
   * Get product cost from inventory transactions by location and product
   * ดึงต้นทุนสินค้าจากธุรกรรมสต็อกตามสถานที่และสินค้า
   * @param product_id - Product ID / รหัสสินค้า
   * @param location_id - Location ID / รหัสสถานที่
   * @param quantity - Requested quantity / จำนวนที่ต้องการ
   * @returns Cost breakdown with lot details / รายละเอียดต้นทุนพร้อมข้อมูล lot
   */
  @TryCatch
  async getProductCost(
    product_id: string,
    location_id: string,
    quantity: number,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getProductCost', product_id, location_id, quantity, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const product = await this.prismaService.tb_product.findFirst({
      where: { id: product_id, deleted_at: null },
      select: { id: true, name: true },
    });

    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    const location = await this.prismaService.tb_location.findFirst({
      where: { id: location_id, deleted_at: null },
      select: { id: true, name: true },
    });

    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    // Fetch inventory transaction details (signed qty: positive = in, negative = out)
    const transactions = await this.prismaService.tb_inventory_transaction_detail.findMany({
      where: {
        product_id,
        location_id,
      },
      select: {
        current_lot_no: true,
        qty: true,
        cost_per_unit: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // Separate inbound lots (qty > 0) and total outbound (qty < 0)
    const inboundLots: { lot_no: string; qty: number; cost_per_unit: number }[] = [];
    let totalOutbound = 0;

    for (const tx of transactions) {
      const qty = Number(tx.qty) || 0;
      if (qty > 0) {
        inboundLots.push({
          lot_no: tx.current_lot_no || 'NO_LOT',
          qty,
          cost_per_unit: Number(tx.cost_per_unit) || 0,
        });
      } else {
        totalOutbound += Math.abs(qty);
      }
    }

    // Consume outbound from inbound lots in FIFO order to get remaining per lot
    let outRemaining = totalOutbound;
    for (const lot of inboundLots) {
      if (outRemaining <= 0) break;
      const consumed = Math.min(outRemaining, lot.qty);
      lot.qty -= consumed;
      outRemaining -= consumed;
    }

    // Calculate total available stock
    const totalAvailable = inboundLots.reduce((sum, lot) => sum + lot.qty, 0);

    if (totalAvailable <= 0) {
      return Result.error(
        'No available stock for this product at this location',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    if (quantity > totalAvailable) {
      return Result.error(
        `Insufficient stock: requested ${quantity} but only ${totalAvailable} available`,
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    // Allocate requested quantity across remaining lots (FIFO)
    let remainingQty = quantity;
    let totalCost = 0;
    const costPerUnitList: number[] = [];
    const lotNoList: string[] = [];

    for (const lot of inboundLots) {
      if (remainingQty <= 0) break;
      if (lot.qty <= 0) continue;

      const allocateQty = Math.min(remainingQty, lot.qty);
      totalCost += allocateQty * lot.cost_per_unit;
      costPerUnitList.push(lot.cost_per_unit);
      lotNoList.push(lot.lot_no);
      remainingQty -= allocateQty;
    }

    return Result.ok({
      total_cost: totalCost,
      cost_per_unit: costPerUnitList,
      lot_no: lotNoList,
      location_id: location.id,
      location_name: location.name,
      product_id: product.id,
      product_name: product.name,
    });
  }

  /**
   * Get on-order quantity for a product (ordered but not fully received)
   * ดึงจำนวนสินค้าที่สั่งซื้อแล้วแต่ยังไม่ได้รับครบ
   * @param product_id - Product ID / รหัสสินค้า
   * @returns On-order details per PO / รายละเอียดการสั่งซื้อที่ยังไม่ได้รับครบ
   */
  @TryCatch
  async getOnOrder(product_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getOnOrder', product_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    // Fetch product info
    const product = await this.prismaService.tb_product.findFirst({
      where: { id: product_id, deleted_at: null },
      select: {
        id: true,
        code: true,
        name: true,
        local_name: true,
        sku: true,
        inventory_unit_id: true,
        inventory_unit_name: true,
        tb_unit: { select: { name: true } },
      },
    });

    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    // Fetch PO details for active POs (in_progress, sent, partial)
    const poDetails = await this.prismaService.tb_purchase_order_detail.findMany({
      where: {
        product_id,
        deleted_at: null,
        tb_purchase_order: {
          po_status: { in: ['sent', 'partial'] },
          deleted_at: null,
        },
      },
      select: {
        id: true,
        order_qty: true,
        received_qty: true,
        cancelled_qty: true,
        order_unit_name: true,
        price: true,
        tb_purchase_order: {
          select: {
            id: true,
            po_no: true,
            po_status: true,
            vendor_name: true,
            order_date: true,
            delivery_date: true,
          },
        },
      },
    });

    const orders = poDetails.map((detail) => {
      const orderQty = Number(detail.order_qty) || 0;
      const receivedQty = Number(detail.received_qty) || 0;
      const cancelledQty = Number(detail.cancelled_qty) || 0;
      const pendingQty = orderQty - receivedQty - cancelledQty;
      const price = Number(detail.price) || 0;
      const total_amount = orderQty * price;

      return {
        po_id: detail.tb_purchase_order?.id,
        po_no: detail.tb_purchase_order?.po_no,
        po_status: detail.tb_purchase_order?.po_status,
        vendor_name: detail.tb_purchase_order?.vendor_name,
        order_date: detail.tb_purchase_order?.order_date,
        delivery_date: detail.tb_purchase_order?.delivery_date,
        order_qty: orderQty,
        received_qty: receivedQty,
        cancelled_qty: cancelledQty,
        pending_qty: pendingQty,
        unit_name: detail.order_unit_name,
        price,
        total_amount,
      };
    });

    const total_on_order = orders.reduce((sum, o) => sum + o.pending_qty, 0);
    const total_order_amount = orders.reduce((sum, o) => sum + o.total_amount, 0);

    return Result.ok({
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      product_local_name: product.local_name,
      inventory_unit_id: product.inventory_unit_id,
      inventory_unit_name: product.inventory_unit_name || product.tb_unit?.name,
      sku: product.sku,
      total_on_order,
      total_order_amount,
      orders,
    });
  }

  /**
   * Estimate FIFO deduction cost for a product at a location
   * ประมาณต้นทุนการตัดสต็อกแบบ FIFO พร้อมรายละเอียดต่อ lot
   */
  @TryCatch
  async getProductCostEstimate(
    product_id: string,
    location_id: string,
    quantity: number,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getProductCostEstimate', product_id, location_id, quantity, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const product = await this.prismaService.tb_product.findFirst({
      where: { id: product_id, deleted_at: null },
      select: { id: true, code: true, name: true, inventory_unit_name: true, tb_unit: { select: { name: true } } },
    });
    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    const location = await this.prismaService.tb_location.findFirst({
      where: { id: location_id, deleted_at: null },
      select: { id: true, code: true, name: true },
    });
    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    const transactions = await this.prismaService.tb_inventory_transaction_detail.findMany({
      where: { product_id, location_id },
      select: { current_lot_no: true, qty: true, cost_per_unit: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });

    const inboundLots: { lot_no: string; qty: number; cost_per_unit: number }[] = [];
    let totalOutbound = 0;
    for (const tx of transactions) {
      const qty = Number(tx.qty) || 0;
      if (qty > 0) {
        inboundLots.push({
          lot_no: tx.current_lot_no || 'NO_LOT',
          qty,
          cost_per_unit: Number(tx.cost_per_unit) || 0,
        });
      } else {
        totalOutbound += Math.abs(qty);
      }
    }

    let outRemaining = totalOutbound;
    for (const lot of inboundLots) {
      if (outRemaining <= 0) break;
      const consumed = Math.min(outRemaining, lot.qty);
      lot.qty -= consumed;
      outRemaining -= consumed;
    }

    const totalAvailable = inboundLots.reduce((sum, lot) => sum + lot.qty, 0);
    if (totalAvailable <= 0) {
      return Result.error(
        'No available stock for this product at this location',
        ErrorCode.VALIDATION_FAILURE,
      );
    }
    if (quantity > totalAvailable) {
      return Result.error(
        `Insufficient stock: requested ${quantity} but only ${totalAvailable} available`,
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    let remainingQty = quantity;
    let totalCost = 0;
    const lots: { lot_no: string; qty: number; cost_per_unit: number; line_cost: number }[] = [];

    for (const lot of inboundLots) {
      if (remainingQty <= 0) break;
      if (lot.qty <= 0) continue;
      const allocateQty = Math.min(remainingQty, lot.qty);
      const lineCost = allocateQty * lot.cost_per_unit;
      totalCost += lineCost;
      lots.push({
        lot_no: lot.lot_no,
        qty: allocateQty,
        cost_per_unit: lot.cost_per_unit,
        line_cost: lineCost,
      });
      remainingQty -= allocateQty;
    }

    const averageCostPerUnit = quantity > 0 ? totalCost / quantity : 0;

    return Result.ok({
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      inventory_unit_name: product.inventory_unit_name || product.tb_unit?.name,
      location_id: location.id,
      location_code: location.code,
      location_name: location.name,
      requested_qty: quantity,
      total_cost: totalCost,
      average_cost_per_unit: averageCostPerUnit,
      lots,
    });
  }

  /**
   * Get latest receiving transaction for a product (to check last cost)
   * ค้นหาธุรกรรมรับเข้าล่าสุดของสินค้าเพื่อตรวจสอบต้นทุนล่าสุด
   */
  @TryCatch
  async getLastReceiving(product_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getLastReceiving', product_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const product = await this.prismaService.tb_product.findFirst({
      where: { id: product_id, deleted_at: null },
      select: { id: true, code: true, name: true, inventory_unit_name: true, tb_unit: { select: { name: true } } },
    });
    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    const lastReceipt = await this.prismaService.tb_inventory_transaction_detail.findFirst({
      where: {
        product_id,
        qty: { gt: 0 },
        tb_inventory_transaction: {
          inventory_doc_type: { in: ['good_received_note', 'stock_in'] },
          deleted_at: null,
        },
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        inventory_transaction_id: true,
        location_id: true,
        location_code: true,
        current_lot_no: true,
        qty: true,
        cost_per_unit: true,
        total_cost: true,
        created_at: true,
        tb_inventory_transaction: {
          select: {
            inventory_doc_type: true,
            inventory_doc_no: true,
            created_at: true,
          },
        },
      },
    });

    if (!lastReceipt) {
      return Result.error('No receiving transaction found for this product', ErrorCode.NOT_FOUND);
    }

    const locationName = lastReceipt.location_id
      ? (
        await this.prismaService.tb_location.findFirst({
          where: { id: lastReceipt.location_id },
          select: { name: true },
        })
      )?.name ?? null
      : null;

    return Result.ok({
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      inventory_unit_name: product.inventory_unit_name || product.tb_unit?.name,
      transaction_detail_id: lastReceipt.id,
      inventory_transaction_id: lastReceipt.inventory_transaction_id,
      doc_type: lastReceipt.tb_inventory_transaction?.inventory_doc_type,
      doc_no: lastReceipt.tb_inventory_transaction?.inventory_doc_no,
      transaction_date: lastReceipt.tb_inventory_transaction?.created_at || lastReceipt.created_at,
      location_id: lastReceipt.location_id,
      location_code: lastReceipt.location_code,
      location_name: locationName,
      lot_no: lastReceipt.current_lot_no,
      qty: Number(lastReceipt.qty),
      cost_per_unit: Number(lastReceipt.cost_per_unit),
      total_cost: Number(lastReceipt.total_cost),
    });
  }

  /**
   * Get inventory movement (stock card) for a product over a date range.
   * Returns one row per cost-layer entry within [start_at, end_at], with
   * running on-hand qty/value carried forward from before the window.
   * In FIFO mode, cost_average is suffixed with "*" to flag that it shifts
   * as different lots are consumed.
   * ดึงรายการเคลื่อนไหวสินค้าในช่วงวันที่ที่กำหนด
   */
  @TryCatch
  async getInventoryMovement(
    product_id: string,
    start_at: string,
    end_at: string,
    location_id?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getInventoryMovement', product_id, start_at, end_at, location_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const product = await this.prismaService.tb_product.findFirst({
      where: { id: product_id, deleted_at: null },
      select: { id: true },
    });
    if (!product) {
      return Result.error('Product not found', ErrorCode.NOT_FOUND);
    }

    const startDate = new Date(start_at);
    const endDate = new Date(end_at);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return Result.error('Invalid start_at or end_at', ErrorCode.INVALID_ARGUMENT);
    }
    // YYYY-MM-DD without time → treat as inclusive end-of-day
    if (/^\d{4}-\d{2}-\d{2}$/.test(end_at)) {
      endDate.setHours(23, 59, 59, 999);
    }

    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: this.bu_code, deleted_at: null },
      select: { calculation_method: true },
    });
    const calculationMethod = businessUnit?.calculation_method ?? enum_calculation_method.FIFO;
    const isFifo = calculationMethod === enum_calculation_method.FIFO;


    const layerWhere: any = {
      product_id,
      deleted_at: null,
      lot_at_date: { lte: endDate },
    };
    if (location_id) layerWhere.location_id = location_id;

    const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
      where: layerWhere,
      orderBy: [
        { lot_at_date: 'asc' },
        { lot_seq_no: 'asc' },
        { lot_index: 'asc' },
        { created_at: 'asc' },
      ],
      include: {
        tb_inventory_transaction_detail: {
          select: {
            tb_inventory_transaction: {
              select: {
                inventory_doc_type: true,
                inventory_doc_no: true,
              },
            },
          },
        },
      },
    });

    const locationIds = [
      ...new Set(layers.map((l) => l.location_id).filter((id): id is string => !!id)),
    ];
    const locations = locationIds.length > 0
      ? await this.prismaService.tb_location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, code: true, name: true },
      })
      : [];
    const locationMap = new Map(locations.map((l) => [l.id, l]));

    const balanceMap = new Map<string, { qty: number; value: number }>();
    const round2 = (n: number): number => Math.round(n * 100) / 100;

    type MovementRow = {
      date: Date | null;
      status: string | null;
      in_qty: number;
      out_qty: number;
      total_qty: number;
      cost: number;
      total_cost: number;
      balance_cost: number;
      cost_average: string;
    };
    type LocationGroup = {
      location_id: string | null;
      location_name: string | null;
      location_code: string | null;
      inventory_movement: MovementRow[];
    };
    const groupMap = new Map<string, LocationGroup>();

    for (const layer of layers) {
      const inQty = Number(layer.in_qty) || 0;
      const outQty = Number(layer.out_qty) || 0;
      const cost = Number(layer.cost_per_unit) || 0;
      const locKey = layer.location_id || '_no_location_';

      const prev = balanceMap.get(locKey) || { qty: 0, value: 0 };
      const newQty = prev.qty + inQty - outQty;
      // Outflows leave at the layer's recorded cost (FIFO lot cost or AVG cost)
      const newValue = prev.value + inQty * cost - outQty * cost;
      balanceMap.set(locKey, { qty: newQty, value: newValue });

      if (layer.lot_at_date && layer.lot_at_date < startDate) continue;

      const txDetail = layer.tb_inventory_transaction_detail as
        | { tb_inventory_transaction?: { inventory_doc_type?: string | null } | null }
        | null;
      const docType = txDetail?.tb_inventory_transaction?.inventory_doc_type ?? null;

      const storedAvg = Number(layer.average_cost_per_unit) || 0;
      const computedAvg = newQty > 0 ? newValue / newQty : 0;
      const avgCost = round2(storedAvg || computedAvg);
      const totalQty = round2(newQty);
      const totalCost = round2(totalQty * avgCost);
      const cost_average = isFifo ? `${avgCost}*` : `${avgCost}`;

      const loc = layer.location_id ? locationMap.get(layer.location_id) : undefined;

      let group = groupMap.get(locKey);
      if (!group) {
        group = {
          location_id: layer.location_id,
          location_name: loc?.name ?? null,
          location_code: loc?.code ?? layer.location_code ?? null,
          inventory_movement: [],
        };
        groupMap.set(locKey, group);
      }
      group.inventory_movement.push({
        date: layer.lot_at_date,
        status: docType,
        in_qty: round2(inQty),
        out_qty: round2(outQty),
        total_qty: totalQty,
        cost: round2(cost),
        total_cost: totalCost,
        balance_cost: round2(newValue),
        cost_average,
      });
    }

    return Result.ok({
      calculation_method: calculationMethod,
      locations: [...groupMap.values()],
    });
  }

  /**
   * List distinct products that appear in tb_inventory_transaction_cost_layer
   * (i.e. products that have at least one real inventory movement).
   * ดึงรายการสินค้าที่เคยมีการเคลื่อนไหวสต็อกจริง
   */
  @TryCatch
  async listProductsWithMovement(): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listProductsWithMovement', user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
      where: { deleted_at: null },
      distinct: ['product_id'],
      select: { product_id: true },
    });

    const productIds = layers.map((l) => l.product_id).filter((id): id is string => !!id);
    if (productIds.length === 0) return Result.ok([]);

    const products = await this.prismaService.tb_product.findMany({
      where: { id: { in: productIds }, deleted_at: null },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });

    return Result.ok(products);
  }

  /**
   * List distinct locations that have any movement (across all products).
   * ดึงสถานที่ทั้งหมดที่มีการเคลื่อนไหวสต็อก (โดยไม่ระบุสินค้า)
   */
  @TryCatch
  async listLocationsWithAnyMovement(): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listLocationsWithAnyMovement', user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
      where: { deleted_at: null },
      distinct: ['location_id'],
      select: { location_id: true },
    });

    const locationIds = layers.map((l) => l.location_id).filter((id): id is string => !!id);
    if (locationIds.length === 0) return Result.ok([]);

    const locations = await this.prismaService.tb_location.findMany({
      where: { id: { in: locationIds }, deleted_at: null },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });

    return Result.ok(locations);
  }

  /**
   * List distinct products that have movement at a given location.
   * ดึงสินค้าที่มีการเคลื่อนไหวสต็อกที่สถานที่ที่ระบุ
   */
  @TryCatch
  async listProductsWithMovementAtLocation(location_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listProductsWithMovementAtLocation', location_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
      where: { location_id, deleted_at: null },
      distinct: ['product_id'],
      select: { product_id: true },
    });

    const productIds = layers.map((l) => l.product_id).filter((id): id is string => !!id);
    if (productIds.length === 0) return Result.ok([]);

    const products = await this.prismaService.tb_product.findMany({
      where: { id: { in: productIds }, deleted_at: null },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });

    return Result.ok(products);
  }

  /**
   * List distinct locations that have movement for a given product.
   * ดึงสถานที่ที่มีการเคลื่อนไหวสต็อกสำหรับสินค้าที่ระบุ
   */
  @TryCatch
  async listLocationsWithMovement(product_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'listLocationsWithMovement', product_id, user_id: this.userId, tenant_id: this.bu_code },
      ProductsService.name,
    );

    const layers = await this.prismaService.tb_inventory_transaction_cost_layer.findMany({
      where: { product_id, deleted_at: null },
      distinct: ['location_id'],
      select: { location_id: true },
    });

    const locationIds = layers.map((l) => l.location_id).filter((id): id is string => !!id);
    if (locationIds.length === 0) return Result.ok([]);

    const locations = await this.prismaService.tb_location.findMany({
      where: { id: { in: locationIds }, deleted_at: null },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });

    return Result.ok(locations);
  }
}
