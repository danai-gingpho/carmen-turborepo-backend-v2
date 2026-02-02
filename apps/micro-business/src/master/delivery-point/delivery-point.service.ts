import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import {
  TryCatch,
  Result,
  ErrorCode,
  DeliveryPointResponseSchema,
  DeliveryPointListItemResponseSchema,
} from '@/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateDeliveryPoint,
  IUpdateDeliveryPoint,
} from './interface/delivery-point.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import {
  ERROR_MISSING_BU_CODE,
  ERROR_MISSING_TENANT_ID,
  ERROR_MISSING_USER_ID,
} from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

@Injectable()
export class DeliveryPointService {
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
    DeliveryPointService.name,
  );

  async initializePrismaService(
    bu_code: string,
    userId: string,
  ): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(
      bu_code,
      userId,
    );
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

  constructor(private readonly tenantService: TenantService) { }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      DeliveryPointService.name,
    );

    const deliveryPoint = await this.prismaService.tb_delivery_point.findFirst(
      {
        where: {
          id,
          is_active: true,
        },
      },
    );

    if (!deliveryPoint) {
      return Result.error('Delivery point not found', ErrorCode.NOT_FOUND);
    }

    const serializedDeliveryPoint = DeliveryPointResponseSchema.parse(deliveryPoint);
    return Result.ok(serializedDeliveryPoint);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      DeliveryPointService.name,
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
    const deliveryPoints = await this.prismaService.tb_delivery_point.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_delivery_point.count({
      where: q.where(),
    });

    const serializedDeliveryPoints = deliveryPoints.map((item) => DeliveryPointListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedDeliveryPoints,
    });
  }

  @TryCatch
  async findAllById(ids: string[]): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllById',
        ids,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      DeliveryPointService.name,
    );

    const deliveryPoints = await this.prismaService.tb_delivery_point.findMany({
      where: {
        id: { in: ids },
      },
    });

    const serializedDeliveryPoints = deliveryPoints.map((item) => DeliveryPointListItemResponseSchema.parse(item));
    return Result.ok(serializedDeliveryPoints);
  }

  @TryCatch
  async create(data: ICreateDeliveryPoint): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      DeliveryPointService.name,
    );

    const foundDeliveryPoint =
      await this.prismaService.tb_delivery_point.findFirst({
        where: {
          name: data.name,
          is_active: true,
        },
      });

    if (foundDeliveryPoint) {
      return Result.error('Delivery point already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createDeliveryPoint =
      await this.prismaService.tb_delivery_point.create({
        data: {
          ...data,
          created_by_id: this.userId,
        },
      });

    return Result.ok({ id: createDeliveryPoint.id });
  }

  @TryCatch
  async update(data: IUpdateDeliveryPoint): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      DeliveryPointService.name,
    );

    const deliveryPoint = await this.prismaService.tb_delivery_point.findFirst(
      {
        where: {
          id: data.id,
          is_active: true,
        },
      },
    );

    if (!deliveryPoint) {
      return Result.error('Delivery point not found', ErrorCode.NOT_FOUND);
    }

    const updateDeliveryPoint =
      await this.prismaService.tb_delivery_point.update({
        where: {
          id: data.id,
        },
        data: {
          ...data,
          updated_by_id: this.userId,
          updated_at: new Date().toISOString(),
        },
      });

    return Result.ok({ id: updateDeliveryPoint.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      DeliveryPointService.name,
    );

    const deliveryPoint = await this.prismaService.tb_delivery_point.findFirst(
      {
        where: {
          id: id,
          // is_active: true,
        },
      },
    );

    if (!deliveryPoint) {
      return Result.error('Delivery point not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_delivery_point.update({
      where: {
        id: id,
      },
      data: {
        is_active: false,
        updated_by_id: this.userId,
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id });
  }
}
