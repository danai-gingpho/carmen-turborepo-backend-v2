import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateExtraCostType,
  IUpdateExtraCostType,
} from './interface/extra_cost_type.interface';
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
  ExtraCostTypeDetailResponseSchema,
  ExtraCostTypeListItemResponseSchema,
} from '@/common';

@Injectable()
export class ExtraCostTypeService {
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
    ExtraCostTypeService.name,
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
   * Find a single extra cost type by ID
   * ค้นหาประเภทค่าใช้จ่ายเพิ่มเติมรายการเดียวตาม ID
   * @param id - Extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติม
   * @returns Extra cost type detail / รายละเอียดประเภทค่าใช้จ่ายเพิ่มเติม
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      ExtraCostTypeService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const extraCostType = await this.prismaService.tb_extra_cost_type.findFirst({
      where: {
        id,
      },
    });
    if (!extraCostType) {
      return Result.error('Extra cost type not found', ErrorCode.NOT_FOUND);
    }

    const serializedExtraCostType = ExtraCostTypeDetailResponseSchema.parse(extraCostType);
    return Result.ok(serializedExtraCostType);
  }

  /**
   * Find all extra cost types with pagination
   * ค้นหาประเภทค่าใช้จ่ายเพิ่มเติมทั้งหมดแบบแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of extra cost types / รายการประเภทค่าใช้จ่ายเพิ่มเติมแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      ExtraCostTypeService.name,
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

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);
    const pagination = getPaginationParams(q.page, q.perpage);
    const customOrderBy = q.orderBy();
    const hasCustomSort = Array.isArray(customOrderBy)
      ? customOrderBy.length > 0
      : Object.keys(customOrderBy).length > 0;

    const extraCostType = await this.prismaService.tb_extra_cost_type.findMany({
      where: q.where(),
      orderBy: hasCustomSort ? customOrderBy : [{ name: 'asc' }],
      ...pagination,
    });

    const total = await this.prismaService.tb_extra_cost_type.count({ where: q.where() });

    const serializedExtraCostTypes = extraCostType.map((item) => ExtraCostTypeListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedExtraCostTypes,
    });
  }

  /**
   * Create a new extra cost type
   * สร้างประเภทค่าใช้จ่ายเพิ่มเติมใหม่
   * @param data - Extra cost type creation data / ข้อมูลสำหรับสร้างประเภทค่าใช้จ่ายเพิ่มเติม
   * @returns Created extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติมที่สร้างแล้ว
   */
  @TryCatch
  async create(data: ICreateExtraCostType): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      ExtraCostTypeService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    if (typeof data.name === 'string') data.name = data.name.trim();

    const foundExtraCostType = await this.prismaService.tb_extra_cost_type.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        deleted_at: null,
      },
    });

    if (foundExtraCostType) {
      return Result.error('Extra cost type already exists', ErrorCode.ALREADY_EXISTS);
    }

    const extraCostType = await this.prismaService.tb_extra_cost_type.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: extraCostType.id });
  }

  /**
   * Update an existing extra cost type with duplicate name check
   * อัปเดตประเภทค่าใช้จ่ายเพิ่มเติมที่มีอยู่พร้อมตรวจสอบชื่อซ้ำ
   * @param data - Extra cost type update data / ข้อมูลสำหรับอัปเดตประเภทค่าใช้จ่ายเพิ่มเติม
   * @returns Updated extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติมที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: IUpdateExtraCostType): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      ExtraCostTypeService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const extraCostType = await this.prismaService.tb_extra_cost_type.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!extraCostType) {
      return Result.error('Extra cost type not found', ErrorCode.NOT_FOUND);
    }

    if (typeof data.name === 'string') data.name = data.name.trim();

    if (data.name) {
      const foundExtraCostType = await this.prismaService.tb_extra_cost_type.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          deleted_at: null,
          id: {
            not: data.id,
          },
        },
      });

      if (foundExtraCostType) {
        return Result.error('Extra cost type already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const updatedExtraCostType = await this.prismaService.tb_extra_cost_type.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updatedExtraCostType.id });
  }

  /**
   * Soft delete an extra cost type
   * ลบประเภทค่าใช้จ่ายเพิ่มเติมแบบ soft delete
   * @param id - Extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติม
   * @returns Deleted extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติมที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      ExtraCostTypeService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const extraCostType = await this.prismaService.tb_extra_cost_type.findFirst({
      where: {
        id,
      },
    });

    if (!extraCostType) {
      return Result.error('Extra cost type not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_extra_cost_type.update({
      where: {
        id,
      }, data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
        is_active: false,
      },
    });

    return Result.ok({ id });
  }
}
