import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
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
    private readonly commonLogic: CommonLogic,
  ) { }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      CreditNoteService.name,
    );
    const defaultSearchFields = ['credit_note_no', 'name'];

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

    const creditNotes = await this.prismaService.tb_credit_note.findMany({
      select: {
        id: true,
        cn_no: true,
        cn_date: true,
        // cn_status: true,
        description: true,
        note: true,
        info: true,
        created_at: true,
        tb_credit_note_detail: true,
      },
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_credit_note.count({
      where: q.where(),
    });

    const serializedCreditNotes = creditNotes.map((item) => CreditNoteListItemResponseSchema.parse(item));

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

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const creditNote = await this.prismaService.tb_credit_note.findFirst({
      include: {
        tb_credit_note_detail: true,
      },
      where: {
        id,
      },
    })
      .then((res) => {
        if (!res) return null;
        return JSON.parse(JSON.stringify({
          ...res,
          credit_note_detail: {
            data: res?.tb_credit_note_detail?.map(detail => ({
              ...detail,
              return_qty: Number(detail?.return_qty ?? 0),
              return_base_qty: Number(detail?.return_base_qty ?? 0),
              return_conversion_factor: Number(detail?.return_conversion_factor ?? 0),
              price: Number(detail?.price ?? 0),
              total_price: Number(detail?.total_price ?? 0),
              tax_amount: Number(detail?.tax_amount ?? 0),
              extra_cost_amount: Number(detail?.extra_cost_amount ?? 0),
              base_tax_amount: Number(detail?.base_tax_amount ?? 0),
              base_discount_amount: Number(detail?.base_discount_amount ?? 0),
              base_extra_cost_amount: Number(detail?.base_extra_cost_amount ?? 0),
            }))
          },
          tb_credit_note_detail: undefined,
        }));
      })

    if (!creditNote) {
      return Result.error('Credit note not found', ErrorCode.NOT_FOUND);
    }

    const serializedCreditNote = CreditNoteDetailResponseSchema.parse(creditNote);

    return Result.ok(serializedCreditNote);
  }

  @TryCatch
  async create(data: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const tx = await this.prismaService.$transaction(async (tx) => {
      console.log('before create ', data)
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
          data: data.credit_note_detail.add.map((detail: any) => ({
            ...detail,
            sequence_no: seq++,
            credit_note_id: creditNote.id,
            created_by_id: this.userId,
          })),
        });
      }

      return creditNote.id;
    });

    return Result.ok({ id: tx });
  }

  @TryCatch
  async update(data: any): Promise<Result<any>> {
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
                (detail: any) => detail.id,
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
          data: data.credit_note_detail.add.map((detail: any) => ({
            ...detail,
            credit_note_id: creditNote.id,
            created_by_id: this.userId,
            sequence_no: seq++,
          })),
        });
      }

      if (data.credit_note_detail?.update?.length) {
        for (const detail of data.credit_note_detail.update) {
          await tx.tb_credit_note_detail.update({
            where: { id: detail.id },
            data: {
              ...detail,
              updated_by_id: this.userId,
            },
          });
        }
      }

      return creditNote.id;
    });

    return Result.ok({ id: tx });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      CreditNoteService.name,
    );

    const tx = await this.prismaService.$transaction(async (tx) => {
      await tx.tb_credit_note_detail.deleteMany({
        where: { credit_note_id: id },
      });

      await tx.tb_credit_note.delete({
        where: { id },
      });

      return id;
    });

    return Result.ok({ id: tx });
  }

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
}
