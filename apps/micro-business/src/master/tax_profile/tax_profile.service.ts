import { find } from 'rxjs';
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateTaxProfile,
  IUpdateTaxProfile,
} from './interface/tax_profile.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { v4 as uuidv4 } from 'uuid';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import getPaginationParams from '@/common/helpers/pagination.params';
import { TryCatch, Result, ErrorCode, TaxProfileResponseSchema, TaxProfileListItemResponseSchema } from '@/common';

@Injectable()
export class TaxProfileService {
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
    TaxProfileService.name,
  );
  constructor(
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      TaxProfileService.name,
    );

    const gbl_taxProfile = await this.prismaService.tb_tax_profile.findFirst({
      where: {
        id: id,
      },
    });

    if (!gbl_taxProfile) {
      return Result.error('Tax profile not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedTaxProfile = TaxProfileResponseSchema.parse({
      ...gbl_taxProfile,
      tax_rate: Number(gbl_taxProfile.tax_rate),
    });

    return Result.ok(serializedTaxProfile);
  }

  @TryCatch
  async findOneByName(
    name: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOneByName', name, user_id: this.userId, tenant_id: this.bu_code },
      'findOneByName',
    );

    const gbl_taxProfile = await this.prismaService.tb_tax_profile.findFirst({
      where: {
        name: name,
      },
    });

    if (!gbl_taxProfile) {
      return Result.error('Tax profile not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedTaxProfile = TaxProfileResponseSchema.parse({
      ...gbl_taxProfile,
      tax_rate: Number(gbl_taxProfile.tax_rate),
    });

    return Result.ok(serializedTaxProfile);
  }

  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      'findAll',
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
    const prismaParams = {
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    };
    console.log('Prisma findMany params:', JSON.stringify(prismaParams, null, 2));
    const data = await this.prismaService.tb_tax_profile.findMany(prismaParams);

    console.log('data:', data)


    const total = await this.prismaService.tb_tax_profile.count({ where: q.where() });

    // Serialize response data
    const serializedTaxProfiles = data.map((item) => TaxProfileListItemResponseSchema.parse({
      ...item,
      tax_rate: Number(item.tax_rate),
    }));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedTaxProfiles,
    });
  }


  @TryCatch
  async findAllById(
    ids: string[],
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllById', ids, user_id: this.userId, tenant_id: this.bu_code },
      'findAllById',
    );

    const gbl_taxProfile = await this.prismaService.tb_tax_profile.findMany({
      where: {
        id: {
          in: ids,
        },
      }
    });

    if (!gbl_taxProfile) {
      return Result.ok([]);
    }

    // Serialize response data
    const serializedTaxProfiles = gbl_taxProfile.map((item) => TaxProfileListItemResponseSchema.parse({
      ...item,
      tax_rate: Number(item.tax_rate),
    }));

    return Result.ok(serializedTaxProfiles);
  }

  @TryCatch
  async create(
    data: ICreateTaxProfile,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      'create',
    );

    const findOne = await this.prismaService.tb_tax_profile.findFirst({
      where: {
        name: data.name,
      },
    });

    if (findOne) {
      return Result.error('Tax profile name already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createdTaxProfile = await this.prismaService.tb_tax_profile.create({
      data: {
        name: data.name,
        tax_rate: data.tax_rate,
        is_active: data.is_active,
        created_by_id: this.userId,
        created_at: new Date().toISOString(),
      },
    });

    const id = createdTaxProfile.id;

    console.log(id);

    return Result.ok({ id: id });
  }

  @TryCatch
  async update(
    id: string,
    data: IUpdateTaxProfile,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', id, data, user_id: this.userId, tenant_id: this.bu_code },
      'update',
    );

    const taxProfile = {
      id: id,
      name: data.name,
      tax_rate: data.tax_rate,
      is_active: data.is_active,
    };

    const gbl_taxProfile = await this.prismaService.tb_tax_profile.findFirst({
      where: {
        id: id,
      },
    });

    if (!gbl_taxProfile) {
      return Result.error('Tax profile not found', ErrorCode.NOT_FOUND);
    }

    const updatedTaxProfile = await this.prismaService.tb_tax_profile.update({
      where: { id: id },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: taxProfile.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code }, 'delete');

    const gbl_taxProfile = await this.prismaService.tb_tax_profile.findFirst({
      where: {
        id: id,
      },
    });

    if (!gbl_taxProfile) {
      return Result.error('Tax profile not found', ErrorCode.NOT_FOUND);
    }

    // update deleted_at
    const updatedTaxProfile = await this.prismaService.tb_tax_profile.update({
      where: { id: id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: id });
  }
}
