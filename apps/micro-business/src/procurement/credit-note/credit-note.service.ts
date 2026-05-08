import { HttpStatus, HttpException, Inject, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaClient, enum_credit_note_doc_status } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { TenantService } from '@/tenant/tenant.service';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { CommonLogic } from '@/common/common.logic';
import { getPattern } from '@/common/common.helper';
import { format } from 'date-fns';
import { CreditNote } from './dto/credit-note.dto';
import { BackendLogger } from '@/common/helpers/backend.logger';
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  TryCatch,
  Result,
  ErrorCode,
  CreditNoteDetailResponseSchema,
  CreditNoteListItemResponseSchema,
} from '@/common';
import {
  renderViaMicroReport,
  formatReportDate,
} from '@/common/print-report.helper';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class CreditNoteService {
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
    CreditNoteService.name,
  );

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
    private readonly commonLogic: CommonLogic,
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) { }

  /**
   * Find all credit notes with pagination, search, and filtering
   * ค้นหาใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้า การค้นหา และการกรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of credit notes / รายการใบลดหนี้ที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      CreditNoteService.name,
    );
    const defaultSearchFields = ['cn_no', 'vendor_name', 'description'];

    // Separate computed fields from sort params before passing to QueryParams
    const computedSortFields = ['total_amount', 'base_total_amount', 'net_amount', 'base_net_amount'];
    const sortParams = paginate.sort ?? [];
    const computedSorts: { field: string; order: 'asc' | 'desc' }[] = [];
    const prismaSorts: string[] = [];

    for (const s of sortParams) {
      const [field, order] = s.split(':');
      const trimmedField = field?.trim();
      if (computedSortFields.includes(trimmedField)) {
        computedSorts.push({ field: trimmedField, order: order === 'desc' ? 'desc' : 'asc' });
      } else {
        prismaSorts.push(s);
      }
    }

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      prismaSorts,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const creditNotes = await this.prismaService.tb_credit_note.findMany({
      select: {
        id: true,
        cn_no: true,
        cn_date: true,
        credit_note_type: true,
        doc_status: true,
        description: true,
        vendor_name: true,
        cn_reason_name: true,
        cn_reason_description: true,
        currency_code: true,
        exchange_rate: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        deleted_at: true,
        deleted_by_id: true,
        tb_credit_note_detail: {
          select: {
            net_amount: true,
            base_net_amount: true,
            total_price: true,
            base_total_price: true,
          },
        },
      },
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_credit_note.count({
      where: q.where(),
    });

    const transformedCreditNotes = creditNotes.map((cn) => {
      let net_amount = 0;
      let base_net_amount = 0;
      let total_amount = 0;
      let base_total_amount = 0;
      for (const detail of cn.tb_credit_note_detail) {
        net_amount += Number(detail.net_amount || 0);
        base_net_amount += Number(detail.base_net_amount || 0);
        total_amount += Number(detail.total_price || 0);
        base_total_amount += Number(detail.base_total_price || 0);
      }
      return {
        id: cn.id,
        cn_no: cn.cn_no,
        cn_date: cn.cn_date,
        credit_note_type: cn.credit_note_type,
        doc_status: cn.doc_status,
        description: cn.description,
        vendor_name: cn.vendor_name,
        cn_reason_name: cn.cn_reason_name,
        cn_reason_description: cn.cn_reason_description,
        currency_code: cn.currency_code,
        exchange_rate: Number(cn.exchange_rate),
        net_amount,
        base_net_amount,
        total_amount,
        base_total_amount,
        created_at: cn.created_at,
        created_by_id: cn.created_by_id,
        updated_at: cn.updated_at,
        updated_by_id: cn.updated_by_id,
        deleted_at: cn.deleted_at,
        deleted_by_id: cn.deleted_by_id,
      };
    });

    // Apply in-memory sorting for computed fields
    if (computedSorts.length > 0) {
      transformedCreditNotes.sort((a, b) => {
        for (const { field, order } of computedSorts) {
          const aVal = a[field as keyof typeof a] as number;
          const bVal = b[field as keyof typeof b] as number;
          if (aVal !== bVal) {
            return order === 'asc' ? aVal - bVal : bVal - aVal;
          }
        }
        return 0;
      });
    }

    const serializedCreditNotes = transformedCreditNotes.map((item) => CreditNoteListItemResponseSchema.parse(item));

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedCreditNotes,
    });
  }

  /**
   * Find a single credit note by ID with its details
   * ค้นหาใบลดหนี้รายการเดียวตาม ID พร้อมรายละเอียด
   * @param id - Credit note ID / ID ของใบลดหนี้
   * @returns Credit note data with details / ข้อมูลใบลดหนี้พร้อมรายละเอียด
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const res = await this.prismaService.tb_credit_note.findFirst({
      where: { id },
      include: {
        tb_vendor: true,
        tb_currency: true,
        tb_good_received_note: true,
        tb_credit_note_reason: true,
        tb_credit_note_comment: {
          where: { deleted_at: null },
          orderBy: { created_at: 'asc' },
        },
        tb_credit_note_detail: {
          where: { deleted_at: null },
          orderBy: { sequence_no: 'asc' },
          include: {
            tb_product: true,
            tb_tax_profile: true,
            tb_location: true,
            tb_inventory_transaction: true,
            tb_credit_note_detail_comment: {
              where: { deleted_at: null },
              orderBy: { created_at: 'asc' },
            },
          },
        },
      },
    });

    if (!res) {
      return Result.error('Credit note not found', ErrorCode.NOT_FOUND);
    }

    const creditNote = JSON.parse(JSON.stringify({
      ...res,
      pricelist_price: Number(res.pricelist_price ?? 0),
      exchange_rate: Number(res.exchange_rate ?? 0),
      credit_note_detail: res.tb_credit_note_detail?.map(detail => ({
        ...detail,
        return_qty: Number(detail.return_qty ?? 0),
        return_base_qty: Number(detail.return_base_qty ?? 0),
        return_conversion_factor: Number(detail.return_conversion_factor ?? 0),
        price: Number(detail.price ?? 0),
        tax_rate: Number(detail.tax_rate ?? 0),
        tax_amount: Number(detail.tax_amount ?? 0),
        base_tax_amount: Number(detail.base_tax_amount ?? 0),
        discount_rate: Number(detail.discount_rate ?? 0),
        discount_amount: Number(detail.discount_amount ?? 0),
        base_discount_amount: Number(detail.base_discount_amount ?? 0),
        extra_cost_amount: Number(detail.extra_cost_amount ?? 0),
        base_extra_cost_amount: Number(detail.base_extra_cost_amount ?? 0),
        sub_total_price: Number(detail.sub_total_price ?? 0),
        net_amount: Number(detail.net_amount ?? 0),
        total_price: Number(detail.total_price ?? 0),
        base_price: Number(detail.base_price ?? 0),
        base_sub_total_price: Number(detail.base_sub_total_price ?? 0),
        base_net_amount: Number(detail.base_net_amount ?? 0),
        base_total_price: Number(detail.base_total_price ?? 0),
      })),
      tb_credit_note_detail: undefined,
    }));

    const serializedCreditNote = CreditNoteDetailResponseSchema.parse(creditNote);

    return Result.ok(serializedCreditNote);
  }

  /**
   * Create a new credit note with its detail lines
   * สร้างใบลดหนี้ใหม่พร้อมรายการรายละเอียด
   * @param data - Credit note data including detail lines / ข้อมูลใบลดหนี้รวมถึงรายการรายละเอียด
   * @returns Created credit note ID / ID ของใบลดหนี้ที่สร้างแล้ว
   */
  @TryCatch

  async create(data: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const tx = await this.prismaService.$transaction(async (tx) => {
      const creditNote = await tx.tb_credit_note.create({
        data: JSON.parse(
          JSON.stringify({
            ...data,
            cn_no: await this.generateCnNo(data.cn_date),
            created_by_id: this.userId,
            credit_note_detail: undefined,
          }),
        ),
      });

      let seq = 1;

      if (data.credit_note_detail?.add?.length) {
        await tx.tb_credit_note_detail.createMany({
          data: data.credit_note_detail.add.map((detail: Record<string, unknown>) => {
            const { requested_qty, approved_qty, ...rest } = detail;
            return {
              ...rest,
              sequence_no: seq++,
              credit_note_id: creditNote.id,
              created_by_id: this.userId,
            };
          }),
        });
      }

      return creditNote.id;
    });

    return Result.ok({ id: tx });
  }

  /**
   * Update an existing credit note and its detail lines (add, update, delete)
   * อัปเดตใบลดหนี้ที่มีอยู่และรายการรายละเอียด (เพิ่ม อัปเดต ลบ)
   * @param data - Updated credit note data with detail operations / ข้อมูลใบลดหนี้ที่อัปเดตพร้อมการดำเนินการรายละเอียด
   * @returns Updated credit note ID / ID ของใบลดหนี้ที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: any): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const tx = await this.prismaService.$transaction(async (tx) => {
      const creditNote = await tx.tb_credit_note.update({
        where: { id: data.id },
        data: JSON.parse(
          JSON.stringify({
            ...data,
            credit_note_detail: undefined,
            updated_by_id: this.userId,
          }),
        ),
      });

      if (data.credit_note_detail?.delete?.length) {
        await tx.tb_credit_note_detail.deleteMany({
          where: {
            id: {
              in: data.credit_note_detail.delete.map(
                (detail: Record<string, unknown>) => detail.id,
              ),
            },
            credit_note_id: data.id,
          },
        });
      }

      if (data.credit_note_detail?.add?.length) {
        const lastCreditNoteDetail = await tx.tb_credit_note_detail.findFirst({
          where: {
            credit_note_id: data.id,
          },
          orderBy: {
            sequence_no: 'desc',
          },
        });

        let seq = Number(lastCreditNoteDetail?.sequence_no) + 1;

        await tx.tb_credit_note_detail.createMany({
          data: data.credit_note_detail.add.map((detail: Record<string, unknown>) => ({
            ...detail,
            credit_note_id: creditNote.id,
            created_by_id: this.userId,
            sequence_no: seq++,
          })),
        });
      }

      if (data.credit_note_detail?.update?.length) {
        for (const detail of data.credit_note_detail.update) {
          const { id, ...rest } = detail;
          await tx.tb_credit_note_detail.update({
            where: { id },
            data: {
              ...rest,
              updated_by_id: this.userId,
            },
          });
        }
      }

      return creditNote.id;
    });

    return Result.ok({ id: tx });
  }

  /**
   * Delete a credit note and all its detail lines
   * ลบใบลดหนี้และรายการรายละเอียดทั้งหมด
   * @param id - Credit note ID to delete / ID ของใบลดหนี้ที่ต้องการลบ
   * @returns Deleted credit note ID / ID ของใบลดหนี้ที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const creditNote = await this.prismaService.tb_credit_note.findFirst({
      where: { id, deleted_at: null },
    });

    if (!creditNote) {
      return Result.error('Credit note not found', ErrorCode.NOT_FOUND);
    }

    if (creditNote.doc_status !== enum_credit_note_doc_status.draft) {
      return Result.error(
        'Only draft credit notes can be deleted',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    const now = new Date().toISOString();

    await this.prismaService.$transaction(async (tx) => {
      await tx.tb_credit_note_detail.updateMany({
        where: { credit_note_id: id, deleted_at: null },
        data: { deleted_at: now, updated_by_id: this.userId },
      });

      await tx.tb_credit_note.update({
        where: { id },
        data: { deleted_at: now, updated_by_id: this.userId },
      });
    });

    return Result.ok({ id });
  }

  /**
   * Find the latest credit note matching a pattern for running number generation
   * ค้นหาใบลดหนี้ล่าสุดที่ตรงกับรูปแบบสำหรับสร้างเลขที่เอกสาร
   * @param pattern - Pattern string to match against CN number / รูปแบบข้อความที่ใช้จับคู่กับเลขที่ใบลดหนี้
   * @returns Latest credit note matching the pattern / ใบลดหนี้ล่าสุดที่ตรงกับรูปแบบ
   */
  private async findLatestCnByPattern(pattern: string): Promise<any> {
    this.logger.debug(
      { function: 'findLatestCnByPattern', pattern, tenant_id: this.bu_code, user_id: this.userId },
      CreditNoteService.name,
    );

    const latestCN = await this.prismaService.tb_credit_note.findFirst({
      where: {
        cn_no: {
          contains: pattern,
        },
      },
      orderBy: {
        cn_no: 'desc',
      },
    });

    return latestCN;
  }

  /**
   * Generate a running credit note number based on date pattern configuration
   * สร้างเลขที่ใบลดหนี้แบบเรียงลำดับตามการตั้งค่ารูปแบบวันที่
   * @param CNDate - Credit note date for pattern generation / วันที่ใบลดหนี้สำหรับสร้างรูปแบบ
   * @returns Generated credit note number / เลขที่ใบลดหนี้ที่สร้างแล้ว
   */
  private async generateCnNo(CNDate: string): Promise<any> {
    this.logger.debug(
      { function: 'generateCnNo', CNDate, tenant_id: this.bu_code, user_id: this.userId },
      CreditNoteService.name,
    );
    const pattern = await this.commonLogic.getRunningPattern(
      'CN',
      this.userId,
      this.bu_code,
    );
    this.logger.debug({ function: 'generateCnNo', pattern }, 'generateCnNo');
    const prPatterns = getPattern(pattern);
    let datePattern;
    let runningPattern;
    prPatterns.forEach((pattern) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for CN: datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    this.logger.debug(
      { function: 'generateCnNo', datePattern, runningPattern },
      CreditNoteService.name,
    );
    const getDate = new Date(CNDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    this.logger.debug(
      { function: 'generateCnNo', datePatternValue },
      CreditNoteService.name,
    );
    const latestCN = (await this.findLatestCnByPattern(datePatternValue)) as CreditNote;
    this.logger.debug({ function: 'generateCnNo', latestCN }, 'generateCnNo');
    // เก็บ Running code โดยการslice
    const latestPRNumber = latestCN
      ? Number(
        (latestCN.cn_no as string).slice(-Number(runningPattern.pattern)),
      )
      : 0;
    this.logger.debug(
      { function: 'generateCnNo', latestPRNumber },
      CreditNoteService.name,
    );
    const prNo = await this.commonLogic.generateRunningCode(
      'CN',
      getDate,
      latestPRNumber,
      this.userId,
      this.bu_code,
    );
    this.logger.debug({ function: 'generateCnNo', prNo }, CreditNoteService.name);
    return prNo;
  }

  /**
   * Print a credit note via FastReport viewer (micro-report)
   * พิมพ์ใบลดหนี้ผ่าน FastReport viewer (micro-report)
   */
  @TryCatch
  async printToReport(id: string): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const cn = await this.prismaService.tb_credit_note.findFirst({
      where: { id },
      include: {
        tb_credit_note_detail: { orderBy: { sequence_no: 'asc' } },
      },
    });
    if (!cn) {
      return Result.error('Credit note not found', ErrorCode.NOT_FOUND);
    }

    return renderViaMicroReport({
      prismaSystem: this.prismaSystem,
      bu_code: this.bu_code,
      documentType: 'CN',
      datasetPrefix: 'CN',
      buildHeader: () => ({
        CnNo: cn.cn_no || '',
        CnDate: formatReportDate(cn.cn_date),
        CnType: cn.credit_note_type || '',
        VendorName: cn.vendor_name || '',
        Currency: cn.currency_code || '',
        CnStatus: cn.doc_status || '',
        GrnNo: cn.grn_no || '',
      }),
      buildDetail: () =>
        cn.tb_credit_note_detail.map((d, i) => ({
          No: String(i + 1),
          ProductName: d.product_name || '',
          ProductCode: d.product_code || '',
          LocationName: d.location_name || '',
          Description: d.description || '',
        })),
    });
  }
}
