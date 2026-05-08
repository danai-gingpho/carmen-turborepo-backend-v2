import {
  HttpStatus,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  enum_last_action,
  enum_doc_status,
  enum_location_type,
  enum_stage_role,
  Prisma,
  PrismaClient,
  PrismaClient_TENANT,
} from '@repo/prisma-shared-schema-tenant';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { format } from 'date-fns';
import { randomBytes } from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IStoreRequisitionDetail,
  IStoreRequisition,
} from './interface/store-requisition.interface';
import {
  stage_status,
  RejectStoreRequisitionDto,
  ReviewStoreRequisitionDto,
  Stage,
  SubmitStoreRequisition,
  GlobalApiReturn,
  TryCatch,
  Result,
  ErrorCode,
  StoreRequisitionDetailResponseSchema,
  StoreRequisitionListItemResponseSchema,
} from '@/common';
import { StageStatus, WorkflowHeader } from './interface/workflow.interface';
import { WorkflowPersistenceHelper } from '@/common/workflow/workflow-persistence.helper';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';
import { firstValueFrom } from 'rxjs';
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  renderViaMicroReport,
  formatReportDate,
} from '@/common/print-report.helper';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

// SR type is derived from the destination location's location_type:
// - direct → 'issue' (cannot be transferred back)
// - inventory | consignment → 'transfer'
export const SR_TYPE = {
  TRANSFER: 'transfer',
  ISSUE: 'issue',
} as const;
export type SrType = (typeof SR_TYPE)[keyof typeof SR_TYPE];

const resolveSrType = (
  toLocationType: enum_location_type | null | undefined,
): SrType | null => {
  if (!toLocationType) return null;
  return toLocationType === enum_location_type.direct
    ? SR_TYPE.ISSUE
    : SR_TYPE.TRANSFER;
};

