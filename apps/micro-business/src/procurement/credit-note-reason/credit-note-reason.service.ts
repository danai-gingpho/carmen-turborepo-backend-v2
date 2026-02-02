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
  async findAll(paginate: IPaginate): Promise<Result<any>> {
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

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
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
}