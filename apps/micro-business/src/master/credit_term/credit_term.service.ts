import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateCreditTerm,
  IUpdateCreditTerm,
} from './interface/credit_term.interface';
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
  CreditTermResponseSchema,
  CreditTermListItemResponseSchema,
} from '@/common';


@Injectable()
export class CreditTermService {
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
    CreditTermService.name,
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
  async findOne(
    id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code, version },
      CreditTermService.name,
    );

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId)
    const creditTerm = await this.prismaService.tb_credit_term
      .findFirst({
        where: {
          id,
        },
      })
      .then((res) => {
        if (!res) return null;
        return {
          ...res,
          value: Number(res.value),
          is_active: Boolean(res.is_active),
        };
      });

    if (!creditTerm) {
      return Result.error('Credit term not found', ErrorCode.NOT_FOUND);
    }

    const serializedCreditTerm = CreditTermResponseSchema.parse(creditTerm);
    return Result.ok(serializedCreditTerm);
  }

  @TryCatch
  async findAll(
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate, version },
      CreditTermService.name,
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

    const data = await this.prismaService.tb_credit_term.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const creditTerms = data.map((item) => ({
      ...item,
      value: Number(item.value),
      is_active: Boolean(item.is_active),
    }));

    const total = await this.prismaService.tb_credit_term.count({ where: q.where() });

    const serializedCreditTerms = creditTerms.map((item) => CreditTermListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedCreditTerms,
    });
  }

  @TryCatch
  async create(
    data: ICreateCreditTerm,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code, version },
      CreditTermService.name,
    );

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const foundCreditTerm = await this.prismaService.tb_credit_term.findFirst({
      where: {
        name: data.name,
      },
    });

    if (foundCreditTerm) {
      return Result.error('Credit term already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createCreditTerm = await this.prismaService.tb_credit_term.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createCreditTerm.id });
  }

  @TryCatch
  async update(
    data: IUpdateCreditTerm,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code, version },
      CreditTermService.name,
    );

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const creditTerm = await this.prismaService.tb_credit_term.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!creditTerm) {
      return Result.error('Credit term not found', ErrorCode.NOT_FOUND);
    }

    if (data.name) {
      const foundCreditTerm = await this.prismaService.tb_credit_term.findFirst({
        where: {
          name: data.name,
          id: {
            not: data.id,
          },
        },
      });

      if (foundCreditTerm) {
        return Result.error('Credit term already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const updateCreditTerm = await this.prismaService.tb_credit_term.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
      },
    });

    return Result.ok({ id: updateCreditTerm.id });
  }

  @TryCatch
  async delete(
    id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code, version },
      CreditTermService.name,
    );

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const creditTerm = await this.prismaService.tb_credit_term.findFirst({
      where: {
        id,
      },
    });

    if (!creditTerm) {
      return Result.error('Credit term not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_credit_term.update({
      where: {
        id: id,
      },
      data: {
        deleted_at: new Date().toISOString(),
        updated_by_id: this.userId,
      },
    });

    return Result.ok({ id });
  }
}