@Injectable()
export class StoreRequisitionService {
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
    StoreRequisitionService.name,
  );

  /**
   * Initialize Prisma service for the tenant
   * เริ่มต้น Prisma service สำหรับผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
   */
  async initializePrismaService(
    bu_code: string,
    userId: string,
  ): Promise<void> {
    this._bu_code = bu_code;
    this._userId = userId;
    const tenant = await this.tenantService.getdb_connection(userId, bu_code);
    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }
    this._prismaService = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );
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
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
    private readonly workflowOrchestrator: WorkflowOrchestratorService,
  ) {}

  /**
   * Find a store requisition by ID
   * ค้นหาใบเบิกสินค้ารายการเดียวตาม ID
   * @param id - Store requisition ID / ID ใบเบิกสินค้า
   * @param userData - User data with business unit info / ข้อมูลผู้ใช้พร้อมข้อมูลหน่วยธุรกิจ
   * @returns Store requisition detail / รายละเอียดใบเบิกสินค้า
   */
  @TryCatch
  async findById(
    id: string,
    userData: {
      bu_id: string;
      bu_code: string;
      role: string;
       
      permissions: any;
    } = null,
   
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findById',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      StoreRequisitionService.name,
    );
    const permission: string[] =
      userData?.permissions?.['inventory_management.store_requisition'] ?? [];

    let buildQuery = {};

    // Check permissions from most permissive to least permissive
    if (permission.includes('view_all')) {
      // No filter - user can see all SRs
    } else if (permission.includes('view_department')) {
      const department = await this.prismaService.tb_department_user.findFirst({
        where: {
          user_id: this.userId,
          deleted_at: null,
        },
        select: {
          department_id: true,
        },
      });
      buildQuery = {
        department_id: department?.department_id,
      };
    } else if (permission.includes('view')) {
      buildQuery = {
        requestor_id: this.userId,
      };
    }

    const storeRequisition = await this.prismaService.tb_store_requisition
      .findFirst({
        where: {
          id: id,
          ...buildQuery,
        },
        include: {
          tb_location_to: { select: { location_type: true } },
          tb_store_requisition_detail: {
            include: {
              tb_product: {
                select: {
                  inventory_unit_id: true,
                  inventory_unit_name: true,
                  tb_unit: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      })
      .then(async (res) => {
        if (!res) {
          throw new UnauthorizedException(
            'Store requisition not found or access denied',
          );
        }

        if (res?.tb_store_requisition_detail?.length > 0) {
          for (const detail of res.tb_store_requisition_detail) {
            for (const key in detail) {
              if (key.includes('qty')) {
                detail[key] = Number(detail[key]);
              }
            }
            const prod = (detail as any).tb_product;
            (detail as any).inventory_unit_id = prod?.inventory_unit_id ?? null;
            (detail as any).inventory_unit_name =
              prod?.inventory_unit_name || prod?.tb_unit?.name || null;
            delete (detail as any).tb_product;
          }
        }
        const store_requisition_detail = res['tb_store_requisition_detail'];
        delete res['tb_store_requisition_detail'];

        const toLocationType = res.tb_location_to?.location_type ?? null;
        delete (res as { tb_location_to?: unknown }).tb_location_to;

        const returningRole = await this.workflowOrchestrator.resolveUserRole(
          res.doc_status === enum_doc_status.draft,
          res.requestor_id === this.userId,
          res.workflow_id,
          res.workflow_current_stage,
          res.user_action,
          this.userId,
          this.bu_code,
        );

        return {
          ...res,
          store_requisition_detail,
          role: returningRole,
          sr_type: resolveSrType(toLocationType),
        };
      });

    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    const serializedStoreRequisition =
      StoreRequisitionDetailResponseSchema.parse(storeRequisition);

    return Result.ok(serializedStoreRequisition);
  }

  /**
   * Find all store requisitions with pagination
   * ค้นหาใบเบิกสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit codes / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param userDatas - User data with department and HOD info / ข้อมูลผู้ใช้พร้อมข้อมูลแผนกและหัวหน้าแผนก
   * @returns Paginated list of store requisitions / รายการใบเบิกสินค้าแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    user_id: string,
    bu_code: string[],
    paginate: IPaginate,
    userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
       
      permissions: any;
    }[],
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, bu_code, paginate },
      StoreRequisitionService.name,
    );
    const defaultSearchFields = ['sr_no', 'description'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );
    const results = [];

    for (const code of bu_code) {
      const userData = userDatas.find((ud) => ud.bu_code === code);
      const permission =
        userData?.permissions?.['inventory_management.store_requisition'] ?? [];

      const tenant = await this.tenantService.getdb_connection(user_id, code);

      if (!tenant) {
        return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
      }

      const prisma = await this.prismaTenant(
        tenant.tenant_id,
        tenant.db_connection,
      );

      const bu_detail = await this.prismaSystem.tb_business_unit.findFirst({
        where: {
          code: code,
        },
      });

      if (!bu_detail) {
        return Result.error(
          `Business unit ${code} not found`,
          ErrorCode.NOT_FOUND,
        );
      }

      const queryFromHeader = q.findMany();

      let permissionQuery = {};

      // Check permissions from most permissive to least permissive
      if (permission.includes('view_all')) {
        // No filter - user can see all SRs
      } else if (permission.includes('view_department')) {
        const department = await prisma.tb_department_user.findFirst({
          where: {
            user_id: user_id,
            deleted_at: null,
          },
          select: {
            department_id: true,
          },
        });
        permissionQuery = {
          department_id: department?.department_id,
        };
      } else if (permission.includes('view')) {
        permissionQuery = {
          requestor_id: user_id,
        };
      }

      const storeRequisitions = await prisma.tb_store_requisition
        .findMany({
          ...queryFromHeader,
          where: {
            ...queryFromHeader.where,
            ...permissionQuery,
          },
          include: {
            tb_location_to: { select: { location_type: true } },
            tb_store_requisition_detail: true,
          },
        })
        .then((res) => {
          const mapSr = res.map((sr) => {
            const store_requisition_detail = sr['tb_store_requisition_detail'];
            delete sr['tb_store_requisition_detail'];

            const toLocationType = sr.tb_location_to?.location_type ?? null;

            const returnSR = {
              id: sr.id,
              sr_no: sr.sr_no,
              sr_date: sr.sr_date,
              expected_date: sr.expected_date,
              description: sr.description,
              doc_status: sr.doc_status,
              requestor_name: sr.requestor_name,
              department_name: sr.department_name,
              from_location_name: sr.from_location_name,
              to_location_name: sr.to_location_name,
              sr_type: resolveSrType(toLocationType),
              workflow_name: sr.workflow_name,
              created_at: sr.created_at,
              store_requisition_detail: store_requisition_detail.map((d) => ({
                product_id: d.product_id,
                product_name: d.product_name,
                product_code: d.product_code,
                product_local_name: d.product_local_name,
                product_sku: d.product_sku,
                requested_qty: Number(d.requested_qty),
                approved_qty: Number(d.approved_qty),
              })),
              workflow_current_stage: sr.workflow_current_stage,
              workflow_next_stage: sr.workflow_next_stage,
              workflow_previous_stage: sr.workflow_previous_stage,
              last_action: sr.last_action,
            };

            return returnSR;
          });

          return mapSr;
        });

      const total = await prisma.tb_store_requisition.count({
        where: {
          ...queryFromHeader.where,
          ...permissionQuery,
        },
      });

      const perpage = Math.ceil(total / Number(paginate.perpage));

      const serializedStoreRequisitions = storeRequisitions.map((item) =>
        StoreRequisitionListItemResponseSchema.parse(item),
      );

      results.push({
        bu_code: code,
        bu_name: bu_detail.name,
        paginate: {
          total: total,
          page: Number(paginate.page),
          perpage: Number(paginate.perpage),
          pages: perpage < 1 ? 1 : perpage,
        },
        data: serializedStoreRequisitions,
      });
    }

    return Result.ok(results);
  }

  /**
   * Create a new store requisition
   * สร้างใบเบิกสินค้าใหม่
   * @param data - Store requisition creation data / ข้อมูลสร้างใบเบิกสินค้า
   * @returns Created store requisition ID / ID ใบเบิกสินค้าที่สร้างแล้ว
   */
  @TryCatch
  async create(
    createSR: IStoreRequisition,
    createSRDetail: IStoreRequisitionDetail[],
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createSR,
        createSRDetail,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      StoreRequisitionService.name,
    );

    const tx = await this.prismaService.$transaction(async (prisma) => {
      const srDate = createSR.sr_date
        ? new Date(createSR.sr_date).toISOString()
        : new Date().toISOString();

      const storeRequisitionObject = JSON.parse(
        JSON.stringify({
          ...createSR,
          sr_no: 'draft-' + randomBytes(3).toString('hex'),
          sr_date: srDate,
          created_by_id: this.userId,
          last_action: null,
        }),
      );

      const createStoreRequisition = await prisma.tb_store_requisition.create({
        data: storeRequisitionObject,
      });

      let sequence_no = 1;
      if (createSRDetail.length > 0) {
        const createStoreRequisitionObject = createSRDetail.map((item) => ({
          ...item,
          sequence_no: sequence_no++,
          store_requisition_id: createStoreRequisition.id,
          created_by_id: this.userId,
        }));

        await prisma.tb_store_requisition_detail.createMany({
          data: createStoreRequisitionObject as any,
        });
      }

      return { id: createStoreRequisition.id };
    });

    return Result.ok(tx);
  }

  /**
   * Submit a store requisition for approval
   * ส่งใบเบิกสินค้าเพื่อขออนุมัติ
   * @param id - Store requisition ID / ID ใบเบิกสินค้า
   * @param payload - Submit data / ข้อมูลการส่ง
   * @param workflowHeader - Workflow header configuration / การตั้งค่าส่วนหัวเวิร์กโฟลว์
   * @returns Submitted store requisition / ใบเบิกสินค้าที่ส่งแล้ว
   */
  @TryCatch
  async submit(
    id: string,
    payload: SubmitStoreRequisition,
    workflowHeader: WorkflowHeader,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'submit', id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: {
          id: id,
          OR: [
            { doc_status: enum_doc_status.draft },
            {
              doc_status: enum_doc_status.in_progress,
              last_action: enum_last_action.reviewed,
            },
          ],
        },
      });

    if (!storeRequisition) {
      return Result.error(
        'Store requisition not found or not submittable',
        ErrorCode.NOT_FOUND,
      );
    }

    const isDraft = storeRequisition.doc_status === enum_doc_status.draft;

    // ตรวจสอบว่าสินค้าทั้งหมดสามารถอยู่ในสถานที่ปลายทางได้
    if (storeRequisition.to_location_id) {
      const srDetails =
        await this.prismaService.tb_store_requisition_detail.findMany({
          where: {
            store_requisition_id: id,
            deleted_at: null,
          },
          select: {
            product_id: true,
            product_name: true,
          },
        });

      const productIds = srDetails.map((d) => d.product_id);

      const allowedProducts =
        await this.prismaService.tb_product_location.findMany({
          where: {
            location_id: storeRequisition.to_location_id,
            product_id: { in: productIds },
            deleted_at: null,
          },
          select: {
            product_id: true,
          },
        });

      const allowedProductIds = new Set(
        allowedProducts.map((p) => p.product_id),
      );
      const notAllowedProducts = srDetails.filter(
        (d) => !allowedProductIds.has(d.product_id),
      );

      if (notAllowedProducts.length > 0) {
        const names = notAllowedProducts
          .map((p) => p.product_name)
          .join(', ');
        return Result.error(
          `The following products are not allowed in the destination location: ${names}`,
          ErrorCode.VALIDATION_FAILURE,
        );
      }
    }

    const newSrNo = isDraft
      ? await this.generateSRNo(
        new Date(storeRequisition.sr_date).toISOString(),
      )
      : storeRequisition.sr_no;

    const tx = await this.prismaService.$transaction(async (prismatx) => {
      const updateStoreRequisition = await prismatx.tb_store_requisition.update(
        {
          where: {
            id: id,
          },
          data: {
            ...workflowHeader,
            workflow_history: workflowHeader.workflow_history as unknown as Prisma.InputJsonValue,
            user_action: workflowHeader.user_action as unknown as Prisma.InputJsonValue,
            doc_version: { increment: 1 },
            doc_status: enum_doc_status.in_progress,
            sr_no: newSrNo,
          },
        },
      );

      const SRdetail =
        await this.prismaService.tb_store_requisition_detail.findMany({
          where: {
            store_requisition_id: id,
          },
        });

      for (const detail of SRdetail) {
        const currentStages: StageStatus[] = Array.isArray(detail.stages_status)
          ? (detail.stages_status as unknown as StageStatus[])
          : [];

        const findDetails = payload.details?.length > 0
          ? payload.details.find((d) => d.id === detail.id)
          : WorkflowPersistenceHelper.autoGenerateSubmitDetail(detail.id, currentStages);
        if (!findDetails) continue;
        const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
          currentStages, findDetails, workflowHeader.workflow_previous_stage,
        );

        if (skipped) {
          // Stages unchanged but the doc has moved — refresh CSS against the new current_stage.
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: findDetails.stage_status,
            stages: currentStages,
            workflowCurrentStage: workflowHeader.workflow_current_stage,
          });
          await prismatx.tb_store_requisition_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, updated_by_id: this.userId },
          });
          continue;
        }

        const history = WorkflowPersistenceHelper.appendHistory(
          (detail.history as unknown as Record<string, unknown>[]) || [],
          { status: findDetails.stage_status, name: workflowHeader.workflow_previous_stage, message: findDetails.stage_message, userId: this.userId, userName: workflowHeader.last_action_by_name },
        );

        await prismatx.tb_store_requisition_detail.update({
          where: { id: detail.id },
          data: {
            stages_status: stages as unknown as Prisma.InputJsonValue,
            history: history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            approved_qty: Number(detail.requested_qty),
            current_stage_status: WorkflowPersistenceHelper.resolveCurrentStageStatus({
              payloadStatus: findDetails.stage_status,
              stages,
              workflowCurrentStage: workflowHeader.workflow_current_stage,
            }),
            last_action: enum_last_action.submitted,
          },
        });
      }

      return updateStoreRequisition;
    });

    return Result.ok({ id: tx.id });
  }

  /**
   * Update a store requisition with detail lines
   * แก้ไขใบเบิกสินค้าพร้อมรายการรายละเอียด
   * @param id - Store requisition ID / ID ใบเบิกสินค้า
   * @param updatePayload - Update data / ข้อมูลแก้ไข
   * @param updateSRDetail - Detail update data / ข้อมูลแก้ไขรายการรายละเอียด
   * @returns Updated store requisition / ใบเบิกสินค้าที่แก้ไขแล้ว
   */
  @TryCatch
   
  async update(
    id: string,
    updatePayload: any,
    updateSRDetail: any,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        updatePayload,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: {
          id,
          doc_version: updatePayload.doc_version,
        },
      });

    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    const tx = await this.prismaService.$transaction(async (prismatx) => {
      const updateStoreRequisitionData = JSON.parse(
        JSON.stringify({
          ...updatePayload,
        }),
      );
      delete updateStoreRequisitionData.store_requisition_detail;

      const updateStoreRequisition = await prismatx.tb_store_requisition.update(
        {
          where: {
            id,
          },
          data: {
            ...updateStoreRequisitionData,
            doc_version: { increment: 1 },
            updated_by_id: this.userId,
          },
        },
      );

      if (updateSRDetail?.store_requisition_detail?.remove?.length > 0) {
        for (const item of updateSRDetail.store_requisition_detail.remove) {
          await prismatx.tb_store_requisition_detail.delete({
            where: {
              id: item.id,
              store_requisition_id: id,
            },
          });
        }
      }

      if (updateSRDetail?.store_requisition_detail?.add?.length > 0) {
        const lastSequenceNo =
          await prismatx.tb_store_requisition_detail.findFirst({
            select: {
              sequence_no: true,
            },
            where: {
              store_requisition_id: id,
            },
            orderBy: {
              sequence_no: 'desc',
            },
          });
        let sequenceNo = lastSequenceNo?.sequence_no || 0;
        const createStoreRequisitionDetailObject =
          updateSRDetail.store_requisition_detail.add.map((item) => ({
            ...item,
            sequence_no: ++sequenceNo,
            store_requisition_id: id,
            created_by_id: this.userId,
          }));
        await prismatx.tb_store_requisition_detail.createMany({
          data: createStoreRequisitionDetailObject,
        });
      }

      if (updateSRDetail?.store_requisition_detail?.update?.length > 0) {
        for (const item of updateSRDetail.store_requisition_detail.update) {
          await prismatx.tb_store_requisition_detail.update({
            where: {
              id: item.id,
            },
            data: {
              ...item,
              updated_by_id: this.userId,
            },
          });
        }
      }

      return { id: updateStoreRequisition.id };
    });

    return Result.ok(tx);
  }

  /**
   * Find the latest store requisition by document number pattern
   * ค้นหาใบเบิกสินค้าล่าสุดตามรูปแบบเลขที่เอกสาร
   * @param pattern - Document number pattern / รูปแบบเลขที่เอกสาร
   * @returns Latest store requisition matching the pattern / ใบเบิกสินค้าล่าสุดที่ตรงกับรูปแบบ
   */
  async findLatestSrByPattern(pattern: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findLatestSrByPattern',
        pattern,
        tenant_id: this.bu_code,
        user_id: this.userId,
      },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: {
          sr_no: {
            contains: `SR${pattern}`,
          },
        },
        orderBy: {
          sr_no: 'desc',
        },
      });

    return storeRequisition;
  }

  /**
   * Soft delete a store requisition
   * ลบใบเบิกสินค้าแบบซอฟต์ดีลีท
   * @param id - Store requisition ID / ID ใบเบิกสินค้า
   * @returns Deleted store requisition ID / ID ใบเบิกสินค้าที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: { id, deleted_at: null },
      });
    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    if (storeRequisition.doc_status !== enum_doc_status.draft) {
      return Result.error(
        'Only draft store requisitions can be deleted',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    const now = new Date().toISOString();

    const tx = await this.prismaService.$transaction(async (prisma) => {
      await prisma.tb_store_requisition_detail.updateMany({
        where: { store_requisition_id: id, deleted_at: null },
        data: { deleted_at: now, updated_by_id: this.userId },
      });
      await prisma.tb_store_requisition.update({
        where: { id },
        data: { deleted_at: now, updated_by_id: this.userId },
      });

      return { id };
    });

    return Result.ok(tx);
  }

  /**
   * Approve a store requisition
   * อนุมัติใบเบิกสินค้า
   * @param id - Store requisition ID / ID ใบเบิกสินค้า
   * @param workflow - Workflow configuration / การตั้งค่าเวิร์กโฟลว์
   * @param payload - Approval payload / ข้อมูลการอนุมัติ
   * @returns Approved store requisition / ใบเบิกสินค้าที่อนุมัติแล้ว
   */
  @TryCatch
   
  async approve(id: string, workflow: any, payload: any[]): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: {
          id: id,
          doc_status: enum_doc_status.in_progress,
        },
      });

    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    const SRDetailDocs =
      await this.prismaService.tb_store_requisition_detail.findMany({
        where: {
          store_requisition_id: id,
        },
        select: {
          id: true,
          stages_status: true,
          history: true,
        },
      });

    const tx = await this.prismaService.$transaction(async (txp) => {
      await txp.tb_store_requisition.update({
        where: {
          id,
        },
        data: {
          ...workflow,
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
          doc_status:
            workflow.workflow_next_stage === '-'
              ? enum_doc_status.completed
              : enum_doc_status.in_progress,
          doc_version: { increment: 1 },
          updated_by_id: this.userId,
        },
      });

      for (const detail of payload) {
        const findSRDoc = SRDetailDocs.find((d) => d.id === detail.id);
        const rawStages = findSRDoc?.stages_status;
        const currentStages: StageStatus[] = Array.isArray(rawStages) ? rawStages as unknown as StageStatus[] : [];

        const isReject = detail.stage_status === stage_status.reject;
        let stages: StageStatus[];
        let stagesSkipped = false;
        if (isReject) {
          stages = WorkflowPersistenceHelper.buildRejectStagesStatus(
            currentStages, detail, workflow.workflow_previous_stage,
          );
        } else {
          const result = WorkflowPersistenceHelper.buildApproveStagesStatus(
            currentStages, detail, workflow.workflow_previous_stage,
          );
          stagesSkipped = result.skipped;
          stages = result.skipped ? currentStages : result.stages;
        }

        const now = new Date().toISOString();

        if (stagesSkipped) {
          // Already approved at this stage — refresh CSS against the new doc current_stage.
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: detail.stage_status || '',
            stages: currentStages,
            workflowCurrentStage: workflow.workflow_current_stage,
          });
          await this.prismaService.tb_store_requisition_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, updated_by_id: this.userId },
          });
          continue;
        }

        const history = WorkflowPersistenceHelper.appendHistory(
          (findSRDoc?.history as unknown as Record<string, unknown>[]) || [],
          { status: detail.stage_status || '', name: workflow.workflow_previous_stage, message: detail.stage_message || '', userId: this.userId, userName: workflow.last_action_by_name },
        );

        const approvedMessage = detail.stage_message || '';
        const payloadStatus = detail.stage_status || '';
        delete detail.stage_message;
        delete detail.stage_status;
        delete detail.store_requisition_id;

        const updateDto = JSON.parse(
          JSON.stringify({
            id: undefined,
            ...detail,
          }),
        );

        await this.prismaService.tb_store_requisition_detail.update({
          where: { id: detail.id },
          data: {
            ...updateDto,
            doc_version: { increment: 1 },
            stages_status: stages as unknown as Prisma.InputJsonValue,
            history: history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            current_stage_status: WorkflowPersistenceHelper.resolveCurrentStageStatus({
              payloadStatus,
              stages,
              workflowCurrentStage: workflow.workflow_current_stage,
            }),
            last_action: enum_last_action.approved,
            approved_by_id: this.userId,
            approved_by_name: workflow.last_action_by_name,
            approved_date_at: now,
            approved_message: approvedMessage,
          },
        });
      }

      return id;
    });

    return Result.ok({ id: storeRequisition.id });
  }

  /**
   * Reject a store requisition
   * ปฏิเสธใบเบิกสินค้า
   * @param id - Store requisition ID / ID ใบเบิกสินค้า
   * @param payload - Rejection data with reason / ข้อมูลการปฏิเสธพร้อมเหตุผล
   * @returns Rejected store requisition / ใบเบิกสินค้าที่ปฏิเสธแล้ว
   */
  @TryCatch
  async reject(
    id: string,
     
    workflow: Record<string, any>,
    payload: RejectStoreRequisitionDto,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'reject', id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: {
          id: id,
          doc_status: enum_doc_status.in_progress,
        },
      });

    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    const storeRequisitionDetail =
      await this.prismaService.tb_store_requisition_detail.findMany({
        where: {
          store_requisition_id: id,
        },
      });

    const now = new Date().toISOString();

    await this.prismaService.$transaction(async (txp) => {
      for (const detail of storeRequisitionDetail) {
        const findSR = payload.details.find((d) => d.id === detail.id);
        if (!findSR) continue;

        const bag = WorkflowPersistenceHelper.buildRejectDetailUpdate({
          payloadDetail: findSR,
          currentStages: Array.isArray(detail.stages_status) ? detail.stages_status as unknown as StageStatus[] : [],
          currentHistory: (detail.history as unknown as Record<string, unknown>[]) || [],
          workflowCurrentStage: storeRequisition.workflow_current_stage,
          userId: this.userId,
          userName: workflow.last_action_by_name,
        });

        await txp.tb_store_requisition_detail.update({
          where: { id: detail.id },
          data: {
            stages_status: bag.stages_status as unknown as Prisma.InputJsonValue,
            history: bag.history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            current_stage_status: bag.current_stage_status,
            last_action: enum_last_action.rejected,
            reject_by_id: this.userId,
            reject_by_name: workflow.last_action_by_name,
            reject_date_at: now,
            reject_message: findSR.stage_message || '',
          },
        });
      }
      await txp.tb_store_requisition.update({
        where: {
          id,
        },
        data: {
          ...workflow,
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
          doc_status: enum_doc_status.voided,
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: storeRequisition.id });
  }

  /**
   * Review a store requisition
   * ตรวจสอบใบเบิกสินค้า
   * @param id - Store requisition ID / ID ใบเบิกสินค้า
   * @param payload - Review data / ข้อมูลการตรวจสอบ
   * @returns Reviewed store requisition / ใบเบิกสินค้าที่ตรวจสอบแล้ว
   */
  async review(
    id: string,
     
    workflow: Record<string, any>,
    payload: ReviewStoreRequisitionDto,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'review', id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: {
          id: id,
          doc_status: enum_doc_status.in_progress,
        },
      });

    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    const storeRequisitionDetail =
      await this.prismaService.tb_store_requisition_detail.findMany({
        where: {
          store_requisition_id: id,
        },
      });

    const now = new Date().toISOString();

    await this.prismaService.$transaction(async (txp) => {
      for (const detail of storeRequisitionDetail) {
        const findSR = payload.details.find((d) => d.id === detail.id);
        if (!findSR) continue;

        const currentStages: StageStatus[] = Array.isArray(detail.stages_status)
          ? (detail.stages_status as unknown as StageStatus[])
          : [];

        const bag = WorkflowPersistenceHelper.buildReviewDetailUpdate({
          payloadDetail: findSR,
          currentStages,
          currentHistory: (detail.history as unknown as Record<string, unknown>[]) || [],
          workflowPreviousStage: workflow.workflow_previous_stage,
          workflowCurrentStage: workflow.workflow_current_stage,
          desStage: payload.des_stage,
          userId: this.userId,
          userName: workflow.last_action_by_name,
        });

        if (!bag) {
          // Already-approved row skipped — refresh CSS against new current_stage.
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: findSR.stage_status,
            stages: currentStages,
            workflowCurrentStage: workflow.workflow_current_stage,
          });
          await txp.tb_store_requisition_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, updated_by_id: this.userId },
          });
          continue;
        }

        const isApproveRow = findSR.stage_status === stage_status.approve;

        await txp.tb_store_requisition_detail.update({
          where: {
            id: detail.id,
          },
          data: {
            stages_status: bag.stages_status as unknown as Prisma.InputJsonValue,
            history: bag.history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            current_stage_status: bag.current_stage_status,
            ...(isApproveRow
              ? {
                  last_action: enum_last_action.approved,
                  approved_by_id: this.userId,
                  approved_by_name: workflow.last_action_by_name,
                  approved_date_at: now,
                  approved_message: findSR.stage_message || '',
                }
              : {
                  last_action: enum_last_action.reviewed,
                  review_by_id: this.userId,
                  review_by_name: workflow.last_action_by_name,
                  review_date_at: now,
                  review_message: findSR.stage_message || '',
                }),
          },
        });
      }

      await txp.tb_store_requisition.update({
        where: {
          id,
        },
        data: {
          ...workflow,
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
          updated_by_id: this.userId,
        },
      });
    });

    return Result.ok({ id: storeRequisition.id });
  }

  private async generateSRNo(SRDate: string): Promise<any> {
    this.logger.debug(
      {
        function: 'generateSRNo',
        SRDate,
        tenant_id: this.bu_code,
        user_id: this.userId,
      },
      StoreRequisitionService.name,
    );

    const res = this.masterService.send(
      { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
      { type: 'SR', user_id: this.userId, bu_code: this.bu_code },
    );
    const response = await firstValueFrom(res);

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Failed to get running code pattern for SR: ${JSON.stringify(response)}`);
    }

    const patterns = response.data;

    let datePattern;
    let runningPattern;
    patterns.forEach((pattern) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for SR: datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    const getDate = new Date(SRDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    const latestSR = await this.findLatestSrByPattern(datePatternValue);
    const latestSRNumber = latestSR
      ? Number(latestSR.sr_no.slice(-Number(runningPattern.pattern)))
      : 0;

    const generateCodeRes = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'SR',
        issueDate: getDate,
        last_no: latestSRNumber,
        user_id: this.userId,
        bu_code: this.bu_code,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);

    if (!generateCodeResponse?.data?.code) {
      throw new Error(`Failed to generate SR number: ${JSON.stringify(generateCodeResponse)}`);
    }

    return generateCodeResponse.data.code;
  }

  /**
   * Find all store requisitions by status with pagination
   * ค้นหาใบเบิกสินค้าทั้งหมดตามสถานะพร้อมการแบ่งหน้า
   * @param status - Document status to filter by / สถานะเอกสารที่จะกรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of store requisitions by status / รายการใบเบิกสินค้าตามสถานะแบบแบ่งหน้า
   */
  @TryCatch
  async findAllByStatus(
    status: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAllByStatus',
        status,
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      StoreRequisitionService.name,
    );

    const defaultSearchFields = ['sr_no', 'description'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const whereQry = {
      ...q.where(),
      doc_status: status as enum_doc_status,
    };

    const storeRequisitions = await this.prismaService.tb_store_requisition
      .findMany({
        where: whereQry,
        orderBy: q.orderBy(),
        ...pagination,
        include: {
          tb_store_requisition_detail: true,
        },
      })
      .then((res) => {
        const mapSr = res.map((item) => {
          const store_requisition_detail = item['tb_store_requisition_detail'];
          delete item['tb_store_requisition_detail'];
          return {
            ...item,
            store_requisition_detail,
          };
        });

        return mapSr;
      });

    const total = await this.prismaService.tb_store_requisition.count({
      where: whereQry,
    });

    const serializedStoreRequisitions = storeRequisitions.map((item) =>
      StoreRequisitionListItemResponseSchema.parse(item),
    );

    return Result.ok({
      data: serializedStoreRequisitions,
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Find all pending store requisitions for the current user
   * ค้นหาใบเบิกสินค้าที่รอดำเนินการทั้งหมดสำหรับผู้ใช้ปัจจุบัน
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code(s) / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of pending store requisitions / รายการใบเบิกสินค้าที่รอดำเนินการแบบแบ่งหน้า
   */
  @TryCatch
  async findAllMyPending(
    user_id: string,
    bu_code: string | string[],
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllMyPending', user_id, bu_code, paginate },
      StoreRequisitionService.name,
    );

    // Resolve bu_codes: handle array or string input, fetch all user BUs if empty
    let bu_codes: string[];
    if (Array.isArray(bu_code)) {
      bu_codes = bu_code.filter((c) => c);
    } else if (bu_code) {
      bu_codes = [bu_code];
    } else {
      bu_codes = [];
    }

    if (bu_codes.length === 0) {
      const bus = await this.getBus(user_id, true, 'latest');
      bu_codes = bus.data?.map((b) => b.tb_business_unit.code) ?? [];
    }

    if (bu_codes.length === 0) {
      return Result.error('No business units found for user', ErrorCode.NOT_FOUND);
    }

    const defaultSearchFields = ['sr_no', 'description'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );

    const allResults = [];
    let grandTotal = 0;

    for (const code of bu_codes) {
      try {
        const tenant = await this.tenantService.getdb_connection(user_id, code);

        if (!tenant) {
          continue;
        }

        const prisma = await this.prismaTenant(
          tenant.tenant_id,
          tenant.db_connection,
        );

        const bu_detail = await this.prismaSystem.tb_business_unit.findFirst({
          where: {
            code: code,
          },
        });

        if (!bu_detail) {
          continue;
        }

        const standardQuery = q.findMany();

        const userPermissionFilter = {
          OR: [
            {
              user_action: {
                path: ['execute'],
                array_contains: [{ user_id: user_id }],
              },
            },
            {
              doc_status: enum_doc_status.draft,
              requestor_id: user_id,
            },
          ],
        };

        const combinedWhere = {
          AND: [
            standardQuery.where,
            userPermissionFilter,
          ],
        };

        const storeRequisitions = await prisma.tb_store_requisition
          .findMany({
            ...standardQuery,
            where: combinedWhere,
            include: {
              tb_location_to: { select: { location_type: true } },
              tb_store_requisition_detail: true,
            },
          })
          .then((res) => {
            const mapSr = res.map((sr) => {
              const store_requisition_detail = sr['tb_store_requisition_detail'];
              delete sr['tb_store_requisition_detail'];

              const toLocationType = sr.tb_location_to?.location_type ?? null;

              const returnSR = {
                id: sr.id,
                sr_no: sr.sr_no,
                sr_date: sr.sr_date,
                expected_date: sr.expected_date,
                description: sr.description,
                doc_status: sr.doc_status,
                requestor_name: sr.requestor_name,
                department_name: sr.department_name,
                from_location_name: sr.from_location_name,
                to_location_name: sr.to_location_name,
                sr_type: resolveSrType(toLocationType),
                workflow_name: sr.workflow_name,
                created_at: sr.created_at,
                store_requisition_detail: store_requisition_detail.map((d) => ({
                  requested_qty: Number(d.requested_qty),
                  approved_qty: Number(d.approved_qty),
                })),
                workflow_current_stage: sr.workflow_current_stage,
                workflow_next_stage: sr.workflow_next_stage,
                workflow_previous_stage: sr.workflow_previous_stage,
                last_action: sr.last_action,
              };

              return returnSR;
            });

            return mapSr;
          });

        const total = await prisma.tb_store_requisition.count({
          where: combinedWhere,
        });

        const serializedStoreRequisitions = storeRequisitions.map((item) =>
          StoreRequisitionListItemResponseSchema.parse(item),
        );

        allResults.push({
          bu_code: code,
          bu_name: bu_detail.name,
          data: serializedStoreRequisitions,
          total: total,
        });

        grandTotal += total;
      } catch (error) {
        this.logger.warn({
          function: 'findAllMyPending',
          message: `Error processing bu_code: ${code}, skipping`,
          error: error instanceof Error ? error.message : error,
        });
        continue;
      }
    }

    return Result.ok({
      data: allResults,
      paginate: {
        total: grandTotal,
        page: Number(paginate.page),
        perpage: Number(paginate.perpage),
        pages: grandTotal == 0 ? 1 : Math.ceil(grandTotal / Number(paginate.perpage)),
      },
    });
  }

  /**
   * Get business units for a user
   * ดึงหน่วยธุรกิจสำหรับผู้ใช้
   * @param userId - User ID / ID ผู้ใช้
   * @param is_active - Active status filter / ตัวกรองสถานะใช้งาน
   * @param version - API version / เวอร์ชัน API
   * @returns Business units / หน่วยธุรกิจ
   */
  async getBus(
    userId: string,
    is_active: boolean = true,
    version: string,
  ): Promise<any> {
    this.logger.debug({
      function: 'getBus',
      userId,
      version,
    });

    try {
      const bus = await this.prismaSystem.tb_user_tb_business_unit.findMany({
        where: { user_id: userId, is_active: is_active },
        select: {
          user_id: true,
          business_unit_id: true,
          is_active: true,
          is_default: true,
          role: true,
          tb_business_unit: {
            select: {
              code: true,
              name: true,
            },
          },
        },
        distinct: ['business_unit_id'],
      });

      this.logger.debug({
        function: 'getBus',
        userId,
        version,
        bus,
      });

      if (bus.length === 0) {
        return {
          data: [],
          response: {
            status: HttpStatus.NOT_FOUND,
            message: 'Business unit not found',
          },
        };
      }

      return {
        data: bus,
        response: {
          status: HttpStatus.OK,
          message: 'Business unit retrieved successfully',
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while retrieving business unit';
      this.logger.error(errorMessage, {
        file: StoreRequisitionService.name,
        function: 'getBus',
        userId,
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Get count of pending store requisitions for the current user
   * ดึงจำนวนใบเบิกสินค้าที่รอดำเนินการสำหรับผู้ใช้ปัจจุบัน
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Pending count / จำนวนที่รอดำเนินการ
   */
  async findAllMyPendingCount(user_id: string, bu_code: string | string[]): Promise<any> {
    this.logger.debug(
      { function: 'findAll', user_id, bu_code },
      StoreRequisitionService.name,
    );

    const paginate: IPaginate = {
      page: 1,
      perpage: 1,
      search: '',
      searchfields: ['sr_no', 'note'],
      filter: {},
      sort: [],
      advance: {},
    };
    const defaultSearchFields = ['sr_no', 'note'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );
    const results = [];

    let bu_codes: string[] = [];

    const isEmpty = !bu_code || (Array.isArray(bu_code) && bu_code.length === 0);
    if (isEmpty) {
      const bus = await this.getBus(user_id, true, 'latest');
      bu_codes = bus.data.map((bus) => bus.tb_business_unit.code);
      this.logger.debug({
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        bus,
      });
    } else {
      bu_codes = Array.isArray(bu_code) ? bu_code : [bu_code];
    }

    for (const code of bu_codes) {
      try {
        const tenant = await this.tenantService.getdb_connection(user_id, code);

        if (!tenant) {
          this.logger.warn({
            function: 'findAllMyPendingCount',
            message: `Tenant not found for bu_code: ${code}, skipping`,
          });
          continue;
        }

        const prisma = await this.prismaTenant(
          tenant.tenant_id,
          tenant.db_connection,
        );

        const bu_detail = await this.prismaSystem.tb_business_unit.findFirst({
          where: {
            code: code,
          },
        });

        if (!bu_detail) {
          this.logger.warn({
            function: 'findAllMyPendingCount',
            message: `Business unit ${code} not found, skipping`,
          });
          continue;
        }

        const standardQuery = q.findMany();

        const total = await prisma.tb_store_requisition.count({
          where: {
            ...standardQuery.where,
            OR: [
              {
                user_action: {
                  path: ['execute'],
                  array_contains: [{ user_id: user_id }],
                },
              },
              {
                doc_status: enum_doc_status.draft,
                requestor_id: user_id,
              },
            ],
          },
        });

        results.push({
          total: total,
        });
      } catch (error) {
        this.logger.warn({
          function: 'findAllMyPendingCount',
          message: `Error processing bu_code: ${code}, skipping`,
          error: error instanceof Error ? error.message : error,
        });
        continue;
      }
    }

    const total = results.reduce((acc, curr) => acc + curr.total, 0);
    this.logger.debug({
      function: 'findAllMyPendingCount',
      user_id,
      total,
    });

    return Result.ok({ pending: total });
  }

  /**
   * Get previous workflow stages for a store requisition (for review/sendback)
   * ดึงขั้นตอนอนุมัติก่อนหน้า current_stage ของใบเบิกสินค้า
   */
  @TryCatch
  async getPreviousStages(sr_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getPreviousStages', sr_id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const sr = await this.prismaService.tb_store_requisition.findFirst({
      where: { id: sr_id, deleted_at: null },
      select: { id: true, workflow_id: true, workflow_current_stage: true },
    });

    if (!sr) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    if (!sr.workflow_id || !sr.workflow_current_stage) {
      return Result.error('No workflow assigned to this store requisition', ErrorCode.NOT_FOUND);
    }

    const numberedStages = await this.workflowOrchestrator.getPreviousStages(
      sr.workflow_id, sr.workflow_current_stage, this.userId, this.bu_code,
    );

    return Result.ok(numberedStages);
  }

  /**
   * Get all workflow stages for store requisitions owned by the user (for stage filter dropdown)
   * ดึงขั้นตอนทั้งหมดของ workflow ที่ใช้ในใบเบิกสินค้าของผู้ใช้
   */
  @TryCatch
  async findAllWorkflowStagesBySr(
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    const tenant = await this.tenantService.getdb_connection(user_id, bu_code);

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const results = await prisma.tb_store_requisition.findMany({
      where: { requestor_id: user_id },
      select: { workflow_id: true },
      distinct: ['workflow_id'],
    });

    const stages = await this.workflowOrchestrator.findAllWorkflowStages(
      results.map((r) => r.workflow_id),
      user_id,
      bu_code,
    );

    return Result.ok(stages);
  }

  /**
   * Get distinct workflow stages where user has pending actions
   * ดึงขั้นตอนที่ผู้ใช้มีงานรออนุมัติ
   */
  @TryCatch
  async findAllMyPendingStages(): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllMyPendingStages', user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const stages = await this.prismaService.tb_store_requisition.findMany({
      where: {
        workflow_current_stage: { not: null },
        OR: [
          {
            doc_status: enum_doc_status.draft,
            requestor_id: this.userId,
          },
          {
            user_action: {
              path: ['execute'],
              array_contains: [{ user_id: this.userId }],
            },
          },
        ],
      },
      select: { workflow_current_stage: true },
      distinct: ['workflow_current_stage'],
    });

    return Result.ok(stages.map((s) => s.workflow_current_stage));
  }

  /**
   * Print a store requisition via FastReport viewer (micro-report)
   * พิมพ์ใบเบิกสินค้าผ่าน FastReport viewer (micro-report)
   */
  @TryCatch
  async printToReport(id: string): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const sr = await this.prismaService.tb_store_requisition.findFirst({
      where: { id },
      include: {
        tb_store_requisition_detail: { orderBy: { sequence_no: 'asc' } },
      },
    });
    if (!sr) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    return renderViaMicroReport({
      prismaSystem: this.prismaSystem,
      bu_code: this.bu_code,
      documentType: 'SR',
      datasetPrefix: 'SR',
      buildHeader: () => ({
        SrNo: sr.sr_no || '',
        SrDate: formatReportDate(sr.sr_date),
        ExpectedDate: formatReportDate(sr.expected_date),
        FromLocation: sr.from_location_name || '',
        ToLocation: sr.to_location_name || '',
        Description: sr.description || '',
        SrStatus: sr.doc_status || '',
        WorkflowName: sr.workflow_name || '',
      }),
      buildDetail: () =>
        sr.tb_store_requisition_detail.map((d, i) => ({
          No: String(i + 1),
          ProductName: d.product_name || '',
          ProductCode: d.product_code || '',
          Description: d.description || '',
        })),
    });
  }
}
