import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import { ICreateUnits, IUpdateUnits } from './interface/units.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { TryCatch, Result, ErrorCode, UnitResponseSchema, UnitListItemResponseSchema } from '@/common';

@Injectable()
export class UnitsService {
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

  private readonly logger: BackendLogger = new BackendLogger(UnitsService.name);

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      UnitsService.name,
    );

    const unit = await this.prismaService.tb_unit.findFirst({
      where: {
        id: id,
        is_active: true,
      },
    });

    if (!unit) {
      return Result.error('Unit not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedUnit = UnitResponseSchema.parse(unit);

    return Result.ok(serializedUnit);
  }

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      UnitsService.name,
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
    const units = await this.prismaService.tb_unit.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_unit.count({ where: q.where() });

    // Serialize response data
    const serializedUnits = units.map((unit) => UnitListItemResponseSchema.parse(unit));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedUnits,
    });
  }

  @TryCatch
  async findAllById(
    ids: string[],
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllById', ids, user_id: this.userId, tenant_id: this.bu_code },
      UnitsService.name,
    );

    const units = await this.prismaService.tb_unit.findMany({
      where: { id: { in: ids } },
    })

    // Serialize response data
    const serializedUnits = units.map((unit) => UnitListItemResponseSchema.parse(unit));

    return Result.ok(serializedUnits);
  }

  @TryCatch
  async create(
    data: ICreateUnits,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      UnitsService.name,
    );
    const findUnit = await this.prismaService.tb_unit.findFirst({
      where: {
        name: data.name,
      },
    });

    if (findUnit) {
      return Result.error('Unit already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createdUnit = await this.prismaService.tb_unit.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createdUnit.id });
  }

  @TryCatch
  async update(
    data: IUpdateUnits,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      UnitsService.name,
    );

    const unit = await this.prismaService.tb_unit.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!unit) {
      return Result.error('Unit not found', ErrorCode.NOT_FOUND);
    }

    const updatedUnit = await this.prismaService.tb_unit.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
      },
    });

    return Result.ok({ id: updatedUnit.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code }, UnitsService.name);

    const unit = await this.prismaService.tb_unit.findFirst({
      where: {
        id: id,
      },
    });

    if (!unit) {
      return Result.error('Unit not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_unit.update({
      where: {
        id: id,
      }, data: {
        is_active: false,
        deleted_by_id: this.userId,
        deleted_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id });
  }
}
