import { HttpStatus, Injectable, Logger, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import { enum_product_status_type, enum_unit_type, PrismaClient } from '@repo/prisma-shared-schema-tenant';
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
  ) { }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
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
            name: res.inventory_unit_name,
          },
          is_sold_directly: res.is_sold_directly,
          is_used_in_recipe: res.is_used_in_recipe,
          price_deviation_limit: Number(res.price_deviation_limit),
          qty_deviation_limit: Number(res.qty_deviation_limit),
          tax_profile_id: res.tax_profile_id,
          tax_profile_name: res.tax_profile_name,
          tax_rate: Number(res.tax_rate),
          info: (res?.info as any)?.attributes ?? [],
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
              location_name: location.tb_location.name,
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

  @TryCatch
  async getByLocationId(
    location_id: any,
    paginate: any,
    version: any,
  ): Promise<Result<any>> {
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
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const products = await this.prismaService.tb_product
      .findMany({
        ...q.findMany(),
        where: {
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
                name: product.inventory_unit_name,
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

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
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
    const data = await this.prismaService.tb_product.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const products = await Promise.all(
      data.map(async (product) => {
        let productItemGroup;
        let productSubCategory;
        let productCategory;

        if (product.product_item_group_id) {
          productItemGroup = await this.prismaService.tb_product_item_group.findFirst({
            where: {
              id: product.product_item_group_id,
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
              productCategory = await this.prismaService.tb_product_category.findFirst(
                {
                  where: {
                    id: productSubCategory.product_category_id,
                  },
                },
              );
            }
          }
        }

        return {
          id: product.id,
          code: product.code,
          name: product.name,
          local_name: product.local_name,
          description: product.description,
          product_status_type: product.product_status_type,
          inventory_unit_id: product.inventory_unit_id,
          inventory_unit_name: product.inventory_unit_name,
          product_item_group: productItemGroup
            ? {
              id: productItemGroup.id,
              name: productItemGroup.name,
            }
            : {},
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
      }),
    );

    const total = await this.prismaService.tb_product.count({ where: q.where() });

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

  @TryCatch
  async findManyById(
    ids: string[],
  ): Promise<Result<any>> {
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

  @TryCatch
  async create(
    data: ICreateProduct,
  ): Promise<Result<any>> {
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
              unit_type: enum_unit_type.order_unit as any,
              description: orderUnit.description ?? null,
              is_active: true,
              is_default: orderUnit.is_default ?? false,
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
              unit_type: enum_unit_type.ingredient_unit as any,
              description: ingredientUnit.description ?? null,
              is_active: true,
              is_default: ingredientUnit.is_default ?? false,
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

  @TryCatch
  async update(
    data: IUpdateProduct,
  ): Promise<Result<any>> {
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
      const productLocationIds = data.locations.remove.map((l) => l.product_location_id);
      const existingLocations = await this.prismaService.tb_product_location.findMany({
        where: { id: { in: productLocationIds } },
      });

      if (existingLocations.length !== productLocationIds.length) {
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
      const productObject: IUpdateProduct = { ...data };
      delete productObject.id;
      if (data.inventory_unit_id) {
        productObject.inventory_unit_name = inventoryUnitName;
      }
      const info = { ...productObject.product_info as IProductInfo }
      delete productObject.product_info;
      delete productObject.locations;
      delete productObject.order_units;
      delete productObject.ingredient_units;

      if (Object.keys(productObject).length > 0) {
        productObject.id = data.id;

        await prisma.tb_product.update({
          where: {
            id: data.id,
          },
          data: {
            ...productObject,
            ...info,
            updated_by_id: this.userId,
          },
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
        if (data.locations.add.length > 0) {
          const productLocationAddObj = data.locations?.add?.map(
            (location) => ({
              location_id: location.location_id,
              product_id: data.id,
            }),
          );

          await prisma.tb_product_location.createMany({
            data: productLocationAddObj,
          });
        }

        if (data.locations.remove.length > 0) {
          const productLocationIds = data.locations?.remove?.map(
            (location) => location.product_location_id,
          );

          await prisma.tb_product_location.deleteMany({
            where: {
              id: { in: productLocationIds },
            },
          });
        }
      }

      if (data.order_units) {
        if (data.order_units.add.length > 0) {
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
                unit_type: enum_unit_type.order_unit as any,
                description: orderUnit.description ?? null,
                is_active: orderUnit.is_active ?? true,
                is_default: orderUnit.is_default ?? false,
                created_by_id: this.userId,
                created_at: new Date().toISOString()
              };
            }),
          );

          await prisma.tb_unit_conversion.createMany({
            data: productOrderUnitAddObj,
          });
        }

        if (data.order_units.update.length > 0) {
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
                updated_by_id: this.userId,
              };

              await prisma.tb_unit_conversion.updateMany({
                where: { id: data.id },
                data: { ...data },
              });
            }),
          );
        }

        if (data.order_units.remove.length > 0) {
          const productOrderUnitIds = data.order_units?.remove?.map(
            (orderUnit) => orderUnit.product_order_unit_id,
          );

          await prisma.tb_unit_conversion.deleteMany({
            where: { id: { in: productOrderUnitIds } },
          });
        }
      }

      if (data.ingredient_units) {
        if (data.ingredient_units.add.length > 0) {
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
                unit_type: enum_unit_type.ingredient_unit as any,
                description: ingredientUnit.description ?? null,
                is_active: ingredientUnit.is_active ?? true,
                is_default: ingredientUnit.is_default ?? false,
                created_by_id: this.userId,
                created_at: new Date().toISOString(),
              };
            }),
          );

          await prisma.tb_unit_conversion.createMany({
            data: productIngredientUnitObj,
          });
        }

        if (data.ingredient_units.update.length > 0) {
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
                updated_by_id: this.userId,
              };

              await prisma.tb_unit_conversion.updateMany({
                where: { id: data.id },
                data: { ...data },
              });
            }),
          );
        }

        if (data.ingredient_units.remove.length > 0) {
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

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
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

  @TryCatch
  async findItemGroup(
    id: string,
  ): Promise<Result<any>> {
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
}
