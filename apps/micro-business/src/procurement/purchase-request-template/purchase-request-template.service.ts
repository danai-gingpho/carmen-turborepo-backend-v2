import {
  HttpStatus,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import { CreatePurchaseRequestTemplateDto } from './dto/purchase-requesr-template.dto';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { UpdatePurchaseRequestTemplateDto } from './dto/update-purchase-request-template.dto';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  TryCatch,
  Result,
  ErrorCode,
  PurchaseRequestTemplateDetailResponseSchema,
  PurchaseRequestTemplateListItemResponseSchema,
} from '@/common';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class PurchaseRequestTemplateService {
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
    PurchaseRequestTemplateService.name,
  );

  /**
   * Initialize the Prisma service for tenant-specific database access
   * เริ่มต้นบริการ Prisma สำหรับการเข้าถึงฐานข้อมูลเฉพาะผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
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
    private readonly mapperLogic: MapperLogic,
  ) { }

  /**
   * Find all purchase request templates with pagination
   * ค้นหาเทมเพลตใบขอซื้อทั้งหมดพร้อมการแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of purchase request templates with details / รายการเทมเพลตใบขอซื้อพร้อมรายละเอียดที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      PurchaseRequestTemplateService.name,
    );
    const defaultSearchFields = ['name', 'note'];

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

    const result = await this.prismaService.tb_purchase_request_template
      .findMany({
        where: q.where(),
        orderBy: q.orderBy(),
        ...pagination,
        include: {
          tb_purchase_request_template_detail: true,
        },
      })
      .then((res) => {

        if (res.length === 0) return []

        const response = res.map((pr) => {
          const purchase_request_template_detail =
            pr.tb_purchase_request_template_detail;

          return JSON.parse(
            JSON.stringify({
              ...pr,
              purchase_request_template_detail,
              tb_purchase_request_template_detail: undefined,
            }),
          );
        });

        return response;
      });

    const total = await this.prismaService.tb_purchase_request_template.count({
      where: q.where(),
    });

    const serializedResult = result.map((item) =>
      PurchaseRequestTemplateListItemResponseSchema.parse(item)
    );

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedResult,
    });
  }

  /**
   * Find a single purchase request template by ID with its detail lines
   * ค้นหาเทมเพลตใบขอซื้อรายการเดียวตาม ID พร้อมรายการรายละเอียด
   * @param id - Template ID / ID ของเทมเพลต
   * @returns Purchase request template data with details / ข้อมูลเทมเพลตใบขอซื้อพร้อมรายละเอียด
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestTemplateService.name,
    );

    const result = await this.prismaService.tb_purchase_request_template
      .findFirst({
        where: { id },
        include: {
          tb_purchase_request_template_detail: true,
        },
      })
      .then((res) => {
        if (!res) return null;
        const purchase_request_template_detail =
          res.tb_purchase_request_template_detail;

        return JSON.parse(
          JSON.stringify({
            ...res,
            purchase_request_template_detail,
            tb_purchase_request_template_detail: undefined,
          }),
        );
      });

    if (!result) {
      return Result.error('Purchase request template not found', ErrorCode.NOT_FOUND);
    }

    const serializedResult = PurchaseRequestTemplateDetailResponseSchema.parse(result);

    return Result.ok(serializedResult);
  }

  /**
   * Create a new purchase request template with its detail lines
   * สร้างเทมเพลตใบขอซื้อใหม่พร้อมรายการรายละเอียด
   * @param data - Template data including detail lines / ข้อมูลเทมเพลตรวมถึงรายการรายละเอียด
   * @returns Created template ID / ID ของเทมเพลตที่สร้างแล้ว
   */
  @TryCatch
  async create(data: CreatePurchaseRequestTemplateDto): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestTemplateService.name,
    );

    const tx = await this.prismaService.$transaction(async (tx) => {
      const purchaseRequestTemplate =
        await tx.tb_purchase_request_template.create({
          data: {
            name: data.name || 'Purchase Request Template',
            description: data.description,
            workflow_id: data.workflow_id as never,
            workflow_name: data.workflow_name,
            note: data.note,
            info: data.info,
            dimension: data.dimension,
            created_by_id: this.userId,
          },
        });

      if (data.purchase_request_template_detail?.add?.length) {
        const purchaseRequestTemplateDetail =
          data.purchase_request_template_detail.add.map((detail) => ({
            ...detail,
            purchase_request_template_id: purchaseRequestTemplate.id,
            product_id: detail.product_id,
            created_by_id: this.userId,
          }));

        await tx.tb_purchase_request_template_detail.createMany({
          data: purchaseRequestTemplateDetail,
        });
      }

      return purchaseRequestTemplate.id;
    });

    return Result.ok({ id: tx });
  }

  /**
   * Update an existing purchase request template and its detail lines (add, update, delete)
   * อัปเดตเทมเพลตใบขอซื้อที่มีอยู่และรายการรายละเอียด (เพิ่ม อัปเดต ลบ)
   * @param data - Updated template data with detail operations / ข้อมูลเทมเพลตที่อัปเดตพร้อมการดำเนินการรายละเอียด
   * @returns Updated template ID / ID ของเทมเพลตที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: UpdatePurchaseRequestTemplateDto): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestTemplateService.name,
    );

    const tx = await this.prismaService.$transaction(async (tx) => {
      const purchaseRequestTemplate =
        await tx.tb_purchase_request_template.update({
          where: {
            id: data.id,
          },
          data: JSON.parse(
            JSON.stringify({
              name: data.name,
              workflow_id: data.workflow_id,
              workflow_name: data.workflow_name,
              updated_by_id: this.userId,
              description: data.description,
              note: data.note,
              dimension: data.dimension,
              info: data.info,
            }),
          ),
        });

      if (data.purchase_request_template_detail?.add?.length) {
        const purchaseRequestTemplateDetail =
          data.purchase_request_template_detail.add.map((detail) => ({
            ...detail,
            product_id: detail.product_id,
            purchase_request_template_id: purchaseRequestTemplate.id,
            created_by_id: this.userId,
          }));
        await tx.tb_purchase_request_template_detail.createMany({
          data: purchaseRequestTemplateDetail,
        });
      }

      if (data.purchase_request_template_detail?.update?.length) {
        for (const detail of data.purchase_request_template_detail.update) {
          await tx.tb_purchase_request_template_detail.update({
            where: {
              id: detail.id,
            },
            data: {
              ...detail,
              doc_version: { increment: 1 },
              updated_by_id: this.userId,
            },
          });
        }
      }

      if (data.purchase_request_template_detail?.delete?.length) {
        await tx.tb_purchase_request_template_detail.deleteMany({
          where: {
            id: {
              in: data.purchase_request_template_detail.delete.map(
                (detail) => detail.id,
              ),
            },
            purchase_request_template_id: purchaseRequestTemplate.id,
          },
        });
      }

      return purchaseRequestTemplate.id;
    });

    return Result.ok({ id: tx });
  }

  /**
   * Delete a purchase request template and all its detail lines
   * ลบเทมเพลตใบขอซื้อและรายการรายละเอียดทั้งหมด
   * @param id - Template ID to delete / ID ของเทมเพลตที่ต้องการลบ
   * @returns Deleted template ID / ID ของเทมเพลตที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestTemplateService.name,
    );

    const tx = await this.prismaService.$transaction(async (tx) => {
      // ลบรายการย่อยก่อน
      await tx.tb_purchase_request_template_detail.deleteMany({
        where: {
          purchase_request_template_id: id,
        },
      });

      // ลบรายการหลัก
      const purchaseRequestTemplate =
        await tx.tb_purchase_request_template.delete({
          where: {
            id,
          },
        });

      return purchaseRequestTemplate.id;
    });

    return Result.ok({ id: tx });
  }
}
