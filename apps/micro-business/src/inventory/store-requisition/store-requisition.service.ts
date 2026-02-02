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
  enum_stage_role,
  PrismaClient,
  PrismaClient_TENANT,
} from '@repo/prisma-shared-schema-tenant';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { format } from 'date-fns';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IStoreRequisitionDetail,
  IStoreRequisition,
} from './interface/store-requisition.interface';
import {
  state_status,
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
import { firstValueFrom } from 'rxjs';
import getPaginationParams from '@/common/helpers/pagination.params';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

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
  ) {}

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

    if (permission.includes('view_department')) {
      const department = await this.prismaService.tb_department_user.findFirst({
        where: {
          user_id: this.userId,
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
          tb_store_requisition_detail: true,
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
          }
        }
        const store_requisition_detail = res['tb_store_requisition_detail'];
        delete res['tb_store_requisition_detail'];

        const workflowCallReq = this.masterService.send(
          { cmd: 'workflows.get-workflow-stage-detail', service: 'workflows' },
          {
            workflow_id: res.workflow_id,
            stage: res.workflow_current_stage,
            user_id: this.userId,
            bu_code: this.bu_code,
          },
        );
        const CallCurrentWorkflowDetail: GlobalApiReturn<Stage> =
          await firstValueFrom(workflowCallReq);
        const currentWorkflowDetail = CallCurrentWorkflowDetail.data;

        const userList: string[] =
          (res.user_action as { execute: string[] })?.execute || [];

        const returningRole = userList.includes(this.userId)
          ? currentWorkflowDetail.role
          : enum_stage_role.view_only;

        return {
          ...res,
          store_requisition_detail,
          role: returningRole,
        };
      });

    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    const serializedStoreRequisition =
      StoreRequisitionDetailResponseSchema.parse(storeRequisition);

    return Result.ok(serializedStoreRequisition);
  }

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
  ): Promise<Result<any>> {
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

      if (permission.includes('view_department')) {
        const department = await prisma.tb_department_user.findFirst({
          where: {
            user_id: user_id,
            deleted_at: undefined,
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
            tb_store_requisition_detail: true,
          },
        })
        .then((res) => {
          const mapSr = res.map((sr) => {
            const store_requisition_detail = sr['tb_store_requisition_detail'];
            delete sr['tb_store_requisition_detail'];

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

  @TryCatch
  async create(
    createSR: IStoreRequisition,
    createSRDetail: IStoreRequisitionDetail[],
  ): Promise<Result<any>> {
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
          sr_no: 'draft-' + format(new Date(), 'yyyyMMddHHmmss'),
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
          data: createStoreRequisitionObject,
        });
      }

      return { id: createStoreRequisition.id };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async submit(
    id: string,
    payload: SubmitStoreRequisition,
    workflowHeader: WorkflowHeader,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'submit', id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: {
          id: id,
          doc_status: enum_doc_status.draft,
        },
      });

    if (!storeRequisition) {
      return Result.error('Store requisition not found', ErrorCode.NOT_FOUND);
    }

    const newSrNo = await this.generateSRNo(
      new Date(storeRequisition.sr_date).toISOString(),
    );

    const tx = await this.prismaService.$transaction(async (prismatx) => {
      const updateStoreRequisition = await prismatx.tb_store_requisition.update(
        {
          where: {
            id: id,
          },
          data: {
            ...workflowHeader,
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
        const findDetails = payload.details.find((d) => d.id === detail.id);
        const stages_status = Array.isArray(detail.stages_status)
          ? (detail.stages_status as StageStatus[])
          : [];
        const history = (detail.history as any[]) || [];
        const latestStageStatus = stages_status[stages_status.length - 1];

        if (findDetails.stage_status === state_status.approve) {
          continue;
        } else if (findDetails.stage_status === state_status.submit) {
          stages_status.push({
            seq: 1,
            status: findDetails.stage_status,
            name: workflowHeader.workflow_previous_stage,
            message: findDetails?.stage_message || 'submit for approval',
          });
        } else if (
          latestStageStatus?.status === state_status.pending &&
          latestStageStatus?.name === workflowHeader.workflow_previous_stage
        ) {
          stages_status[stages_status.length - 1] = {
            seq: stages_status.length,
            status: findDetails.stage_status,
            name: workflowHeader.workflow_previous_stage,
            message: findDetails.stage_message,
          };
        } else {
          stages_status.push({
            seq: stages_status.length + 1,
            status: findDetails.stage_status,
            name: workflowHeader.workflow_previous_stage,
            message: findDetails.stage_message,
          });
        }

        history.push({
          seq: history.length + 1,
          status: findDetails.stage_status,
          name: workflowHeader.workflow_previous_stage,
          message: findDetails.stage_message,
          user: {
            id: this.userId,
          },
        });

        await prismatx.tb_store_requisition_detail.update({
          where: { id: detail.id },
          data: {
            stages_status: stages_status,
            history: history,
            updated_by_id: this.userId,
            approved_qty: Number(detail.requested_qty),
            current_stage_status: '',
          },
        });
      }

      return updateStoreRequisition;
    });

    return Result.ok({ id: tx.id });
  }

  @TryCatch
  async update(
    id: string,
    updatePayload: any,
    updateSRDetail: any,
  ): Promise<Result<any>> {
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
        let lastSequenceNo =
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
        const sequenceNo = lastSequenceNo?.sequence_no || 1;
        const createStoreRequisitionDetailObject =
          updateSRDetail.store_requisition_detail.add.map((item) => ({
            ...item,
            sequence_no: sequenceNo + 1,
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

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      StoreRequisitionService.name,
    );

    const storeRequisition =
      await this.prismaService.tb_store_requisition.findFirst({
        where: { id },
      });
    if (!storeRequisition) {
      throw new Error('Store requisition not found');
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      await prisma.tb_store_requisition_detail.deleteMany({
        where: { store_requisition_id: id },
      });
      await prisma.tb_store_requisition.delete({
        where: { id },
      });

      return { id };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async approve(id: string, workflow, payload: any[]): Promise<Result<any>> {
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
        const latestStageStatus =
          findSRDoc.stages_status[
            (findSRDoc.stages_status as StageStatus[]).length - 1
          ];
        const stages_status: StageStatus[] = findSRDoc?.stages_status as any;
        const history: any[] = (findSRDoc?.history as any) || [];

        if (latestStageStatus.status === state_status.reject) {
          continue;
        } else if (
          latestStageStatus.status === state_status.pending &&
          latestStageStatus.name === workflow.workflow_previous_stage
        ) {
          stages_status[stages_status.length - 1] = {
            ...latestStageStatus,
            status: detail.state_status || '',
            message: detail.state_message || '',
          };
        } else {
          stages_status.push({
            seq: stages_status.length + 1,
            status: detail.state_status || '',
            name: workflow.workflow_previous_stage,
            message: detail.state_message || '',
          });
        }

        history.push({
          seq: history.length + 1,
          status: detail.state_status || '',
          name: workflow.workflow_previous_stage,
          message: detail.state_message || '',
          user: {
            id: this.userId,
          },
        });

        delete detail.state_message;
        delete detail.state_status;
        delete detail.store_requisition_id;

        const updateDto = JSON.parse(
          JSON.stringify({
            id: undefined,
            ...detail,
          }),
        );

        await this.prismaService.tb_store_requisition_detail.update({
          where: {
            id: detail.id,
          },
          data: {
            ...updateDto,
            doc_version: { increment: 1 },
            stages_status: stages_status,
            history: history,
            updated_by_id: this.userId,
            current_stage_status: '',
          },
        });
      }

      return id;
    });

    return Result.ok({ id: storeRequisition.id });
  }

  @TryCatch
  async reject(
    id: string,
    payload: RejectStoreRequisitionDto,
  ): Promise<Result<any>> {
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

    const tx = await this.prismaService.$transaction(async (txp) => {
      for (const detail of storeRequisitionDetail) {
        const findSR = payload.details.find((d) => d.id === detail.id);
        let stages_status = detail.stages_status as any;
        stages_status = stages_status.map((stage) => {
          return {
            ...stage,
            status: 'reject',
          };
        });

        stages_status.push({
          seq: stages_status.length + 1,
          status: findSR.stage_status,
          name: storeRequisition.workflow_current_stage,
          message: findSR.stage_message,
        });

        await txp.tb_store_requisition_detail.update({
          where: {
            id: detail.id,
          },
          data: {
            stages_status: stages_status,
            updated_by_id: this.userId,
            current_stage_status: '',
          },
        });
      }
      await txp.tb_store_requisition.update({
        where: {
          id,
        },
        data: {
          doc_status: enum_doc_status.voided,
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: storeRequisition.id });
  }

  async review(
    id: string,
    payload: ReviewStoreRequisitionDto,
  ): Promise<Result<any>> {
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

    await this.prismaService.$transaction(async (txp) => {
      for (const detail of storeRequisitionDetail) {
        const findSR = payload.details.find((d) => d.id === detail.id);
        const stages_status = detail.stages_status as any;

        stages_status.push({
          seq: stages_status.length + 1,
          status: findSR.stage_status,
          name: storeRequisition.workflow_current_stage,
          message: findSR.stage_message,
        });

        await txp.tb_store_requisition_detail.update({
          where: {
            id: detail.id,
          },
          data: {
            stages_status: stages_status,
            updated_by_id: this.userId,
            current_stage_status: findSR.stage_status,
          },
        });
      }

      await txp.tb_store_requisition.update({
        where: {
          id,
        },
        data: {
          workflow_current_stage: payload.des_stage,
          workflow_previous_stage: storeRequisition.workflow_current_stage,
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
      { type: 'SR', user_id: this.userId, tenant_id: this.bu_code },
    );
    const response = await firstValueFrom(res);
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
        tenant_id: this.bu_code,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);
    const srNo = generateCodeResponse.data.code;

    return srNo;
  }

  @TryCatch
  async findAllByStatus(
    status: string,
    paginate: IPaginate,
  ): Promise<Result<any>> {
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

  @TryCatch
  async findAllMyPending(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllMyPending', user_id, bu_code, paginate },
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

    const tenant = await this.tenantService.getdb_connection(user_id, bu_code);

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const bu_detail = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        code: bu_code,
      },
    });

    if (!bu_detail) {
      return Result.error(
        `Business unit ${bu_code} not found`,
        ErrorCode.NOT_FOUND,
      );
    }

    const standardQuery = q.findMany();

    const storeRequisitions = await prisma.tb_store_requisition
      .findMany({
        ...standardQuery,
        where: {
          ...standardQuery.where,
          OR: [
            {
              user_action: {
                path: ['execute'],
                array_contains: user_id,
              },
            },
            {
              doc_status: enum_doc_status.draft,
              requestor_id: user_id,
            },
          ],
        },
        include: {
          tb_store_requisition_detail: true,
        },
      })
      .then((res) => {
        const mapSr = res.map((sr) => {
          const store_requisition_detail = sr['tb_store_requisition_detail'];
          delete sr['tb_store_requisition_detail'];

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
      where: {
        ...standardQuery.where,
        OR: [
          {
            user_action: {
              path: ['execute'],
              array_contains: user_id,
            },
          },
          {
            doc_status: enum_doc_status.draft,
            requestor_id: user_id,
          },
        ],
      },
    });

    const serializedStoreRequisitions = storeRequisitions.map((item) =>
      StoreRequisitionListItemResponseSchema.parse(item),
    );

    return Result.ok({
      bu_code: bu_code,
      bu_name: bu_detail.name,
      paginate: {
        total: total,
        page: Number(paginate.page),
        perpage: Number(paginate.perpage),
        pages: total == 0 ? 1 : Math.ceil(total / Number(paginate.perpage)),
      },
      data: serializedStoreRequisitions,
    });
  }

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
    } catch (error: any) {
      this.logger.error(error.message, {
        file: StoreRequisitionService.name,
        function: 'getBus',
        userId,
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.message || 'An error occurred while retrieving business unit',
        },
      };
    }
  }

  async findAllMyPendingCount(user_id: string, bu_code: string): Promise<any> {
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

    let bu_codes: string = '';

    if (bu_code == '' || bu_code == undefined || bu_code == null) {
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
      bu_codes = bu_code;
    }

    for (const code of bu_codes) {
      const tenant = await this.tenantService.getdb_connection(user_id, code);

      if (!tenant) {
        return {
          response: {
            status: HttpStatus.NO_CONTENT,
            message: 'Tenant not found',
          },
        };
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
        return {
          response: {
            status: HttpStatus.NO_CONTENT,
            message: `Business unit ${code} not found`,
          },
        };
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
    }

    const total = results.reduce((acc, curr) => acc + curr.total, 0);
    this.logger.debug({
      function: 'findAllMyPendingCount',
      user_id,
      total,
    });

    return Result.ok({ pending: total });
  }
}
