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

  /**
   * Find a single tax profile by ID
   * ค้นหารายการโปรไฟล์ภาษีเดียวตาม ID
   * @param id - Tax profile ID / ID ของโปรไฟล์ภาษี
   * @returns Tax profile detail or error if not found / รายละเอียดโปรไฟล์ภาษี หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
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

  /**
   * Find a single tax profile by name
   * ค้นหารายการโปรไฟล์ภาษีเดียวตามชื่อ
   * @param name - Tax profile name / ชื่อของโปรไฟล์ภาษี
   * @returns Tax profile detail or error if not found / รายละเอียดโปรไฟล์ภาษี หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async findOneByName(
    name: string,
  ): Promise<Result<unknown>> {
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

  /**
   * Find all tax profiles with pagination
   * ค้นหารายการโปรไฟล์ภาษีทั้งหมดพร้อมการแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of tax profiles / รายการโปรไฟล์ภาษีพร้อมการแบ่งหน้า
   */
  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
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
    const customOrderBy = q.orderBy();
    const hasCustomSort = Array.isArray(customOrderBy)
      ? customOrderBy.length > 0
      : Object.keys(customOrderBy).length > 0;

    const prismaParams = {
      where: q.where(),
      orderBy: hasCustomSort ? customOrderBy : [{ name: 'asc' as const }, { tax_rate: 'asc' as const }],
      ...pagination,
    };
    const data = await this.prismaService.tb_tax_profile.findMany(prismaParams);

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


  /**
   * Find multiple tax profiles by IDs
   * ค้นหารายการโปรไฟล์ภาษีหลายรายการตาม ID
   * @param ids - Array of tax profile IDs / รายการ ID ของโปรไฟล์ภาษี
   * @returns List of tax profiles / รายการโปรไฟล์ภาษี
   */
  @TryCatch
  async findAllById(
    ids: string[],
  ): Promise<Result<unknown>> {
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

  /**
   * Create a new tax profile
   * สร้างโปรไฟล์ภาษีใหม่
   * @param data - Tax profile creation data / ข้อมูลการสร้างโปรไฟล์ภาษี
   * @returns Created tax profile ID or error if duplicate / ID ของโปรไฟล์ภาษีที่สร้างขึ้น หรือข้อผิดพลาดหากซ้ำ
   */
  @TryCatch
  async create(
    data: ICreateTaxProfile,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      'create',
    );

    if (typeof data.name === 'string') data.name = data.name.trim();

    const findOne = await this.prismaService.tb_tax_profile.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        deleted_at: null,
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

    return Result.ok({ id: id });
  }

  /**
   * Update an existing tax profile
   * อัปเดตโปรไฟล์ภาษีที่มีอยู่
   * @param id - Tax profile ID / ID ของโปรไฟล์ภาษี
   * @param data - Tax profile update data / ข้อมูลการอัปเดตโปรไฟล์ภาษี
   * @returns Updated tax profile ID or error if not found / ID ของโปรไฟล์ภาษีที่อัปเดต หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async update(
    id: string,
    data: IUpdateTaxProfile,
  ): Promise<Result<unknown>> {
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

    if (typeof data.name === 'string') data.name = data.name.trim();

    if (data.name && data.name.toLowerCase() !== gbl_taxProfile.name.toLowerCase()) {
      const duplicate = await this.prismaService.tb_tax_profile.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          deleted_at: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return Result.error('Tax profile name already exists', ErrorCode.ALREADY_EXISTS);
      }
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

  /**
   * Delete a tax profile (soft delete)
   * ลบโปรไฟล์ภาษี (ลบแบบซอฟต์)
   * @param id - Tax profile ID / ID ของโปรไฟล์ภาษี
   * @returns Empty object on success or error if not found / อ็อบเจกต์ว่างเมื่อสำเร็จ หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
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
