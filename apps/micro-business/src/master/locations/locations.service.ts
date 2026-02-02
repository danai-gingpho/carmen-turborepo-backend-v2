import { HttpStatus, Injectable, HttpException, Inject } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import { Prisma, PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  ICreateLocation,
  IUpdateLocation,
} from './interface/location.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import {
  enum_location_type,
  enum_physical_count_type,
} from '@repo/prisma-shared-schema-tenant';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IProductInventoryInfo,
  TryCatch,
  Result,
  ErrorCode,
  createLocationCreateValidation,
  createLocationUpdateValidation,
  LocationDetailResponseSchema,
  LocationListItemResponseSchema,
  LocationByUserResponseSchema,
} from '@/common';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';

@Injectable()
export class LocationsService {
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
    LocationsService.name,
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
      @Inject('PRISMA_SYSTEM')
      private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findOne(
    id: string,
    withUsers: boolean = false,
    withProducts: boolean = false,
    version: string = 'latest',
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
        withUsers,
        withProducts,
        version,
      },
      LocationsService.name,
    );
    const specialQuery = {};

    if (withUsers) {
      Object.assign(specialQuery, {
        tb_user_location: {
          select: {
            user_id: true,
          },
        },
      });
    }

    if (withProducts) {
      Object.assign(specialQuery, {
        tb_product_location: {
          select: {
            product_id: true,
          },
        },
      });
    }

    const location = await this.prismaService.tb_location
      .findFirst({
        where: { id },
        select: {
          id: true,
          code: true,
          name: true,
          location_type: true,
          physical_count_type: true,
          description: true,
          is_active: true,
          info: true,
          ...specialQuery,
          tb_delivery_point: {
            select: {
              id: true,
              name: true,
              is_active: true,
            },
          },
        },
      })
      .then(async (res: any) => {
        const user_location = [];
        const product_location = [];

        if (withUsers && res?.tb_user_location) {
          for (const user of res.tb_user_location) {
            this.logger.debug(
              { function: 'with user option', user },
              LocationsService.name,
            );
            const userProfile = await this.prismaSystem.tb_user_profile.findFirst({
              where: {
                user_id: user.user_id,
              },
              select: {
                firstname: true,
                lastname: true,
                middlename: true,
                telephone: true,
              },
            });

            user_location.push({
              id: user.user_id,
              firstname: userProfile?.firstname ?? null,
              lastname: userProfile?.lastname ?? null,
              middlename: userProfile?.middlename ?? null,
              telephone: userProfile?.telephone ?? null,
            });
          }
        }

        if (withProducts && res?.tb_product_location) {
          for (const product of res.tb_product_location) {
            this.logger.debug(
              { function: 'with product option', product },
              LocationsService.name,
            );
            const product_info = await this.prismaService.tb_product.findFirst({
              where: { id: product.product_id },
              select: {
                id: true,
                name: true,
                code: true
              },
            });
            product_location.push({
              id: product.product_id,
              name: product_info?.name ?? null,
              code: product_info?.code ?? null,
              min_qty: product.min_qty ?? null,
              max_qty: product.max_qty ?? null,
              re_order_qty: product.re_order_qty ?? null,
              par_qty: product.par_qty ?? null,
            });
          }
        }

        return {
          id: res.id,
          code: res.code,
          name: res.name,
          location_type: res.location_type,
          physical_count_type: res.physical_count_type,
          description: res.description,
          is_active: res.is_active,
          info: res.info,
          user_location,
          product_location,
          delivery_point: {
            id: res.tb_delivery_point.id,
            name: res.tb_delivery_point.name,
            is_active: res.tb_delivery_point.is_active,
          },
        };
      });

    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedLocation = LocationDetailResponseSchema.parse(location);

    return Result.ok(serializedLocation);
  }

  @TryCatch
  async findManyById(
    ids: string[],
    version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      { function: 'findManyById', ids, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );
    const locations = await this.prismaService.tb_location.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        code: true,
        location_type: true,
        physical_count_type: true,
        description: true,
        is_active: true,
        info: true,
      },
    });

    // Serialize response data
    const serializedLocations = locations.map((location) => LocationListItemResponseSchema.parse(location));

    return Result.ok(serializedLocations);
  }

  @TryCatch
  async findAll(
    bu_code: string,
    paginate: IPaginate,
    version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, bu_code, paginate, version },
      LocationsService.name,
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
    const prismaParams = {
      where: q.where(),
      include: {
        tb_delivery_point: true,
      },
      orderBy: q.orderBy(),
      ...pagination,
    };
    console.log('Prisma findMany params:', JSON.stringify(prismaParams, null, 2));
    const data = await this.prismaService.tb_location.findMany(prismaParams);

    console.log('data:', data)
    const locations = data.map((item: any) => {
      return {
        id: item.id,
        code: item.code,
        name: item.name,
        location_type: item.location_type,
        physical_count_type: item.physical_count_type,
        description: item.description ?? null,
        is_active: item.is_active,
        info: item.info ?? null,
        delivery_point: item.tb_delivery_point
          ? {
            id: item.tb_delivery_point.id,
            name: item.tb_delivery_point.name,
            is_active: item.tb_delivery_point.is_active,
          }
          : {},
      };
    });

    const total = await this.prismaService.tb_location.count({ where: q.where() });

    // Serialize response data
    const serializedLocations = locations.map((location) => LocationListItemResponseSchema.parse(location));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedLocations,
    });
  }

  @TryCatch
  async findAllByUser(
    version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      { function: 'findAllByUser', user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    console.log('findAllByUser:',)

    const locations = await this.prismaService.tb_location.findMany({
      where: {
        is_active: true,
        tb_user_location: {
          some: {
            user_id: this.userId,
          },
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        location_type: true,
        physical_count_type: true,
        description: true,
        is_active: true,
      },
    });

    // Serialize response data
    const serializedLocations = locations.map((location) => LocationByUserResponseSchema.parse(location));

    return Result.ok(serializedLocations);
  }

  @TryCatch
  async getProductInventory(location_id: string, product_id: string, version: string = 'latest'): Promise<any> {
    this.logger.debug(
      { function: 'getProductInventory', location_id, product_id, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    // todo: get product_location reorder , restock

    let reorder_qty = 0.00;
    let restock_qty = 0.00;
    const on_hand_qty = 0.00;
    const on_order_qty = 0.00;
    let min_qty = 0.00;
    let max_qty = 0.00;

    const productLocation = await this.prismaService.tb_product_location.findFirst({
      where: {
        location_id: location_id,
        product_id: product_id,
      },
      select: {
        min_qty: true,
        max_qty: true,
        re_order_qty: true,
        par_qty: true,
      },
    });

    if (productLocation) {
      min_qty = productLocation.min_qty.toNumber();
      max_qty = productLocation.max_qty.toNumber();
      reorder_qty = productLocation.re_order_qty.toNumber();
      restock_qty = productLocation.par_qty.toNumber();
    }

    // // get product_inventory on_hand // mock data random 100 - 1000
    // on_hand_qty = Math.floor(Math.random() * 900) + 100;

    // // get product_inventory on_order // mock data random 100 - 1000
    // on_order_qty = Math.floor(Math.random() * 900) + 100;

    const productInventory: IProductInventoryInfo = {
      on_hand_qty: on_hand_qty,
      on_order_qty: on_order_qty,
      re_order_qty: reorder_qty,
      re_stock_qty: restock_qty,
    };

    return Result.ok(productInventory);
  }

  @TryCatch
  async create(
    data: ICreateLocation,
    version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    // Validate using factory function
    const validationSchema = createLocationCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Business validation: Check for duplicate location
    const foundLocation = await this.prismaService.tb_location.findFirst({
      where: {
        name: data.name,
        location_type: data.location_type,
      },
    });

    if (foundLocation) {
      return Result.error('Location already exists', ErrorCode.ALREADY_EXISTS);
    }

    const location_type = data.location_type as unknown as enum_location_type;

    let count_type =
      data.physical_count_type as unknown as enum_physical_count_type;
    if (location_type === enum_location_type.direct) {
      count_type =
        enum_physical_count_type.no as unknown as enum_physical_count_type;
    }

    const createLocation = await this.prismaService.$transaction(async (tx) => {
      const createLocation = await tx.tb_location.create({
        data: {
          code: data.code,
          name: data.name,
          location_type: location_type,
          physical_count_type: count_type,
          description: data.description ?? null,
          is_active: data.is_active,
          // info: (data.info as object) ?? {},
          delivery_point_id: data.delivery_point_id ?? null,
          created_by_id: this.userId,
        },
      });

      if (data.users?.add) {
        await tx.tb_user_location.createMany({
          data: data.users.add.map((user) => ({
            user_id: user.id,
            location_id: createLocation.id,
            created_by_id: this.userId,
            created_at: new Date().toISOString(),
          })),
        });
      }

      if (data.products?.add) {
        await tx.tb_product_location.createMany({
          data: data.products.add.map((product) => ({
            product_id: product.id,
            location_id: createLocation.id,
            min_qty: product.min_qty ?? 0,
            max_qty: product.max_qty ?? 0,
            re_order_qty: product.re_order_qty ?? 0,
            par_qty: product.par_qty ?? 0,
            created_by_id: this.userId,
            created_at: new Date().toISOString(),
          })),
        });
      }

      return createLocation;
    });

    return Result.ok({ id: createLocation.id });
  }

  @TryCatch
  async update(
    data: IUpdateLocation,
    version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    // Validate using factory function
    const validationSchema = createLocationUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Check if location exists
    const location = await this.prismaService.tb_location.findFirst({
      where: { id: data.id },
    });

    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    // Business validation: Check for duplicate name
    if (data.name) {
      const foundLocation = await this.prismaService.tb_location.findFirst({
        where: {
          name: data.name,
          location_type: data.location_type ?? location.location_type,
          id: {
            not: location.id,
          },
        },
      });

      if (foundLocation) {
        return Result.error('Location already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const location_type =
      data.location_type ??
      (location.location_type as unknown as enum_location_type);
    let count_type =
      data.physical_count_type ??
      (location.physical_count_type as unknown as enum_physical_count_type);

    if (location_type === enum_location_type.direct) {
      count_type =
        enum_physical_count_type.no as unknown as enum_physical_count_type;
    }

    const updateLocation = await this.prismaService.$transaction(async (tx) => {
      const updateLocation = await tx.tb_location.update({
        where: { id: location.id },
        data: {
          code: data.code ?? location.code,
          name: data.name ?? location.name,
          location_type: location_type,
          physical_count_type: count_type,
          description: data.description ?? location.description,
          is_active: data.is_active ?? location.is_active,
          // info: (data.info as object) ?? location.info,
          delivery_point_id:
            data.delivery_point_id ?? location.delivery_point_id,
          updated_by_id: this.userId,
        },
      });

      if (data.users?.add) {
        await tx.tb_user_location.createMany({
          data: data.users.add.map((user) => ({
            user_id: user.id,
            location_id: updateLocation.id,
            created_by_id: this.userId,
            created_at: new Date().toISOString(),
          })),
        });
      }

      if (data.users?.remove) {
        await tx.tb_user_location.deleteMany({
          where: {
            user_id: { in: data.users.remove.map((user) => user.id) },
            location_id: updateLocation.id,
          },
        });
      }

      if (data.products?.add) {
        await tx.tb_product_location.createMany({
          data: data.products.add.map((product) => ({
            product_id: product.id,
            location_id: updateLocation.id,
            min_qty: product.min_qty ?? 0,
            max_qty: product.max_qty ?? 0,
            re_order_qty: product.re_order_qty ?? 0,
            par_qty: product.par_qty ?? 0,
            created_by_id: this.userId,
            created_at: new Date().toISOString(),
          })),
        });
      }

      if (data.products?.update) {
        for (const product of data.products.update) {
          await tx.tb_product_location.updateMany({
            where: {
              product_id: product.id,
              location_id: updateLocation.id,
            },
            data: {
              min_qty: product.min_qty,
              max_qty: product.max_qty,
              re_order_qty: product.re_order_qty,
              par_qty: product.par_qty,
              updated_by_id: this.userId,
            },
          });
        }
      }

      if (data.products?.remove) {
        await tx.tb_product_location.deleteMany({
          where: {
            product_id: {
              in: data.products.remove.map((product) => product.id),
            },
            location_id: updateLocation.id,
          },
        });
      }

      return updateLocation;
    });

    return Result.ok({ id: updateLocation.id });
  }

  @TryCatch
  async delete(
    id: string,
    version: string = 'latest',
  ) {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code, version },
      LocationsService.name,
    );

    const location = await this.prismaService.tb_location.findFirst({
      where: { id },
    });

    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_location.update({
      where: { id: location.id },
      data: {
        is_active: false,
        updated_by_id: this.userId,
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: location.id });
  }
}
