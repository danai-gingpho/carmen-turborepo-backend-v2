import QueryParams from '@/libs/paginate.query'
import { IPaginate } from '@/common/shared-interface/paginate.interface'
import { TenantService } from "@/tenant/tenant.service";
import { HttpStatus, HttpException, Injectable } from "@nestjs/common";
import { isUUID } from 'class-validator';
import { PrismaClient } from "@repo/prisma-shared-schema-tenant";
import { BackendLogger } from "@/common/helpers/backend.logger";
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  TryCatch,
  Result,
  ErrorCode,
  CreditNoteReasonDetailResponseSchema,
  CreditNoteReasonListItemResponseSchema,
} from '@/common';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class CreditNoteReasonService {
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

  private readonly logger: BackendLogger = new BackendLogger(CreditNoteReasonService.name);

  /**
   * Initialize the Prisma service for tenant-specific database access
   * เริ่มต้นบริการ Prisma สำหรับการเข้าถึงฐานข้อมูลเฉพาะผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
   */
  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._bu_code = bu_code;
    this._userId = userId;
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
   * Find all credit note reasons with pagination, search, and filtering
   * ค้นหาเหตุผลใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้า การค้นหา และการกรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of credit note reasons / รายการเหตุผลใบลดหนี้ที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate }, CreditNoteReasonService.name);
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

    const creditNoteReasons = await this.prismaService.tb_credit_note_reason.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_credit_note_reason.count({
      where: q.where(),
    });

    const serializedCreditNoteReasons = creditNoteReasons.map((item) =>
      CreditNoteReasonListItemResponseSchema.parse(item)
    );

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedCreditNoteReasons,
    });
  }

  /**
   * Find a single credit note reason by ID
   * ค้นหาเหตุผลใบลดหนี้รายการเดียวตาม ID
   * @param id - Credit note reason ID / ID ของเหตุผลใบลดหนี้
   * @returns Credit note reason data / ข้อมูลเหตุผลใบลดหนี้
   */
  @TryCatch
  async create(data: { name: string; description?: string; note?: string; info?: unknown; dimension?: unknown }): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteReasonService.name,
    );

    if (typeof data.name === 'string') data.name = data.name.trim();

    const foundCreditNoteReason = await this.prismaService.tb_credit_note_reason.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        deleted_at: null,
      },
    });

    if (foundCreditNoteReason) {
      return Result.error('Credit note reason already exists', ErrorCode.ALREADY_EXISTS);
    }

    const creditNoteReason = await this.prismaService.tb_credit_note_reason.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: creditNoteReason.id });
  }

  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code }, CreditNoteReasonService.name);

    const creditNoteReason = await this.prismaService.tb_credit_note_reason.findFirst({
      where: { id: id },
    });

    if (!creditNoteReason) {
      return Result.error('Credit note reason not found', ErrorCode.NOT_FOUND);
    }

    const serializedCreditNoteReason = CreditNoteReasonDetailResponseSchema.parse(creditNoteReason);

    return Result.ok(serializedCreditNoteReason);
  }

  @TryCatch
  async update(id: string, data: { name?: string; description?: string; note?: string; info?: unknown; dimension?: unknown }): Promise<Result<unknown>> {
    this.logger.debug({ function: 'update', id, data, user_id: this.userId, tenant_id: this.bu_code }, CreditNoteReasonService.name);

    const creditNoteReason = await this.prismaService.tb_credit_note_reason.findFirst({
      where: { id: id },
    });

    if (!creditNoteReason) {
      return Result.error('Credit note reason not found', ErrorCode.NOT_FOUND);
    }

    if (typeof data.name === 'string') data.name = data.name.trim();

    if (data.name && data.name.toLowerCase() !== creditNoteReason.name.toLowerCase()) {
      const duplicate = await this.prismaService.tb_credit_note_reason.findFirst({
        where: {
          name: { equals: data.name, mode: 'insensitive' },
          deleted_at: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return Result.error('Credit note reason already exists', ErrorCode.ALREADY_EXISTS);
      }
    }

    const updated = await this.prismaService.tb_credit_note_reason.update({
      where: { id: id },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updated.id });
  }

  @TryCatch
  async patch(id: string, data: { name?: string; description?: string; note?: string; info?: unknown; dimension?: unknown }): Promise<Result<unknown>> {
    this.logger.debug({ function: 'patch', id, data, user_id: this.userId, tenant_id: this.bu_code }, CreditNoteReasonService.name);

    const creditNoteReason = await this.prismaService.tb_credit_note_reason.findFirst({
      where: { id: id },
    });

    if (!creditNoteReason) {
      return Result.error('Credit note reason not found', ErrorCode.NOT_FOUND);
    }

    const updated = await this.prismaService.tb_credit_note_reason.update({
      where: { id: id },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updated.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code }, CreditNoteReasonService.name);

    const creditNoteReason = await this.prismaService.tb_credit_note_reason.findFirst({
      where: { id: id },
    });

    if (!creditNoteReason) {
      return Result.error('Credit note reason not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_credit_note_reason.update({
      where: { id: id },
      data: {
        deleted_by_id: this.userId,
        deleted_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id });
  }
}
