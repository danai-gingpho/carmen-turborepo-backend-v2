import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import { ICreateAdjustmentType, IUpdateAdjustmentType } from './interface/adjustment-type.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_USER_ID } from '@/common/constant';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient, Prisma } from '@repo/prisma-shared-schema-tenant';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class AdjustmentTypeService {
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

  private readonly logger: BackendLogger = new BackendLogger(AdjustmentTypeService.name);

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Find a single adjustment type by ID
   * ค้นหาประเภทการปรับปรุงรายการเดียวตาม ID
   * @param id - Adjustment type ID / รหัสประเภทการปรับปรุง
   * @returns Adjustment type detail / รายละเอียดประเภทการปรับปรุง
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      AdjustmentTypeService.name,
    );

    const adjustmentType = await this.prismaService.tb_adjustment_type.findFirst({
      where: {
        id: id,
        is_active: true,
        deleted_at: null,
      },
    });

    if (!adjustmentType) {
      return Result.error('Adjustment type not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(adjustmentType);
  }

  /**
   * Find all adjustment types with pagination
   * ค้นหาประเภทการปรับปรุงทั้งหมดแบบแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of adjustment types / รายการประเภทการปรับปรุงแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      AdjustmentTypeService.name,
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

    const baseWhere = {
      ...q.where(),
      deleted_at: null,
    };

    const pagination = getPaginationParams(q.page, q.perpage);
    const customOrderBy = q.orderBy();
    const hasCustomSort = Array.isArray(customOrderBy)
      ? customOrderBy.length > 0
      : Object.keys(customOrderBy).length > 0;

    const adjustmentTypes = await this.prismaService.tb_adjustment_type.findMany({
      where: baseWhere,
      orderBy: hasCustomSort ? customOrderBy : [{ code: 'asc' }, { name: 'asc' }],
      ...pagination,
    });

    const total = await this.prismaService.tb_adjustment_type.count({ where: baseWhere });

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: adjustmentTypes,
    });
  }

  /**
   * Create a new adjustment type
   * สร้างประเภทการปรับปรุงใหม่
   * @param data - Adjustment type creation data / ข้อมูลสำหรับสร้างประเภทการปรับปรุง
   * @returns Created adjustment type ID / รหัสประเภทการปรับปรุงที่สร้างแล้ว
   */
  @TryCatch
  async create(
    data: ICreateAdjustmentType,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      AdjustmentTypeService.name,
    );

    const findAdjustmentType = await this.prismaService.tb_adjustment_type.findFirst({
      where: {
        code: data.code,
        deleted_at: null,
      },
    });

    if (findAdjustmentType) {
      return Result.error('Adjustment type with this code already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createdAdjustmentType = await this.prismaService.tb_adjustment_type.create({
      data: {
        ...data,
        info: data.info as Prisma.InputJsonValue,
        dimension: data.dimension as unknown as Prisma.InputJsonValue,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createdAdjustmentType.id });
  }

  /**
   * Update an existing adjustment type with duplicate code check
   * อัปเดตประเภทการปรับปรุงที่มีอยู่พร้อมตรวจสอบรหัสซ้ำ
   * @param data - Adjustment type update data / ข้อมูลสำหรับอัปเดตประเภทการปรับปรุง
   * @returns Updated adjustment type ID / รหัสประเภทการปรับปรุงที่อัปเดตแล้ว
   */
  @TryCatch
  async update(
    data: IUpdateAdjustmentType,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      AdjustmentTypeService.name,
    );

    const adjustmentType = await this.prismaService.tb_adjustment_type.findFirst({
      where: {
        id: data.id,
        deleted_at: null,
      },
    });

    if (!adjustmentType) {
      return Result.error('Adjustment type not found', ErrorCode.NOT_FOUND);
    }

    // Check if code is being updated and if it conflicts with existing records
    if (data.code && data.code !== adjustmentType.code) {
      const existingWithCode = await this.prismaService.tb_adjustment_type.findFirst({
        where: {
          code: data.code,
          deleted_at: null,
          id: { not: data.id },
        },
      });

      if (existingWithCode) {
        return Result.error('Adjustment type with this code already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const updatedAdjustmentType = await this.prismaService.tb_adjustment_type.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        info: data.info as Prisma.InputJsonValue,
        dimension: data.dimension as unknown as Prisma.InputJsonValue,
        updated_by_id: this.userId,
      },
    });

    return Result.ok({ id: updatedAdjustmentType.id });
  }

  /**
   * Soft delete an adjustment type
   * ลบประเภทการปรับปรุงแบบ soft delete
   * @param id - Adjustment type ID / รหัสประเภทการปรับปรุง
   * @returns Deleted adjustment type ID / รหัสประเภทการปรับปรุงที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      AdjustmentTypeService.name,
    );

    const adjustmentType = await this.prismaService.tb_adjustment_type.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!adjustmentType) {
      return Result.error('Adjustment type not found', ErrorCode.NOT_FOUND);
    }

    // Soft delete
    await this.prismaService.tb_adjustment_type.update({
      where: {
        id: id,
      },
      data: {
        is_active: false,
        deleted_by_id: this.userId,
        deleted_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id });
  }
}
