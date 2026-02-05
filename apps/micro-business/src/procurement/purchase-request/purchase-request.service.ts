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
  enum_product_status_type,
  enum_purchase_request_doc_status,
  enum_stage_role,
  PrismaClient,
  PrismaClient_TENANT,
} from '@repo/prisma-shared-schema-tenant';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { CommonLogic } from '@/common/common.logic';
import { getPattern } from '@/common/common.helper';
import { format } from 'date-fns';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPurchaseRequestDetail,
  IPurchaseRequest,
  state_status,
  RejectPurchaseRequestDto,
  Stage,
  ReviewPurchaseRequestDto,
  SubmitPurchaseRequest,
  GlobalApiReturn,
  IDefaultCurrencyObject,
  PurchaseRequestDetailResponseSchema,
  PurchaseRequestListItemResponseSchema,
  TryCatch,
  Result,
  ErrorCode,
} from '@/common';
import { stat } from 'fs';
import { StageStatus, WorkflowHeader } from './interface/workflow.interface';
import { find, firstValueFrom, last } from 'rxjs';
import { de } from 'zod/v4/locales';
import { equal } from 'assert';
import { request } from 'http';
import getPaginationParams from '@/common/helpers/pagination.params';
import * as ExcelJS from 'exceljs';
import type {
  TDocumentDefinitions,
  Content,
  TableCell,
} from 'pdfmake/interfaces';
import { CalculatePurchaseRequestDetail } from './interface/CalculatePurchaseRequestDetail.dto';
import { getCalculatePriceInfo } from './logic/calculate.priceinfo.logic';
import { boolean } from 'zod';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class PurchaseRequestService {
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
    PurchaseRequestService.name,
  );

  async initializePrismaService(
    bu_code: string,
    userId: string,
  ): Promise<void> {
    this._bu_code = bu_code;
    this._userId = userId;
    this._prismaService = await this.tenantService.prismaTenantInstance(
      bu_code,
      userId,
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

    private readonly commonLogic: CommonLogic,
    private readonly tenantService: TenantService,
  ) { }

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
      PurchaseRequestService.name,
    );
    const permission: string[] =
      userData?.permissions?.['procurement.purchase_request'] ?? [];

    let buildQuery = {};

    // Check permissions from most permissive to least permissive
    if (permission.includes('view_all')) {
      // No filter - user can see all PRs
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

    const purchaseRequest = await this.prismaService.tb_purchase_request
      .findFirst({
        where: {
          id: id,
          ...buildQuery,
        },
        include: {
          tb_purchase_request_detail: true,
        },
      })
      .then(async (res) => {
        if (!res) {
          throw new UnauthorizedException(
            'Purchase request not found or access denied',
          );
        }

        if (res?.tb_purchase_request_detail?.length > 0) {
          for (const detail of res.tb_purchase_request_detail) {
            for (const key in detail) {
              if (
                key.includes('qty') ||
                key.includes('factor') ||
                key.includes('amount') ||
                [
                  'price',
                  'total_price',
                  'exchange_rate',
                  'discount_rate',
                  'base_total_price',
                  'tax_rate',
                ].includes(key)
              ) {
                detail[key] = Number(detail[key]);
              }
            }
          }
        }
        const purchase_request_detail = res['tb_purchase_request_detail'];
        delete res['tb_purchase_request_detail'];

        // Special case: draft PR owned by requestor should have "create" role
        let returningRole: enum_stage_role;

        if (
          res.pr_status === enum_purchase_request_doc_status.draft &&
          res.requestor_id === this.userId
        ) {
          returningRole = enum_stage_role.create;
        } else {
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

          const userActionExecute = (res.user_action as { execute: any[] })?.execute || [];
          const userIds: string[] = userActionExecute.map((u: any) =>
            typeof u === 'string' ? u : u?.user_id
          ).filter(Boolean);

          returningRole = userIds.includes(this.userId)
            ? (currentWorkflowDetail.role as enum_stage_role)
            : enum_stage_role.view_only;
        }

        return {
          ...res,
          purchase_request_detail,
          role: returningRole,
        };
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const serializedPurchaseRequest =
      PurchaseRequestDetailResponseSchema.parse(purchaseRequest);

    return Result.ok(serializedPurchaseRequest);
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
      PurchaseRequestService.name,
    );
    const defaultSearchFields = ['pr_no', 'note'];

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
    console.log('Processing BU code:', bu_code);

    for (const code of bu_code) {
      const userData = userDatas.find((ud) => ud.bu_code === code);
      const permission =
        userData?.permissions?.['procurement.purchase_request'] ?? [];

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

      let defaultCurrency = {
        id: null,
        name: '',
        code: '',
        symbol: '',
        decimal_places: null,
      };

      const defaultCurrencyObj: IDefaultCurrencyObject = (
        bu_detail.config as { value: IDefaultCurrencyObject; key: string }[]
      )?.find((c) => c?.key === 'currency_base').value;

      if (defaultCurrencyObj) {
        const currency = await prisma.tb_currency.findFirst({
          where: {
            id: defaultCurrencyObj.currency_id,
          },
        });

        defaultCurrency = {
          id: currency?.id,
          name: currency?.name || '',
          code: currency?.code || '',
          symbol: currency?.symbol || '',
          decimal_places: currency?.decimal_places || null,
        };
      }

      const queryFromHeader = q.findMany();

      // Check permissions from most permissive to least permissive
      if (permission.includes('view_all')) {
        // No filter - user can see all PRs
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
        queryFromHeader.where = {
          ...queryFromHeader.where,
          department_id: department?.department_id,
        };
      } else if (permission.includes('view')) {
        queryFromHeader.where = {
          ...queryFromHeader.where,
          requestor_id: user_id,
        };
      }
      const purchaseRequests = await prisma.tb_purchase_request
        .findMany({
          ...queryFromHeader,
          include: {
            tb_purchase_request_detail: true,
          },
        })
        .then((res) => {
          const mapPr = res.map((pr) => {
            const purchase_request_detail = pr['tb_purchase_request_detail'];
            delete pr['tb_purchase_request_detail'];
            let total_amount = 0;
            const PRdetailPrices = [];

            for (const detail of purchase_request_detail) {
              total_amount += Number(detail.total_price || 0);
              PRdetailPrices.push({
                price: Number(detail.total_price || 0),
                total_price: Number(detail.total_price || 0),
              });
            }
            const returnPR = {
              id: pr.id,
              pr_no: pr.pr_no,
              pr_date: pr.pr_date,
              description: pr.description,
              pr_status: pr.pr_status,
              requestor_name: pr.requestor_name,
              department_name: pr.department_name,
              workflow_name: pr.workflow_name,
              created_at: pr.created_at,
              purchase_request_detail: PRdetailPrices,
              total_amount,
              workflow_current_stage: pr.workflow_current_stage,
              workflow_next_stage: pr.workflow_next_stage,
              workflow_previous_stage: pr.workflow_previous_stage,
              last_action: pr.last_action,
            };

            return returnPR;
          });

          return mapPr;
        });

      const total = await prisma.tb_purchase_request.count({
        where: queryFromHeader.where,
      });

      const perpage = Math.ceil(total / Number(paginate.perpage));

      const serializedPurchaseRequests = purchaseRequests.map((item) =>
        PurchaseRequestListItemResponseSchema.parse(item),
      );

      results.push({
        currency: defaultCurrency,
        bu_code: code,
        bu_name: bu_detail.name,
        paginate: {
          total: total,
          page: Number(paginate.page),
          perpage: Number(paginate.perpage),
          pages: perpage < 1 ? 1 : perpage,
        },
        data: serializedPurchaseRequests,
      });
    }

    return Result.ok(results);
  }

  @TryCatch
  async findAllWorkflowStagesByPr(
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    const tenant = await this.tenantService.getdb_connection(user_id, bu_code);

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const results = await prisma.tb_purchase_request.findMany({
      where: {
        requestor_id: user_id,
      },
      select: {
        workflow_id: true,
      },
      distinct: ['workflow_id'],
    });

    const workflowCallReq = this.masterService.send(
      { cmd: 'workflows.get-all-workflows-stages', service: 'workflows' },
      {
        workflow_ids: results.map((r) => r.workflow_id),
        user_id: user_id,
        bu_code: bu_code,
      },
    );
    const CallCurrentWorkflowDetail: GlobalApiReturn<string[]> =
      await firstValueFrom(workflowCallReq);

    return Result.ok(CallCurrentWorkflowDetail.data);
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
        file: PurchaseRequestService.name,
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

  @TryCatch
  async findAllMyPending(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id, bu_code, paginate },
      PurchaseRequestService.name,
    );
    const defaultSearchFields = ['pr_no', 'note'];

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

      let defaultCurrency = {
        id: null,
        name: '',
        code: '',
        symbol: '',
        decimal_places: null,
      };

      const defaultCurrencyObj: IDefaultCurrencyObject = (
        bu_detail.config as { value: IDefaultCurrencyObject; key: string }[]
      )?.find((c) => c?.key === 'currency_base')?.value;
      if (defaultCurrencyObj) {
        const currency = await prisma.tb_currency.findFirst({
          where: {
            id: defaultCurrencyObj.currency_id,
          },
        });

        defaultCurrency = {
          id: currency?.id,
          name: currency?.name,
          code: currency?.code,
          symbol: currency?.symbol,
          decimal_places: currency?.decimal_places,
        };
      }

      const standardQuery = q.findMany();

      const purchaseRequests = await prisma.tb_purchase_request
        .findMany({
          ...standardQuery,
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
                pr_status: enum_purchase_request_doc_status.draft,
                requestor_id: user_id,
              },
            ],
          },
          include: {
            tb_purchase_request_detail: true,
          },
        })
        .then((res) => {
          const mapPr = res.map((pr) => {
            const purchase_request_detail = pr['tb_purchase_request_detail'];
            delete pr['tb_purchase_request_detail'];
            let total_amount = 0;
            const PRdetailPrices = [];

            for (const detail of purchase_request_detail) {
              total_amount += Number(detail.total_price || 0);
              PRdetailPrices.push({
                price: Number(detail.total_price || 0),
                total_price: Number(detail.total_price || 0),
              });
            }
            const returnPR = {
              id: pr.id,
              pr_no: pr.pr_no,
              pr_date: pr.pr_date,
              description: pr.description,
              pr_status: pr.pr_status,
              requestor_name: pr.requestor_name,
              department_name: pr.department_name,
              workflow_name: pr.workflow_name,
              created_at: pr.created_at,
              purchase_request_detail: PRdetailPrices,
              total_amount,
              workflow_current_stage: pr.workflow_current_stage,
              workflow_next_stage: pr.workflow_next_stage,
              workflow_previous_stage: pr.workflow_previous_stage,
              last_action: pr.last_action,
            };

            return returnPR;
          });

          return mapPr;
        });

      const total = await prisma.tb_purchase_request.count({
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
              pr_status: enum_purchase_request_doc_status.draft,
              requestor_id: user_id,
            },
          ],
        },
      });

      const serializedPurchaseRequests = purchaseRequests.map((item) =>
        PurchaseRequestListItemResponseSchema.parse(item),
      );

      results.push({
        currency: defaultCurrency,
        bu_code: code,
        bu_name: bu_detail.name,
        paginate: {
          total: total,
          page: Number(paginate.page),
          perpage: Number(paginate.perpage),
          pages: total == 0 ? 1 : Math.ceil(total / Number(paginate.perpage)),
        },
        data: serializedPurchaseRequests,
      });
    }

    return Result.ok(results);
  }

  @TryCatch
  async create(
    createPR: IPurchaseRequest,
    createPRDetail: IPurchaseRequestDetail[],
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        createPR,
        createPRDetail,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const tx = await this.prismaService.$transaction(async (prisma) => {
      if (!createPR.pr_date) {
        throw new Error('PR date is required');
      }

      const prDate = new Date(createPR.pr_date).toISOString();

      const purchaseRequestObject = JSON.parse(
        JSON.stringify({
          ...createPR,
          pr_no: 'draft-' + format(new Date(), 'yyyyMMddHHmmss'),
          pr_date: prDate,
          created_by_id: this.userId,
          last_action: null,
        }),
      );

      const createPurchaseRequest = await prisma.tb_purchase_request.create({
        data: purchaseRequestObject,
      });

      let sequence_no = 1;
      if (createPRDetail.length > 0) {
        const createPurchaseRequestObject = createPRDetail.map((item) => ({
          ...item,
          sequence_no: sequence_no++,
          purchase_request_id: createPurchaseRequest.id,
          created_by_id: this.userId,
        }));

        await prisma.tb_purchase_request_detail.createMany({
          data: createPurchaseRequestObject,
        });
      }

      return { id: createPurchaseRequest.id };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async submit(
    id: string,
    payload: SubmitPurchaseRequest,
    workflowHeader: WorkflowHeader,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'submit', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          id: id,
          pr_status: enum_purchase_request_doc_status.draft,
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const newPrNo = await this.generatePRNo(
      new Date(purchaseRequest.pr_date).toISOString(),
    );

    const tx = await this.prismaService.$transaction(async (prismatx) => {
      const updatePurchaseRequest = await prismatx.tb_purchase_request.update({
        where: {
          id: id,
        },
        data: {
          ...workflowHeader,
          doc_version: { increment: 1 },
          pr_status: enum_purchase_request_doc_status.in_progress,
          pr_no: newPrNo,
        },
      });

      const PRdetail =
        await this.prismaService.tb_purchase_request_detail.findMany({
          where: {
            purchase_request_id: id,
          },
        });

      for (const detail of PRdetail) {
        const findDetails = payload.details.find((d) => d.id === detail.id);
        const stages_status = Array.isArray(detail.stages_status)
          ? (detail.stages_status as StageStatus[])
          : [];
        const history = (detail.history as any[]) || [];
        const latestStageStatus = stages_status[stages_status.length - 1];

        if (findDetails.stage_status === state_status.approve) {
          continue;
        } else if (
          findDetails.stage_status === state_status.submit
        ) /* 1st time this detail is being submitted */ {
          stages_status.push({
            seq: 1,
            status: findDetails.stage_status,
            name: workflowHeader.workflow_previous_stage,
            message: findDetails?.stage_message || 'submit for approval',
          });
        } else if (
          latestStageStatus.status === state_status.pending &&
          latestStageStatus.name === workflowHeader.workflow_previous_stage
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

        // if(Array.isArray(stages) && stages?.length === 0) {
        await prismatx.tb_purchase_request_detail.update({
          where: { id: detail.id },
          data: {
            stages_status: stages_status,
            history: history,
            updated_by_id: this.userId,
            approved_qty: Number(detail.requested_qty),
            approved_unit_id: detail.requested_unit_id,
            approved_unit_name: detail.requested_unit_name,
            approved_unit_conversion_factor: Number(
              detail.requested_unit_conversion_factor,
            ),
            current_stage_status: '',
          },
        });
        // }
      }

      return updatePurchaseRequest;
    });

    return Result.ok({ id: tx.id });
  }

  @TryCatch
  async update(
    id: string,
    updatePPayload: any,
    updatePRDetail: any,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        updatePPayload,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          id,
          doc_version: updatePPayload.doc_version,
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const tx = await this.prismaService.$transaction(async (prismatx) => {
      const updatePurchaseRequestData = JSON.parse(
        JSON.stringify({
          ...updatePPayload,
        }),
      );
      delete updatePurchaseRequestData.purchase_request_detail;

      const updatePurchaseRequest = await prismatx.tb_purchase_request.update({
        where: {
          id,
        },
        data: {
          ...updatePurchaseRequestData,
          doc_version: { increment: 1 },
          updated_by_id: this.userId,
        },
      });

      if (updatePRDetail?.purchase_request_detail?.remove?.length > 0) {
        for (const item of updatePRDetail.purchase_request_detail.remove) {
          await prismatx.tb_purchase_request_detail.delete({
            where: {
              id: item.id,
              purchase_request_id: id,
            },
          });
        }
      }

      if (updatePRDetail?.purchase_request_detail?.add?.length > 0) {
        const lastSequenceNo =
          await prismatx.tb_purchase_request_detail.findFirst({
            select: {
              sequence_no: true,
            },
            where: {
              purchase_request_id: id,
            },
            orderBy: {
              sequence_no: 'desc',
            },
          });
        const sequenceNo = lastSequenceNo?.sequence_no || 1;
        const createPurchaseRequestDetailObject =
          updatePRDetail.purchase_request_detail.add.map((item) => ({
            ...item,
            sequence_no: sequenceNo + 1,
            purchase_request_id: id,
            created_by_id: this.userId,
          }));
        await prismatx.tb_purchase_request_detail.createMany({
          data: createPurchaseRequestDetailObject,
        });
      }

      if (updatePRDetail?.purchase_request_detail?.update?.length > 0) {
        for (const item of updatePRDetail.purchase_request_detail.update) {
          console.log('update Item = ', item);
          await prismatx.tb_purchase_request_detail.update({
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

      // if (Array.isArray(updatePRDetail)) {
      //   for (const item of updatePRDetail) {
      //     delete item.purchase_request_id
      //     await tx.tb_purchase_request_detail.update({
      //       where: { id: item.id },
      //       data: {
      //         ...item,
      //         updated_by_id: user_id,
      //       },
      //     });
      //   }
      // }

      return { id: updatePurchaseRequest.id };
    });

    return Result.ok(tx);
  }

  async findLatestPrByPattern(pattern: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findLatestPrByPattern',
        pattern,
        tenant_id: this.bu_code,
        user_id: this.userId,
      },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          pr_no: {
            contains: `PR${pattern}`,
          },
        },
        orderBy: {
          pr_no: 'desc',
        },
      });

    return purchaseRequest;
  }

  @TryCatch
  async duplicatePr(
    ids: string[],
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'duplicatePr', ids, user_id, bu_code },
      PurchaseRequestService.name,
    );
    const tenant = await this.tenantService.getdb_connection(user_id, bu_code);

    if (!tenant) {
      throw new Error('tenant not found');
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const requestor = await this.prismaSystem.tb_user.findFirst({
      where: {
        id: user_id,
      },
    });

    const basePrData = await prisma.tb_purchase_request.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      include: {
        tb_purchase_request_detail: true,
      },
    });
    if (basePrData.length === 0) {
      return Result.error(
        'No purchase requests found to duplicate',
        ErrorCode.NOT_FOUND,
      );
    }
    const duplicatedPRs = [];
    let duplicatedPRDetails = [];

    const tx = await prisma.$transaction(async (prismatx) => {
      for (const pr of basePrData) {
        const newPr = {
          pr_no: 'draft-' + format(new Date(), 'yyyyMMddHHmmss'),
          pr_date: new Date().toISOString(),
          department_id: pr.department_id,
          department_name: pr.department_name,
          requestor_id: requestor.id,
          requestor_name: requestor.username,
          workflow_id: pr.workflow_id,
          workflow_name: pr.workflow_name,
          info: pr.info,
          description: pr.description,
          dimension: pr.dimension,
          pr_status: enum_purchase_request_doc_status.draft,
          created_by_id: user_id,
        };

        const createdPr = await prismatx.tb_purchase_request.create({
          data: newPr,
        });

        duplicatedPRs.push(createdPr.id);

        for (const detail of pr.tb_purchase_request_detail) {
          duplicatedPRDetails.push({
            purchase_request_id: createdPr.id,
            sequence_no: detail.sequence_no,
            location_id: detail.location_id,
            location_name: detail.location_name,
            location_code: detail.location_code,
            delivery_point_id: detail.delivery_point_id,
            delivery_point_name: detail.delivery_point_name,
            delivery_date: detail?.delivery_date
              ? detail?.delivery_date.toISOString()
              : null,
            product_id: detail.product_id,
            product_name: detail.product_name,
            product_local_name: detail.product_local_name,
            description: detail.description,
            requested_qty: Number(detail.requested_qty),
            requested_unit_id: detail.requested_unit_id,
            requested_unit_name: detail.requested_unit_name,
            requested_unit_conversion_factor: Number(
              detail.requested_unit_conversion_factor,
            ),
          });
        }

        await prismatx.tb_purchase_request_detail.createMany({
          data: duplicatedPRDetails,
        });
      }

      duplicatedPRDetails = [];

      return { ids: duplicatedPRs };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async splitPr(
    id: string,
    detailIds: string[],
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'splitPr', id, detailIds, user_id, bu_code },
      PurchaseRequestService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, bu_code);

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const originalPr = await prisma.tb_purchase_request.findFirst({
      where: { id },
      include: {
        tb_purchase_request_detail: true,
      },
    });

    if (!originalPr) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const detailsToSplit = originalPr.tb_purchase_request_detail.filter(
      (detail) => detailIds.includes(detail.id),
    );

    if (detailsToSplit.length === 0) {
      return Result.error(
        'No valid detail IDs provided for split',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    if (
      detailsToSplit.length === originalPr.tb_purchase_request_detail.length
    ) {
      return Result.error(
        'Cannot split all details. At least one detail must remain in the original PR',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const tx = await prisma.$transaction(async (prismatx) => {
      // Generate new PR number based on status
      let newPrNo: string;
      if (originalPr.pr_status === enum_purchase_request_doc_status.draft) {
        newPrNo = 'draft-' + format(new Date(), 'yyyyMMddHHmmss');
      } else {
        // For non-draft PRs, generate a proper PR number
        await this.initializePrismaService(bu_code, user_id);
        newPrNo = await this.generatePRNo(new Date().toISOString());
      }

      // Create new PR with same status as original
      const newPr = await prismatx.tb_purchase_request.create({
        data: {
          pr_no: newPrNo,
          pr_date: originalPr.pr_date,
          pr_status: originalPr.pr_status,
          description: originalPr.description,
          workflow_id: originalPr.workflow_id,
          workflow_name: originalPr.workflow_name,
          workflow_current_stage: originalPr.workflow_current_stage,
          workflow_previous_stage: originalPr.workflow_previous_stage,
          workflow_next_stage: originalPr.workflow_next_stage,
          workflow_history: originalPr.workflow_history as any,
          user_action: originalPr.user_action as any,
          last_action: originalPr.last_action,
          last_action_at_date: originalPr.last_action_at_date,
          last_action_by_id: originalPr.last_action_by_id,
          last_action_by_name: originalPr.last_action_by_name,
          requestor_id: originalPr.requestor_id,
          requestor_name: originalPr.requestor_name,
          department_id: originalPr.department_id,
          department_name: originalPr.department_name,
          note: originalPr.note,
          info: originalPr.info as any,
          dimension: originalPr.dimension as any,
          created_by_id: user_id,
        },
      });

      // Move details to new PR and update sequence numbers
      let newSequenceNo = 1;
      for (const detail of detailsToSplit) {
        await prismatx.tb_purchase_request_detail.update({
          where: { id: detail.id },
          data: {
            purchase_request_id: newPr.id,
            sequence_no: newSequenceNo++,
            updated_by_id: user_id,
          },
        });
      }

      // Re-sequence remaining details in original PR
      const remainingDetails = originalPr.tb_purchase_request_detail.filter(
        (detail) => !detailIds.includes(detail.id),
      );
      let originalSequenceNo = 1;
      for (const detail of remainingDetails) {
        await prismatx.tb_purchase_request_detail.update({
          where: { id: detail.id },
          data: {
            sequence_no: originalSequenceNo++,
            updated_by_id: user_id,
          },
        });
      }

      // Update original PR version
      await prismatx.tb_purchase_request.update({
        where: { id: originalPr.id },
        data: {
          doc_version: { increment: 1 },
          updated_by_id: user_id,
        },
      });

      return {
        original_pr_id: originalPr.id,
        new_pr_id: newPr.id,
        new_pr_no: newPr.pr_no,
        split_detail_count: detailsToSplit.length,
      };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: { id },
      });
    if (!purchaseRequest) {
      throw new Error('Purchase request not found');
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      await prisma.tb_purchase_request_detail.deleteMany({
        where: { purchase_request_id: id },
      });
      await prisma.tb_purchase_request.delete({
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
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          id: id,
          pr_status: enum_purchase_request_doc_status.in_progress,
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const PRDetailDocs =
      await this.prismaService.tb_purchase_request_detail.findMany({
        where: {
          purchase_request_id: id,
        },
        select: {
          id: true,
          stages_status: true,
          history: true,
        },
      });

    const tx = await this.prismaService.$transaction(async (txp) => {
      await txp.tb_purchase_request.update({
        where: {
          id,
        },
        data: {
          ...workflow,
          pr_status:
            workflow.workflow_next_stage === '-'
              ? enum_purchase_request_doc_status.approved
              : enum_purchase_request_doc_status.in_progress,
          doc_version: { increment: 1 },
          updated_by_id: this.userId,
        },
      });

      for (const detail of payload) {
        const findPRDoc = PRDetailDocs.find((d) => d.id === detail.id);
        const latestStageStatus =
          findPRDoc.stages_status[
          (findPRDoc.stages_status as StageStatus[]).length - 1
          ];
        const stages_status: StageStatus[] = findPRDoc?.stages_status as any;
        const history: any[] = (findPRDoc?.history as any) || [];

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
        delete detail.purchase_request_id;

        const updateDto = JSON.parse(
          JSON.stringify({
            id: undefined,
            ...detail,
          }),
        );

        await this.prismaService.tb_purchase_request_detail.update({
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

    return Result.ok({ id: purchaseRequest.id });
  }

  @TryCatch
  async review(
    id,
    payload: ReviewPurchaseRequestDto,
    workflow: WorkflowHeader,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'review',
        id,
        payload,
        user_id: this.userId,
        bu_code: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          id: id,
          pr_status: enum_purchase_request_doc_status.in_progress,
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const tx = await this.prismaService.$transaction(async (txp) => {
      const prDetail = await txp.tb_purchase_request_detail.findMany({
        where: {
          purchase_request_id: id,
        },
      });

      for (const detail of prDetail) {
        const payloadDetail = payload.details.find((d) => d.id === detail.id);
        if (payloadDetail.stage_status === state_status.approve) {
          continue;
        }

        const stagesStatus: StageStatus[] = detail.stages_status as any;
        const history: any[] = (detail.history as any) || [];

        history.push({
          seq: history.length + 1,
          status: state_status.review,
          name: workflow.workflow_previous_stage,
          message: payloadDetail.stage_message || '',
          user: {
            id: this.userId,
          },
        });

        for (let index = stagesStatus.length - 1; index > 0; index--) {
          if (stagesStatus[index].name === payload.des_stage) {
            stagesStatus[index] = {
              ...stagesStatus[index],
              status: state_status.pending,
            };

            break;
          } else {
            stagesStatus.splice(index + 1, stagesStatus.length - index - 1);
          }
        }

        await txp.tb_purchase_request_detail.update({
          where: {
            id: detail.id,
          },
          data: {
            stages_status: stagesStatus,
            updated_by_id: this.userId,
            current_stage_status: '',
          },
        });
      }

      await txp.tb_purchase_request.update({
        where: {
          id,
        },
        data: {
          updated_by_id: this.userId,
          ...workflow,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseRequest.id });
  }

  @TryCatch
  async reject(
    id: string,
    payload: RejectPurchaseRequestDto,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'reject', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          id: id,
          pr_status: enum_purchase_request_doc_status.in_progress,
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const purchaseRequestDetail =
      await this.prismaService.tb_purchase_request_detail.findMany({
        where: {
          purchase_request_id: id,
        },
      });

    const tx = await this.prismaService.$transaction(async (txp) => {
      for (const detail of purchaseRequestDetail) {
        const findPR = payload.details.find((d) => d.id === detail.id);
        let stages_status = detail.stages_status as any;
        stages_status = stages_status.map((stage) => {
          return {
            ...stage,
            status: 'reject',
          };
        });

        stages_status.push({
          seq: stages_status.length + 1,
          status: findPR.stage_status,
          name: purchaseRequest.workflow_current_stage,
          message: findPR.stage_message,
        });

        await txp.tb_purchase_request_detail.update({
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
      await txp.tb_purchase_request.update({
        where: {
          id,
        },
        data: {
          pr_status: enum_purchase_request_doc_status.voided,
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseRequest.id });
  }

  private async generatePRNo(PRDate: string): Promise<any> {
    this.logger.debug(
      {
        function: 'generatePRNo',
        PRDate,
        tenant_id: this.bu_code,
        user_id: this.userId,
      },
      PurchaseRequestService.name,
    );
    const pattern = await this.commonLogic.getRunningPattern(
      'PR',
      this.userId,
      this.bu_code,
    );
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

    const getDate = new Date(PRDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    const latestPR = await this.findLatestPrByPattern(datePatternValue);
    // เก็บ Running code โดยการslice
    const latestPRNumber = latestPR
      ? Number(latestPR.pr_no.slice(-Number(runningPattern.pattern)))
      : 0;

    const prNo = await this.commonLogic.generateRunningCode(
      'PR',
      getDate,
      latestPRNumber,
      this.userId,
      this.bu_code,
    );

    return prNo;
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
      PurchaseRequestService.name,
    );

    const defaultSearchFields = ['pr_no', 'note'];

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
      pr_status: status as enum_purchase_request_doc_status,
    };

    const purchaseRequests = await this.prismaService.tb_purchase_request
      .findMany({
        where: whereQry,
        orderBy: q.orderBy(),
        ...pagination,
        include: {
          tb_purchase_request_detail: true,
        },
      })
      .then((res) => {
        const mapPr = res.map((item) => {
          const purchase_request_detail = item['tb_purchase_request_detail'];
          delete item['tb_purchase_request_detail'];
          return {
            ...item,
            purchase_request_detail,
          };
        });

        return mapPr;
      });

    const total = await this.prismaService.tb_purchase_request.count({
      where: whereQry,
    });

    const serializedPurchaseRequests = purchaseRequests.map((item) =>
      PurchaseRequestListItemResponseSchema.parse(item),
    );

    return Result.ok({
      data: serializedPurchaseRequests,
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  @TryCatch
  async findAllMyPendingStages(): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAllMyPendingStages',
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const stages = await this.prismaService.tb_purchase_request.findMany({
      where: {
        workflow_current_stage: { not: null },
        OR: [
          {
            pr_status: enum_purchase_request_doc_status.draft,
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
      select: {
        workflow_current_stage: true,
      },
      distinct: ['workflow_current_stage'],
    });

    return Result.ok(stages.map((s) => s.workflow_current_stage));
  }

  /**
   * Export Purchase Request to Excel format
   */
  @TryCatch
  async exportToExcel(
    id: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: { id },
        include: {
          tb_purchase_request_detail: {
            orderBy: { sequence_no: 'asc' },
          },
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carmen System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Purchase Request');

    // Define styles
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const titleStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center' },
    };

    const labelStyle: Partial<ExcelJS.Style> = {
      font: { bold: true },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' },
      },
    };

    // Set column widths
    worksheet.columns = [
      { width: 5 }, // A - No.
      { width: 30 }, // B - Product
      { width: 20 }, // C - Location
      { width: 12 }, // D - Requested Qty
      { width: 12 }, // E - Unit
      { width: 12 }, // F - Approved Qty
      { width: 12 }, // G - Approved Unit
      { width: 15 }, // H - Delivery Date
    ];

    // Title
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PURCHASE REQUEST';
    titleCell.style = titleStyle;
    worksheet.getRow(1).height = 30;

    let currentRow = 3;

    // PR Number and Status
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'PR Number:';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    worksheet.getCell(`C${currentRow}`).value = purchaseRequest.pr_no || '';

    worksheet.getCell(`E${currentRow}`).value = 'Status:';
    worksheet.getCell(`E${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value = purchaseRequest.pr_status || '';

    currentRow++;

    // Requestor and PR Date
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Requestor:';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    worksheet.getCell(`C${currentRow}`).value =
      purchaseRequest.requestor_name || '';

    worksheet.getCell(`E${currentRow}`).value = 'PR Date:';
    worksheet.getCell(`E${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value = purchaseRequest.pr_date
      ? format(new Date(purchaseRequest.pr_date), 'dd/MM/yyyy')
      : '';

    currentRow++;

    // Department and Workflow
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Department:';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
    worksheet.getCell(`C${currentRow}`).value =
      purchaseRequest.department_name || '';

    worksheet.getCell(`E${currentRow}`).value = 'Workflow:';
    worksheet.getCell(`E${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`F${currentRow}:H${currentRow}`);
    worksheet.getCell(`F${currentRow}`).value =
      purchaseRequest.workflow_name || '';

    currentRow++;

    // Description
    if (purchaseRequest.description) {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Description:';
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`C${currentRow}:H${currentRow}`);
      worksheet.getCell(`C${currentRow}`).value = purchaseRequest.description;
      currentRow++;
    }

    currentRow++;

    // Detail table header
    const headerRow = currentRow;
    const headers = [
      'No.',
      'Product',
      'Location',
      'Req. Qty',
      'Unit',
      'Appr. Qty',
      'Appr. Unit',
      'Delivery Date',
    ];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    worksheet.getRow(headerRow).height = 25;

    currentRow++;

    // Detail rows
    purchaseRequest.tb_purchase_request_detail.forEach((detail, index) => {
      worksheet.getCell(currentRow, 1).value = index + 1;
      worksheet.getCell(currentRow, 1).alignment = { horizontal: 'center' };

      worksheet.getCell(currentRow, 2).value = detail.product_name || '';

      worksheet.getCell(currentRow, 3).value = detail.location_name || '';

      worksheet.getCell(currentRow, 4).value =
        Number(detail.requested_qty) || 0;
      worksheet.getCell(currentRow, 4).numFmt = '#,##0.00';
      worksheet.getCell(currentRow, 4).alignment = { horizontal: 'right' };

      worksheet.getCell(currentRow, 5).value = detail.requested_unit_name || '';
      worksheet.getCell(currentRow, 5).alignment = { horizontal: 'center' };

      worksheet.getCell(currentRow, 6).value = Number(detail.approved_qty) || 0;
      worksheet.getCell(currentRow, 6).numFmt = '#,##0.00';
      worksheet.getCell(currentRow, 6).alignment = { horizontal: 'right' };

      worksheet.getCell(currentRow, 7).value = detail.approved_unit_name || '';
      worksheet.getCell(currentRow, 7).alignment = { horizontal: 'center' };

      worksheet.getCell(currentRow, 8).value = detail.delivery_date
        ? format(new Date(detail.delivery_date), 'dd/MM/yyyy')
        : '';
      worksheet.getCell(currentRow, 8).alignment = { horizontal: 'center' };

      // Add borders
      for (let col = 1; col <= 8; col++) {
        worksheet.getCell(currentRow, col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow++;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const prNo = purchaseRequest.pr_no?.replace(/[^a-zA-Z0-9]/g, '_') || 'PR';
    const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${prNo}_${dateStr}.xlsx`;

    return Result.ok({
      buffer: Buffer.from(buffer),
      filename,
    });
  }

  /**
   * Print Purchase Request to PDF format
   */
  @TryCatch
  async printToPdf(
    id: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'printToPdf',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: { id },
        include: {
          tb_purchase_request_detail: {
            orderBy: { sequence_no: 'asc' },
          },
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    // Format number with thousand separator
    const formatNumber = (num: number): string => {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Build detail table rows
    const tableBody: TableCell[][] = [
      [
        { text: 'No.', style: 'tableHeader', alignment: 'center' },
        { text: 'Product', style: 'tableHeader' },
        { text: 'Location', style: 'tableHeader' },
        { text: 'Req. Qty', style: 'tableHeader', alignment: 'right' },
        { text: 'Unit', style: 'tableHeader', alignment: 'center' },
        { text: 'Delivery Date', style: 'tableHeader', alignment: 'center' },
      ],
    ];

    purchaseRequest.tb_purchase_request_detail.forEach((detail, index) => {
      tableBody.push([
        { text: (index + 1).toString(), alignment: 'center' },
        { text: detail.product_name || '' },
        { text: detail.location_name || '' },
        {
          text: formatNumber(Number(detail.requested_qty) || 0),
          alignment: 'right',
        },
        { text: detail.requested_unit_name || '', alignment: 'center' },
        {
          text: detail.delivery_date
            ? format(new Date(detail.delivery_date), 'dd/MM/yyyy')
            : '',
          alignment: 'center',
        },
      ]);
    });

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        {
          text: 'PURCHASE REQUEST',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                {
                  text: [
                    { text: 'PR Number: ', bold: true },
                    purchaseRequest.pr_no || '',
                  ],
                },
                {
                  text: [
                    { text: 'Requestor: ', bold: true },
                    purchaseRequest.requestor_name || '',
                  ],
                },
                {
                  text: [
                    { text: 'Department: ', bold: true },
                    purchaseRequest.department_name || '',
                  ],
                },
              ],
            },
            {
              width: '50%',
              stack: [
                {
                  text: [
                    { text: 'Status: ', bold: true },
                    purchaseRequest.pr_status || '',
                  ],
                },
                {
                  text: [
                    { text: 'PR Date: ', bold: true },
                    purchaseRequest.pr_date
                      ? format(new Date(purchaseRequest.pr_date), 'dd/MM/yyyy')
                      : '',
                  ],
                },
                {
                  text: [
                    { text: 'Workflow: ', bold: true },
                    purchaseRequest.workflow_name || '',
                  ],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 10],
        },
        ...(purchaseRequest.description
          ? [
            {
              text: [
                { text: 'Description: ', bold: true },
                purchaseRequest.description,
              ],
              margin: [0, 0, 0, 15] as [number, number, number, number],
            } as Content,
          ]
          : []),
        {
          table: {
            headerRows: 1,
            widths: [25, '*', 80, 50, 50, 70],
            body: tableBody,
          },
          layout: {
            hLineWidth: (i: number, node: any) =>
              i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#aaaaaa',
            vLineColor: () => '#aaaaaa',
            fillColor: (rowIndex: number) =>
              rowIndex === 0 ? '#4472C4' : null,
          },
          margin: [0, 0, 0, 15],
        },
      ],
      styles: {
        title: {
          fontSize: 18,
          bold: true,
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'white',
        },
      },
      defaultStyle: {
        fontSize: 10,
      },
    };

    // Generate PDF buffer
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const PdfMake = require('pdfmake/build/pdfmake');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const vfsFonts = require('pdfmake/build/vfs_fonts');
        PdfMake.vfs = vfsFonts.pdfMake ? vfsFonts.pdfMake.vfs : vfsFonts.vfs;

        const pdfDocGenerator = PdfMake.createPdf(docDefinition);
        pdfDocGenerator.getBuffer((buffer: Buffer) => {
          resolve(buffer);
        });
      } catch (error) {
        reject(error);
      }
    });

    const prNo = purchaseRequest.pr_no?.replace(/[^a-zA-Z0-9]/g, '_') || 'PR';
    const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${prNo}_${dateStr}.pdf`;

    return Result.ok({
      buffer: pdfBuffer,
      filename,
    });
  }

  async findDimensionsByDetailId(detail_id: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findDimensionsByDetailId',
        detail_id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const prDetail =
      await this.prismaService.tb_purchase_request_detail.findFirst({
        where: {
          id: detail_id,
        },
        select: {
          dimension: true,
        },
      });

    if (!prDetail || !prDetail.dimension) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Purchase request detail not found',
        },
      };
    }

    if (!Array.isArray(prDetail.dimension)) {
      return {
        data: [],
        response: {
          status: HttpStatus.OK,
          message: 'Dimensions retrieved successfully',
        },
      };
    } else {
      return {
        data: prDetail.dimension,
        response: {
          status: HttpStatus.OK,
          message: 'Dimensions retrieved successfully',
        },
      };
    }
  }

  async findAllMyPendingCount(user_id: string, bu_code: string): Promise<any> {
    this.logger.debug(
      { function: 'findAll', user_id, bu_code },
      PurchaseRequestService.name,
    );

    const paginate: IPaginate = {
      page: 1,
      perpage: 1,
      search: '',
      searchfields: ['pr_no', 'note'],
      filter: {},
      sort: [],
      advance: {},
    };
    const defaultSearchFields = ['pr_no', 'note'];

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

      const total = await prisma.tb_purchase_request.count({
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
              pr_status: enum_purchase_request_doc_status.draft,
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

  async findHistoryByDetailId(detail_id: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findHistoryByDetailId',
        detail_id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const prDetail =
      await this.prismaService.tb_purchase_request_detail.findFirst({
        where: {
          id: detail_id,
        },
        select: {
          history: true,
        },
      });

    if (!prDetail || !prDetail.history) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Purchase request detail not found',
        },
      };
    }

    if (!Array.isArray(prDetail.history)) {
      return {
        data: [],
        response: {
          status: HttpStatus.OK,
          message: 'History retrieved successfully',
        },
      };
    } else {
      return {
        data: prDetail.history,
        response: {
          status: HttpStatus.OK,
          message: 'History retrieved successfully',
        },
      };
    }
  }

  async findCalculatePriceInfoByDetailId(
    detail_id: string,
    data: CalculatePurchaseRequestDetail,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findCalculatePriceInfoByDetailId',
        detail_id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseRequestService.name,
    );

    const prDetail =
      await this.prismaService.tb_purchase_request_detail.findFirst({
        where: {
          id: detail_id,
        },
      });

    if (!prDetail) {
      return {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Purchase request detail not found',
        },
      };
    }

    const calculate_price_info = getCalculatePriceInfo(
      data.qty,
      Number(prDetail.pricelist_price),
      Number(prDetail.exchange_rate),
      Number(prDetail.tax_rate),
      Boolean(prDetail.is_tax_adjustment),
      Number(prDetail.tax_amount),
      Number(prDetail.discount_rate),
      Boolean(prDetail.is_discount_adjustment),
      Number(prDetail.discount_amount),
    );

    return {
      data: calculate_price_info,
      response: {
        status: HttpStatus.OK,
        message: 'Calculate price info retrieved successfully',
      },
    };
  }
}
