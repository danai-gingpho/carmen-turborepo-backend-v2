import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateVendorBusinessType,
  IUpdateVendorBusinessType,
} from './interface/vendor_business_type.interface';
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
  VendorBusinessTypeResponseSchema,
  VendorBusinessTypeListItemResponseSchema,
} from '@/common';

@Injectable()
export class VendorBusinessTypeService {
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

  private readonly logger: BackendLogger = new BackendLogger(
    VendorBusinessTypeService.name,
  );

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Find a single vendor business type by ID
   * ค้นหาประเภทธุรกิจผู้ขายรายการเดียวตาม ID
   * @param id - Vendor business type ID / รหัสประเภทธุรกิจผู้ขาย
   * @returns Vendor business type detail / รายละเอียดประเภทธุรกิจผู้ขาย
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      VendorBusinessTypeService.name,
    );

    const vendorBusinessType = await this.prismaService.tb_vendor_business_type.findFirst({
      where: {
        id,
      },
    });

    if (!vendorBusinessType) {
      return Result.error('Vendor business type not found', ErrorCode.NOT_FOUND);
    }

    const serializedVendorBusinessType = VendorBusinessTypeResponseSchema.parse(vendorBusinessType);
    return Result.ok(serializedVendorBusinessType);
  }

  /**
   * Find all vendor business types with pagination
   * ค้นหาประเภทธุรกิจผู้ขายทั้งหมดแบบแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of vendor business types / รายการประเภทธุรกิจผู้ขายแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      VendorBusinessTypeService.name,
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

    const vendorBusinessTypes = await this.prismaService.tb_vendor_business_type.findMany({
      where: q.where(),
      orderBy: hasCustomSort ? customOrderBy : [{ name: 'asc' }],
      ...pagination,
    });

    const total = await this.prismaService.tb_vendor_business_type.count({ where: q.where() });

    const serializedVendorBusinessTypes = vendorBusinessTypes.map((item) => VendorBusinessTypeListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedVendorBusinessTypes,
    });
  }

  /**
   * Create a new vendor business type
   * สร้างประเภทธุรกิจผู้ขายใหม่
   * @param data - Vendor business type creation data / ข้อมูลสำหรับสร้างประเภทธุรกิจผู้ขาย
   * @returns Created vendor business type ID / รหัสประเภทธุรกิจผู้ขายที่สร้างแล้ว
   */
  @TryCatch
  async create(
    data: ICreateVendorBusinessType,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      VendorBusinessTypeService.name,
    );

    const foundVendorBusinessType =
      await this.prismaService.tb_vendor_business_type.findFirst({
        where: {
          name: data.name,
        },
      });

    if (foundVendorBusinessType) {
      return Result.error('Vendor business type already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createVendorBusinessType =
      await this.prismaService.tb_vendor_business_type.create({
        data: {
          ...data,
          created_by_id: this.userId,
        },
      });

    return Result.ok({ id: createVendorBusinessType.id });
  }

  /**
   * Update an existing vendor business type
   * อัปเดตประเภทธุรกิจผู้ขายที่มีอยู่
   * @param data - Vendor business type update data / ข้อมูลสำหรับอัปเดตประเภทธุรกิจผู้ขาย
   * @returns Updated vendor business type ID / รหัสประเภทธุรกิจผู้ขายที่อัปเดตแล้ว
   */
  @TryCatch
  async update(
    data: IUpdateVendorBusinessType,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      VendorBusinessTypeService.name,
    );

    const vendorBusinessType = await this.prismaService.tb_vendor_business_type.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!vendorBusinessType) {
      return Result.error('Vendor business type not found', ErrorCode.NOT_FOUND);
    }

    const updateVendorBusinessType =
      await this.prismaService.tb_vendor_business_type.update({
        where: {
          id: data.id,
        },
        data: {
          ...data,
          updated_by_id: this.userId,
        },
      });

    return Result.ok({ id: updateVendorBusinessType.id });
  }

  /**
   * Soft delete a vendor business type
   * ลบประเภทธุรกิจผู้ขายแบบ soft delete
   * @param id - Vendor business type ID / รหัสประเภทธุรกิจผู้ขาย
   * @returns null on success / null เมื่อสำเร็จ
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code }, VendorBusinessTypeService.name);

    const vendorBusinessType = await this.prismaService.tb_vendor_business_type.findFirst({
      where: {
        id,
      },
    });

    if (!vendorBusinessType) {
      return Result.error('Vendor business type not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_vendor_business_type.update({
      where: { id }, data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
        is_active: false,
      },
    });

    return Result.ok(null);
  }
}
