import {
  HttpStatus,
  HttpException,
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { trace } from '@opentelemetry/api';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  enum_last_action,
  enum_product_status_type,
  enum_pricelist_compare_type,
  enum_purchase_request_doc_status,
  enum_stage_role,
  Prisma,
  PrismaClient,
  PrismaClient_TENANT,
} from '@repo/prisma-shared-schema-tenant';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { CommonLogic } from '@/common/common.logic';
import { getPattern, calcBaseQty, calcBasePrices } from '@/common/common.helper';
import { format } from 'date-fns';
import { randomBytes } from 'crypto';

const PR_RUNNING_NO_KEY = 'pr_running_no';
const PR_DRAFT_NO_PREFIX = 'draft-';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPurchaseRequestDetail,
  IPurchaseRequest,
  stage_status,
  RejectPurchaseRequestDto,
  Stage,
  ReviewPurchaseRequestDto,
  SubmitPurchaseRequest,
  GlobalApiReturn,
  PurchaseRequestDetailResponseSchema,
  PurchaseRequestListItemResponseSchema,
  PurchaseRequestForPoResponseSchema,
  TryCatch,
  Result,
  ErrorCode,
} from '@/common';
import { StageStatus, WorkflowHeader } from './interface/workflow.interface';
import { WorkflowPersistenceHelper } from '@/common/workflow/workflow-persistence.helper';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';
import getPaginationParams from '@/common/helpers/pagination.params';
import * as ExcelJS from 'exceljs';
import type {
  TDocumentDefinitions,
  Content,
  TableCell,
} from 'pdfmake/interfaces';
import { CalculatePurchaseRequestDetail } from './interface/CalculatePurchaseRequestDetail.dto';
import { getCalculatePriceInfo } from './logic/calculate.priceinfo.logic';

const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable({ scope: Scope.REQUEST })
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
  private readonly tracer = trace.getTracer('micro-business.purchase-request');

  /**
   * Initialize the Prisma service for tenant-specific database access
   * เริ่มต้นบริการ Prisma สำหรับการเข้าถึงฐานข้อมูลเฉพาะผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
   */
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
    private readonly commonLogic: CommonLogic,
    private readonly tenantService: TenantService,
    private readonly workflowOrchestrator: WorkflowOrchestratorService,
  ) { }

  /**
   * Find a purchase request by ID with workflow stages and user permissions
   * ค้นหาใบขอซื้อตาม ID พร้อมขั้นตอนการทำงานและสิทธิ์ผู้ใช้
   * @param id - Purchase request ID / ID ของใบขอซื้อ
   * @param userData - User data with roles and permissions / ข้อมูลผู้ใช้พร้อมบทบาทและสิทธิ์
   * @returns Purchase request data with workflow info / ข้อมูลใบขอซื้อพร้อมข้อมูลขั้นตอนการทำงาน
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

        const returningRole = await this.workflowOrchestrator.resolveUserRole(
          res.pr_status === enum_purchase_request_doc_status.draft,
          res.requestor_id === this.userId,
          res.workflow_id,
          res.workflow_current_stage,
          res.user_action,
          this.userId,
          this.bu_code,
        );

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

  /**
   * Find all purchase requests across multiple business units with pagination
   * ค้นหาใบขอซื้อทั้งหมดจากหลายหน่วยธุรกิจพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Array of business unit codes / อาร์เรย์ของรหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param userDatas - User data per business unit with roles and permissions / ข้อมูลผู้ใช้ต่อหน่วยธุรกิจพร้อมบทบาทและสิทธิ์
   * @returns Paginated list of purchase requests / รายการใบขอซื้อที่แบ่งหน้าแล้ว
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

      if (bu_detail.default_currency_id) {
        const currency = await prisma.tb_currency.findFirst({
          where: {
            id: bu_detail.default_currency_id,
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

      const validPrStatuses = Object.values(enum_purchase_request_doc_status);
      const statusFilter = q.filter.find((f) => f.startsWith('pr_status|') || f.startsWith('pr_status:'));
      if (statusFilter) {
        const colonIndex = statusFilter.indexOf(':');
        const filterValue = colonIndex !== -1 ? statusFilter.substring(colonIndex + 1).trim() : '';
        if (filterValue) {
          const statusValues = filterValue.split(',').map((v) => v.trim()).filter(Boolean);
          const invalidValues = statusValues.filter((v) => !validPrStatuses.includes(v as enum_purchase_request_doc_status));
          if (invalidValues.length > 0) {
            return Result.error(
              `Invalid pr_status value(s): ${invalidValues.map((v) => `"${v}"`).join(', ')}. Valid values are: ${validPrStatuses.join(', ')}`,
              ErrorCode.INVALID_ARGUMENT,
            );
          }
        }
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
        .findMany(queryFromHeader)
        .then((res) =>
          res.map((pr) => ({
            id: pr.id,
            pr_no: pr.pr_no,
            pr_date: pr.pr_date,
            description: pr.description,
            pr_status: pr.pr_status,
            requestor_id: pr.requestor_id,
            requestor_name: pr.requestor_name,
            department_id: pr.department_id,
            department_name: pr.department_name,
            workflow_id: pr.workflow_id,
            workflow_name: pr.workflow_name,
            created_at: pr.created_at,
            base_net_amount: Number(pr.base_net_amount ?? 0),
            base_total_amount: Number(pr.base_total_amount ?? 0),
            workflow_current_stage: pr.workflow_current_stage,
            workflow_next_stage: pr.workflow_next_stage,
            workflow_previous_stage: pr.workflow_previous_stage,
            last_action: pr.last_action,
          })),
        );

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

  /**
   * Find all workflow stages associated with purchase requests
   * ค้นหาขั้นตอนการทำงานทั้งหมดที่เกี่ยวข้องกับใบขอซื้อ
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns List of workflow stages / รายการขั้นตอนการทำงาน
   */
  @TryCatch
  async findAllWorkflowStagesByPr(
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

    const results = await prisma.tb_purchase_request.findMany({
      where: {
        requestor_id: user_id,
      },
      select: {
        workflow_id: true,
      },
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
   * Get business units accessible by a user
   * ดึงหน่วยธุรกิจที่ผู้ใช้สามารถเข้าถึงได้
   * @param userId - User ID / ID ผู้ใช้
   * @param is_active - Filter by active status / กรองตามสถานะใช้งาน
   * @param version - API version / เวอร์ชัน API
   * @returns List of business units / รายการหน่วยธุรกิจ
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
        file: PurchaseRequestService.name,
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
   * Find all purchase requests pending approval for the current user across business units
   * ค้นหาใบขอซื้อทั้งหมดที่รอการอนุมัติของผู้ใช้ปัจจุบันจากทุกหน่วยธุรกิจ
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code(s) / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of pending purchase requests / รายการใบขอซื้อที่รออนุมัติที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAllMyPending(
    user_id: string,
    bu_code: string | string[],
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
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
            function: 'findAllMyPending',
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
            function: 'findAllMyPending',
            message: `Business unit ${code} not found, skipping`,
          });
          continue;
        }

        let defaultCurrency = {
          id: null,
          name: '',
          code: '',
          symbol: '',
          decimal_places: null,
        };

        if (bu_detail.default_currency_id) {
          const currency = await prisma.tb_currency.findFirst({
            where: {
              id: bu_detail.default_currency_id,
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

        const userPermissionFilter = {
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
        };

        const combinedWhere = {
          AND: [
            standardQuery.where,
            userPermissionFilter,
          ],
        };

        const purchaseRequests = await prisma.tb_purchase_request
          .findMany({
            ...standardQuery,
            where: combinedWhere,
            include: {
              tb_purchase_request_detail: true,
            },
          })
          .then((res) => {
            const mapPr = res.map((pr) => {
              const purchase_request_detail = pr['tb_purchase_request_detail'];
              delete pr['tb_purchase_request_detail'];
              let base_net_amount = 0;
              let base_total_amount = 0;

              for (const detail of purchase_request_detail) {
                base_net_amount += Number(detail.base_net_amount || 0);
                base_total_amount += Number(detail.base_total_price || 0);
              }
              const returnPR = {
                id: pr.id,
                pr_no: pr.pr_no,
                pr_date: pr.pr_date,
                description: pr.description,
                pr_status: pr.pr_status,
                requestor_id: pr.requestor_id,
                requestor_name: pr.requestor_name,
                department_id: pr.department_id,
                department_name: pr.department_name,
                workflow_id: pr.workflow_id,
                workflow_name: pr.workflow_name,
                created_at: pr.created_at,
                base_net_amount,
                base_total_amount,
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
          where: combinedWhere,
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
      } catch (error) {
        this.logger.warn({
          function: 'findAllMyPending',
          message: `Error processing bu_code: ${code}, skipping`,
          error: error instanceof Error ? error.message : error,
        });
        continue;
      }
    }

    return Result.ok(results);
  }

  /**
   * Create a new purchase request with header, detail lines, and generate a running PR number
   * สร้างใบขอซื้อใหม่พร้อมส่วนหัว รายการรายละเอียด และสร้างเลขที่ใบขอซื้ออัตโนมัติ
   * @param createPR - Purchase request header data / ข้อมูลส่วนหัวใบขอซื้อ
   * @param createPRDetail - Purchase request detail lines / รายการรายละเอียดใบขอซื้อ
   * @returns Created purchase request ID and PR number / ID และเลขที่ใบขอซื้อที่สร้างแล้ว
   */
  @TryCatch
  async create(
    createPR: IPurchaseRequest,
    createPRDetail: IPurchaseRequestDetail[],
  ): Promise<Result<unknown>> {
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

    const tx = await this.tracer.startActiveSpan('pr.create.prisma-transaction', async (span) => {
      try {
        span.setAttribute('pr.detail_count', createPRDetail.length);
        const result = await this.prismaService.$transaction(async (prisma) => {
          if (!createPR.pr_date) {
            throw new Error('PR date is required');
          }

          const prDate = new Date(createPR.pr_date).toISOString();

          const newPrNo = await this.generatePrNoFromConfig(prisma);

          const purchaseRequestObject = JSON.parse(
            JSON.stringify({
              ...createPR,
              pr_no: newPrNo,
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
              requested_base_qty: calcBaseQty(item.requested_qty, item.requested_unit_conversion_factor),
              approved_base_qty: calcBaseQty(item.approved_qty, item.approved_unit_conversion_factor),
              foc_base_qty: calcBaseQty(item.foc_qty, item.foc_unit_conversion_factor),
              ...calcBasePrices(item, item.exchange_rate),
            }));

            await prisma.tb_purchase_request_detail.createMany({
              data: createPurchaseRequestObject as any,
            });
          }

          await this.recalculatePurchaseRequestTotals(prisma, createPurchaseRequest.id);

          return { id: createPurchaseRequest.id };
        });
        span.setAttribute('pr.id', result?.id || '');
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: 2 });
        throw error;
      } finally {
        span.end();
      }
    });

    return Result.ok(tx);
  }

  /**
   * Submit a purchase request for approval and initialize the workflow
   * ส่งใบขอซื้อเพื่อขออนุมัติและเริ่มต้นขั้นตอนการทำงาน
   * @param id - Purchase request ID / ID ของใบขอซื้อ
   * @param payload - Submission data / ข้อมูลการส่ง
   * @param workflowHeader - Workflow header configuration / การตั้งค่าส่วนหัวขั้นตอนการทำงาน
   * @returns Submitted purchase request ID / ID ของใบขอซื้อที่ส่งแล้ว
   */
  @TryCatch
  async submit(
    id: string,
    payload: SubmitPurchaseRequest,
    workflowHeader: WorkflowHeader,
    pricelistMap?: Map<string, { pricelist_detail_id: string | null; pricelist_no: string | null; pricelist_price: number; pricelist_type: enum_pricelist_compare_type; vendor_id: string | null; vendor_name: string | null }>,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'submit', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: {
          id: id,
          OR: [
            { pr_status: enum_purchase_request_doc_status.draft },
            { pr_status: enum_purchase_request_doc_status.in_progress, last_action: enum_last_action.reviewed },
          ],
        },
      });

    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    const isDraft = purchaseRequest.pr_status === enum_purchase_request_doc_status.draft;
    const newPrNo = isDraft
      ? await this.generatePRNo(new Date(purchaseRequest.pr_date).toISOString())
      : purchaseRequest.pr_no;

    const tx = await this.prismaService.$transaction(async (prismatx) => {
      const updatePurchaseRequest = await prismatx.tb_purchase_request.update({
        where: {
          id: id,
        },
        data: {
          ...workflowHeader,
          workflow_history: workflowHeader.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflowHeader.user_action as unknown as Prisma.InputJsonValue,
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
        const currentStages: StageStatus[] = Array.isArray(detail.stages_status)
          ? (detail.stages_status as unknown as StageStatus[])
          : [];

        // Use payload detail if provided, otherwise auto-generate based on current stages_status
        const findDetails = payload.details?.length > 0
          ? payload.details.find((d) => d.id === detail.id)
          : WorkflowPersistenceHelper.autoGenerateSubmitDetail(detail.id, currentStages);
        if (!findDetails) continue;

        const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
          currentStages, findDetails, workflowHeader.workflow_previous_stage,
        );

        if (skipped) {
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: findDetails.stage_status,
            stages: currentStages,
            workflowCurrentStage: workflowHeader.workflow_current_stage,
          });
          await prismatx.tb_purchase_request_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, updated_by_id: this.userId },
          });
          continue;
        }

        const history = WorkflowPersistenceHelper.appendHistory(
          (detail.history as any[]) || [],
          { status: findDetails.stage_status, name: workflowHeader.workflow_previous_stage, message: findDetails.stage_message, userId: this.userId },
        );

        const priceData = pricelistMap?.get(detail.id);
        const approvedBaseQty = calcBaseQty(
          detail.requested_qty,
          detail.requested_unit_conversion_factor,
        );
        await prismatx.tb_purchase_request_detail.update({
          where: { id: detail.id },
          data: {
            stages_status: stages as unknown as Prisma.InputJsonValue,
            history: history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            approved_qty: Number(detail.requested_qty),
            approved_unit_id: detail.requested_unit_id,
            approved_unit_name: detail.requested_unit_name,
            approved_unit_conversion_factor: Number(detail.requested_unit_conversion_factor),
            approved_base_qty: approvedBaseQty,
            requested_base_qty: approvedBaseQty,
            foc_base_qty: calcBaseQty(detail.foc_qty, detail.foc_unit_conversion_factor),
            current_stage_status: WorkflowPersistenceHelper.resolveCurrentStageStatus({
              payloadStatus: findDetails.stage_status,
              stages,
              workflowCurrentStage: workflowHeader.workflow_current_stage,
            }),
            ...(priceData && {
              pricelist_detail_id: priceData.pricelist_detail_id,
              pricelist_no: priceData.pricelist_no,
              pricelist_price: priceData.pricelist_price,
              pricelist_type: priceData.pricelist_type as any,
              vendor_id: priceData.vendor_id,
              vendor_name: priceData.vendor_name,
            }),
            ...calcBasePrices(
              {
                ...detail,
                ...(priceData && { pricelist_price: priceData.pricelist_price }),
              },
              detail.exchange_rate,
            ),
          },
        });
      }

      await this.recalculatePurchaseRequestTotals(prismatx, id);

      return updatePurchaseRequest;
    });

    return Result.ok({ id: tx.id });
  }

  /**
   * Update a purchase request header, manage detail lines (add, update, delete), and handle workflow state
   * อัปเดตส่วนหัวใบขอซื้อ จัดการรายการรายละเอียด (เพิ่ม อัปเดต ลบ) และจัดการสถานะขั้นตอนการทำงาน
   * @param id - Purchase request ID / ID ของใบขอซื้อ
   * @param updatePPayload - Updated purchase request data / ข้อมูลใบขอซื้อที่อัปเดต
   * @returns Updated purchase request ID / ID ของใบขอซื้อที่อัปเดตแล้ว
   */
  @TryCatch
   
  async update(
    id: string,
    updatePPayload: any,
    updatePRDetail: any,
  ): Promise<Result<unknown>> {
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

    // Fetch existing details for history appending
    const existingDetails = await this.prismaService.tb_purchase_request_detail.findMany({
      where: { purchase_request_id: id },
      select: { id: true, history: true },
    });
    const existingDetailMap = new Map(existingDetails.map((d) => [d.id, d]));

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
        let sequenceNo = lastSequenceNo?.sequence_no || 0;
        const createPurchaseRequestDetailObject =
          updatePRDetail.purchase_request_detail.add.map((item) => ({
            ...item,
            sequence_no: ++sequenceNo,
            purchase_request_id: id,
            created_by_id: this.userId,
            requested_base_qty: calcBaseQty(item.requested_qty, item.requested_unit_conversion_factor),
            approved_base_qty: calcBaseQty(item.approved_qty, item.approved_unit_conversion_factor),
            foc_base_qty: calcBaseQty(item.foc_qty, item.foc_unit_conversion_factor),
            ...calcBasePrices(item, item.exchange_rate),
          }));
        await prismatx.tb_purchase_request_detail.createMany({
          data: createPurchaseRequestDetailObject,
        });
      }

      if (updatePRDetail?.purchase_request_detail?.update?.length > 0) {
        for (const item of updatePRDetail.purchase_request_detail.update) {
          const existing = existingDetailMap.get(item.id);
          const history = WorkflowPersistenceHelper.appendHistory(
            (existing?.history as unknown as Record<string, unknown>[]) || [],
            { status: 'save', name: purchaseRequest.workflow_current_stage || '', message: '', userId: this.userId },
          );
          await prismatx.tb_purchase_request_detail.update({
            where: {
              id: item.id,
            },
            data: {
              ...item,
              requested_base_qty: calcBaseQty(item.requested_qty, item.requested_unit_conversion_factor),
              approved_base_qty: calcBaseQty(item.approved_qty, item.approved_unit_conversion_factor),
              foc_base_qty: calcBaseQty(item.foc_qty, item.foc_unit_conversion_factor),
              ...calcBasePrices(item, item.exchange_rate),
              history: history as unknown as Prisma.InputJsonValue,
              updated_by_id: this.userId,
            },
          });
        }
      }

      if (Array.isArray(updatePRDetail)) {
        for (const item of updatePRDetail) {
          const { id: detailId, stage_status, stage_message, purchase_request_id, total_amount, foc_unit_conversion_rate, ...updateData } = item;
          const existing = existingDetailMap.get(detailId);
          const history = WorkflowPersistenceHelper.appendHistory(
            (existing?.history as unknown as Record<string, unknown>[]) || [],
            { status: 'save', name: purchaseRequest.workflow_current_stage || '', message: '', userId: this.userId },
          );
          await prismatx.tb_purchase_request_detail.update({
            where: { id: detailId },
            data: {
              ...updateData,
              requested_base_qty: calcBaseQty(updateData.requested_qty, updateData.requested_unit_conversion_factor),
              approved_base_qty: calcBaseQty(updateData.approved_qty, updateData.approved_unit_conversion_factor),
              foc_base_qty: calcBaseQty(updateData.foc_qty, updateData.foc_unit_conversion_factor),
              ...calcBasePrices(updateData, updateData.exchange_rate),
              history: history as unknown as Prisma.InputJsonValue,
              updated_by_id: this.userId,
            },
          });
        }
      }

      await this.recalculatePurchaseRequestTotals(prismatx, id);

      return { id: updatePurchaseRequest.id };
    });

    return Result.ok(tx);
  }

  /**
   * Find the latest purchase request matching a pattern for running number generation
   * ค้นหาใบขอซื้อล่าสุดที่ตรงกับรูปแบบสำหรับสร้างเลขที่เอกสาร
   * @param pattern - Pattern string to match against PR number / รูปแบบข้อความที่ใช้จับคู่กับเลขที่ใบขอซื้อ
   * @returns Latest purchase request matching the pattern / ใบขอซื้อล่าสุดที่ตรงกับรูปแบบ
   */
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

  /**
   * Duplicate existing purchase requests by creating copies with new PR numbers
   * สำเนาใบขอซื้อที่มีอยู่โดยสร้างสำเนาใหม่พร้อมเลขที่ใบขอซื้อใหม่
   * @param ids - Array of purchase request IDs to duplicate / อาร์เรย์ของ ID ใบขอซื้อที่ต้องการสำเนา
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Duplicated purchase request IDs / ID ของใบขอซื้อที่สำเนาแล้ว
   */
  @TryCatch
  async duplicatePr(
    ids: string[],
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
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

    const tx = await prisma.$transaction(async (prismatx) => {
      for (const pr of basePrData) {
        const duplicatedPRDetails = [];
        const newPr = {
          pr_no: 'draft-' + randomBytes(3).toString('hex'),
          pr_date: new Date().toISOString(),
          department_id: pr.department_id,
          department_name: pr.department_name,
          requestor_id: requestor.id,
          requestor_name: requestor.username,
          workflow_id: pr.workflow_id,
          workflow_name: pr.workflow_name,
          info: pr.info as Prisma.InputJsonValue,
          description: pr.description,
          dimension: pr.dimension as Prisma.InputJsonValue,
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

        await this.recalculatePurchaseRequestTotals(prismatx, createdPr.id);
      }

      return { ids: duplicatedPRs };
    });

    return Result.ok(tx);
  }

  /**
   * Split a purchase request by moving selected detail lines to a new purchase request
   * แยกใบขอซื้อโดยย้ายรายการรายละเอียดที่เลือกไปยังใบขอซื้อใหม่
   * @param id - Source purchase request ID / ID ของใบขอซื้อต้นทาง
   * @param detailIds - Detail line IDs to split off / ID ของรายการรายละเอียดที่ต้องการแยก
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns New purchase request ID created from the split / ID ของใบขอซื้อใหม่ที่สร้างจากการแยก
   */
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
        newPrNo = 'draft-' + randomBytes(3).toString('hex');
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
          workflow_history: originalPr.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: originalPr.user_action as unknown as Prisma.InputJsonValue,
          last_action: originalPr.last_action,
          last_action_at_date: originalPr.last_action_at_date,
          last_action_by_id: originalPr.last_action_by_id,
          last_action_by_name: originalPr.last_action_by_name,
          requestor_id: originalPr.requestor_id,
          requestor_name: originalPr.requestor_name,
          department_id: originalPr.department_id,
          department_name: originalPr.department_name,
          note: originalPr.note,
          info: originalPr.info as unknown as Prisma.InputJsonValue,
          dimension: originalPr.dimension as unknown as Prisma.InputJsonValue,
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

      await this.recalculatePurchaseRequestTotals(prismatx, originalPr.id);
      await this.recalculatePurchaseRequestTotals(prismatx, newPr.id);

      return {
        original_pr_id: originalPr.id,
        new_pr_id: newPr.id,
        new_pr_no: newPr.pr_no,
        split_detail_count: detailsToSplit.length,
      };
    });

    return Result.ok(tx);
  }

  /**
   * Delete a purchase request and all its detail lines
   * ลบใบขอซื้อและรายการรายละเอียดทั้งหมด
   * @param id - Purchase request ID to delete / ID ของใบขอซื้อที่ต้องการลบ
   * @returns Deleted purchase request ID / ID ของใบขอซื้อที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestService.name,
    );

    const purchaseRequest =
      await this.prismaService.tb_purchase_request.findFirst({
        where: { id, deleted_at: null },
      });
    if (!purchaseRequest) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    if (purchaseRequest.pr_status !== enum_purchase_request_doc_status.draft) {
      return Result.error(
        'Only draft purchase requests can be deleted',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    const now = new Date().toISOString();

    const tx = await this.prismaService.$transaction(async (prisma) => {
      await prisma.tb_purchase_request_detail.updateMany({
        where: { purchase_request_id: id, deleted_at: null },
        data: { deleted_at: now, updated_by_id: this.userId },
      });
      await this.recalculatePurchaseRequestTotals(prisma, id);
      await prisma.tb_purchase_request.update({
        where: { id },
        data: { deleted_at: now, updated_by_id: this.userId },
      });

      return { id };
    });

    return Result.ok(tx);
  }

  /**
   * Approve a purchase request and advance the workflow stage
   * อนุมัติใบขอซื้อและเลื่อนขั้นตอนการทำงานไปข้างหน้า
   * @param id - Purchase request ID / ID ของใบขอซื้อ
   * @param workflow - Workflow state data / ข้อมูลสถานะขั้นตอนการทำงาน
   * @param payload - Approval detail data / ข้อมูลรายละเอียดการอนุมัติ
   * @returns Approved purchase request ID / ID ของใบขอซื้อที่อนุมัติแล้ว
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
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
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
        const rawStages = findPRDoc?.stages_status;
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

        if (stagesSkipped) {
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: detail.stage_status || '',
            stages: currentStages,
            workflowCurrentStage: workflow.workflow_current_stage,
          });
          await txp.tb_purchase_request_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, updated_by_id: this.userId },
          });
          continue;
        }

        const history = WorkflowPersistenceHelper.appendHistory(
          (findPRDoc?.history as unknown as Record<string, unknown>[]) || [],
          { status: detail.stage_status || '', name: workflow.workflow_previous_stage, message: detail.stage_message || '', userId: this.userId },
        );

        const payloadStatus = detail.stage_status || '';
        delete detail.stage_message;
        delete detail.stage_status;
        delete detail.purchase_request_id;

        const updateDto = JSON.parse(
          JSON.stringify({
            id: undefined,
            ...detail,
          }),
        );

        await txp.tb_purchase_request_detail.update({
          where: {
            id: detail.id,
          },
          data: {
            ...updateDto,
            requested_base_qty: calcBaseQty(detail.requested_qty, detail.requested_unit_conversion_factor),
            approved_base_qty: calcBaseQty(detail.approved_qty, detail.approved_unit_conversion_factor),
            foc_base_qty: calcBaseQty(detail.foc_qty, detail.foc_unit_conversion_factor),
            ...calcBasePrices(detail, detail.exchange_rate),
            doc_version: { increment: 1 },
            stages_status: stages as unknown as Prisma.InputJsonValue,
            history: history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            current_stage_status: WorkflowPersistenceHelper.resolveCurrentStageStatus({
              payloadStatus,
              stages,
              workflowCurrentStage: workflow.workflow_current_stage,
            }),
          },
        });
      }

      await this.recalculatePurchaseRequestTotals(txp, id);

      return id;
    });

    return Result.ok({ id: purchaseRequest.id });
  }

  /**
   * Review a purchase request and forward it to the next workflow stage
   * ตรวจสอบใบขอซื้อและส่งต่อไปยังขั้นตอนการทำงานถัดไป
   * @param id - Purchase request ID / ID ของใบขอซื้อ
   * @param payload - Review data / ข้อมูลการตรวจสอบ
   * @param workflow - Workflow header configuration / การตั้งค่าส่วนหัวขั้นตอนการทำงาน
   * @returns Reviewed purchase request result / ผลลัพธ์การตรวจสอบใบขอซื้อ
   */
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
        if (!payloadDetail) continue;

        const currentStages: StageStatus[] = Array.isArray(detail.stages_status)
          ? (detail.stages_status as unknown as StageStatus[])
          : [];

        const bag = WorkflowPersistenceHelper.buildReviewDetailUpdate({
          payloadDetail,
          currentStages,
          currentHistory: (detail.history as unknown as Record<string, unknown>[]) || [],
          workflowPreviousStage: workflow.workflow_previous_stage,
          workflowCurrentStage: workflow.workflow_current_stage,
          desStage: payload.des_stage,
          userId: this.userId,
        });

        if (!bag) {
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: payloadDetail.stage_status,
            stages: currentStages,
            workflowCurrentStage: workflow.workflow_current_stage,
          });
          await txp.tb_purchase_request_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, updated_by_id: this.userId },
          });
          continue;
        }

        await txp.tb_purchase_request_detail.update({
          where: { id: detail.id },
          data: {
            stages_status: bag.stages_status as unknown as Prisma.InputJsonValue,
            history: bag.history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            current_stage_status: bag.current_stage_status,
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
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseRequest.id });
  }

  /**
   * Reject a purchase request and update its workflow status
   * ปฏิเสธใบขอซื้อและอัปเดตสถานะขั้นตอนการทำงาน
   * @param id - Purchase request ID / ID ของใบขอซื้อ
   * @param payload - Rejection data with reason / ข้อมูลการปฏิเสธพร้อมเหตุผล
   * @returns Rejected purchase request ID / ID ของใบขอซื้อที่ปฏิเสธแล้ว
   */
  @TryCatch
  async reject(
    id: string,
    workflow: WorkflowHeader,
    payload: RejectPurchaseRequestDto,
  ): Promise<Result<unknown>> {
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
        if (!findPR) continue;

        const bag = WorkflowPersistenceHelper.buildRejectDetailUpdate({
          payloadDetail: findPR,
          currentStages: Array.isArray(detail.stages_status) ? detail.stages_status as unknown as StageStatus[] : [],
          currentHistory: (detail.history as unknown as Record<string, unknown>[]) || [],
          workflowCurrentStage: purchaseRequest.workflow_current_stage,
          userId: this.userId,
        });

        await txp.tb_purchase_request_detail.update({
          where: { id: detail.id },
          data: {
            stages_status: bag.stages_status as unknown as Prisma.InputJsonValue,
            history: bag.history as unknown as Prisma.InputJsonValue,
            updated_by_id: this.userId,
            current_stage_status: bag.current_stage_status,
          },
        });
      }
      await txp.tb_purchase_request.update({
        where: { id },
        data: {
          ...workflow,
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
          pr_status: enum_purchase_request_doc_status.voided,
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseRequest.id });
  }

  /**
   * Generate a draft PR number on create using an atomic per-tenant counter
   * stored in tb_application_config (key = pr_running_no, value = { last_no }).
   *
   * Race-condition handling: a Postgres advisory transaction lock (per key, per
   * tenant DB) serializes concurrent create() calls so two clients cannot read
   * the same last_no and emit duplicate pr_no. The lock auto-releases on tx
   * commit/rollback.
   *
   * Format: draft-{seq} (e.g. draft-1, draft-2, ...). No padding.
   */
  private async generatePrNoFromConfig(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    await tx.$executeRawUnsafe(
      `SELECT pg_advisory_xact_lock(hashtext($1))`,
      PR_RUNNING_NO_KEY,
    );

    const row = await tx.tb_application_config.findFirst({
      where: { key: PR_RUNNING_NO_KEY, deleted_at: null },
      select: { id: true, value: true },
    });

    const existing = (row?.value ?? null) as { last_no?: number } | null;
    const nextNo = (Number(existing?.last_no) || 0) + 1;

    const newValue = { last_no: nextNo };
    const nowIso = new Date().toISOString();

    if (row) {
      await tx.tb_application_config.update({
        where: { id: row.id },
        data: {
          value: newValue,
          updated_at: nowIso,
          updated_by_id: this.userId,
        },
      });
    } else {
      await tx.tb_application_config.create({
        data: {
          key: PR_RUNNING_NO_KEY,
          value: newValue,
          created_at: nowIso,
          created_by_id: this.userId,
        },
      });
    }

    return `${PR_DRAFT_NO_PREFIX}${nextNo}`;
  }

  /**
   * Generate a running purchase request number based on date pattern configuration
   * สร้างเลขที่ใบขอซื้อแบบเรียงลำดับตามการตั้งค่ารูปแบบวันที่
   * @param PRDate - Purchase request date for pattern generation / วันที่ใบขอซื้อสำหรับสร้างรูปแบบ
   * @returns Generated PR number / เลขที่ใบขอซื้อที่สร้างแล้ว
   */
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

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for PR: datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

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

  /**
   * Find all purchase requests filtered by document status with pagination
   * ค้นหาใบขอซื้อทั้งหมดตามสถานะเอกสารพร้อมการแบ่งหน้า
   * @param status - Document status to filter by / สถานะเอกสารที่ใช้กรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of purchase requests by status / รายการใบขอซื้อตามสถานะที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAllByStatus(
    status: string,
    paginate: IPaginate,
    options?: { excludeWorkflowHistory?: boolean },
  ): Promise<Result<unknown>> {
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

    const responseSchema = options?.excludeWorkflowHistory
      ? PurchaseRequestForPoResponseSchema
      : PurchaseRequestListItemResponseSchema;

    const serializedPurchaseRequests = purchaseRequests.map((item) =>
      responseSchema.parse(item),
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

  /**
   * Find all distinct pending workflow stages for purchase requests
   * ค้นหาขั้นตอนการทำงานที่รอดำเนินการทั้งหมด (ไม่ซ้ำ) ของใบขอซื้อ
   * @returns List of distinct pending workflow stages / รายการขั้นตอนการทำงานที่รอดำเนินการที่ไม่ซ้ำ
   */
  @TryCatch
  async findAllMyPendingStages(): Promise<Result<unknown>> {
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
   * Export a purchase request to Excel spreadsheet format
   * ส่งออกใบขอซื้อเป็นไฟล์สเปรดชีต Excel
   * @param id - Purchase request ID to export / ID ของใบขอซื้อที่ต้องการส่งออก
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
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
   * Print a purchase request to PDF format
   * พิมพ์ใบขอซื้อเป็นไฟล์ PDF
   * @param id - Purchase request ID to print / ID ของใบขอซื้อที่ต้องการพิมพ์
   * @returns PDF file buffer and filename / บัฟเฟอร์ไฟล์ PDF และชื่อไฟล์
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

     
    const docDefinition: any = {
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
              i === 0 || i === 1 || i === node.table?.body?.length ? 1 : 0.5,
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

  /**
   * Find dimensions associated with a purchase request detail line
   * ค้นหามิติที่เกี่ยวข้องกับรายการรายละเอียดใบขอซื้อ
   * @param detail_id - Purchase request detail ID / ID ของรายละเอียดใบขอซื้อ
   * @returns Dimension data for the detail / ข้อมูลมิติของรายละเอียด
   */
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

  /**
   * Get the count of purchase requests pending approval for the current user
   * นับจำนวนใบขอซื้อที่รอการอนุมัติของผู้ใช้ปัจจุบัน
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Count of pending purchase requests / จำนวนใบขอซื้อที่รออนุมัติ
   */
  async findAllMyPendingCount(user_id: string, bu_code: string | string[]): Promise<any> {
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
   * Find price history for a purchase request detail line
   * ค้นหาประวัติราคาของรายการรายละเอียดใบขอซื้อ
   * @param detail_id - Purchase request detail ID / ID ของรายละเอียดใบขอซื้อ
   * @returns Price history data / ข้อมูลประวัติราคา
   */
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

  /**
   * Get calculated price information for a purchase request detail (taxes, discounts, totals)
   * ดึงข้อมูลราคาที่คำนวณแล้วสำหรับรายละเอียดใบขอซื้อ (ภาษี ส่วนลด ยอดรวม)
   * @param detail_id - Purchase request detail ID / ID ของรายละเอียดใบขอซื้อ
   * @param data - Calculation parameters / พารามิเตอร์การคำนวณ
   * @returns Calculated price info / ข้อมูลราคาที่คำนวณแล้ว
   */
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

  /**
   * Get previous workflow stages for a purchase request
   * ดึงขั้นตอนอนุมัติก่อนหน้า current_stage ของใบขอซื้อ
   * @param pr_id - Purchase request ID / รหัสใบขอซื้อ
   * @returns Previous workflow stages / ขั้นตอนการทำงานก่อนหน้า
   */
  @TryCatch
  async getPreviousStages(pr_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getPreviousStages', pr_id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestService.name,
    );

    const pr = await this.prismaService.tb_purchase_request.findFirst({
      where: { id: pr_id, deleted_at: null },
      select: {
        id: true,
        workflow_id: true,
        workflow_current_stage: true,
      },
    });

    if (!pr) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    if (!pr.workflow_id || !pr.workflow_current_stage) {
      return Result.error('No workflow assigned to this purchase request', ErrorCode.NOT_FOUND);
    }

    const numberedStages = await this.workflowOrchestrator.getPreviousStages(
      pr.workflow_id, pr.workflow_current_stage, this.userId, this.bu_code,
    );

    return Result.ok(numberedStages);
  }

  // ─── Print via micro-report (FastReport Viewer) ───

  /**
   * Build PR data + send to micro-report for FastReport viewer rendering.
   * สร้างข้อมูล PR แล้วส่งไป micro-report เพื่อ render ผ่าน FastReport viewer
   * Returns { viewer_url } that the frontend can open in an iframe/tab.
   */
  @TryCatch
  async printToReport(
    id: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseRequestService.name,
    );

    // 1. Load PR + details
    const pr = await this.prismaService.tb_purchase_request.findFirst({
      where: { id },
      include: {
        tb_purchase_request_detail: { orderBy: { sequence_no: 'asc' } },
      },
    });

    if (!pr) {
      return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
    }

    // 2. Resolve template via tb_print_template_mapping (document_type='PR'),
    //    scoped to the caller's BU. Template row carries orientation +
    //    signature_config — no more app_config lookup, no more workflow walk.
    const mapping = await this.prismaSystem.tb_print_template_mapping.findFirst({
      where: {
        document_type: 'PR',
        is_active: true,
        deleted_at: null,
      },
      orderBy: [{ is_default: 'desc' }, { display_order: 'asc' }],
    });
    if (!mapping) {
      return Result.error('No active PR print mapping found', ErrorCode.NOT_FOUND);
    }
    const template = await this.prismaSystem.tb_report_template.findFirst({
      where: { id: mapping.report_template_id, deleted_at: null },
      select: { id: true, name: true, signature_config: true },
    });
    if (!template) {
      return Result.error(`Mapped template ${mapping.report_template_id} not found`, ErrorCode.NOT_FOUND);
    }

    // 3. Pull signature labels straight from the template metadata.
    type SignatureBlock = { key: string; label: string; required?: boolean };
    const sigCfg = (template.signature_config as { blocks?: SignatureBlock[] } | null) ?? { blocks: [] };
    const sigNames: Record<string, string> = {
      Sig1Name: '', Sig2Name: '', Sig3Name: '', Sig4Name: '', Sig5Name: '',
    };
    for (const b of sigCfg.blocks ?? []) {
      if (b.key in sigNames) sigNames[b.key] = b.label;
    }

    // 4. Build data matching template DataSource columns
    const formatDate = (d: Date | string | null | undefined): string => {
      if (!d) return '';
      return format(new Date(d), 'dd/MM/yyyy');
    };

    const headerData = [{
      PrNo: pr.pr_no || '',
      RequestorName: pr.requestor_name || '',
      DepartmentName: pr.department_name || '',
      Description: pr.description || '',
      PrDate: formatDate(pr.pr_date),
      DeliveryDate: '', // PR header has no delivery_date; shown per detail row
      PrStatus: pr.pr_status || '',
      WorkflowName: pr.workflow_name || '',
      ...sigNames,
    }];

    const detailData = pr.tb_purchase_request_detail.map((d, i) => ({
      No: String(i + 1),
      ProductName: d.product_name || '',
      LocationName: d.location_name || '',
      RequestedQty: Number(d.requested_qty) || 0,
      UnitName: d.requested_unit_name || '',
      DeliveryDate: formatDate(d.delivery_date),
      NetAmount: Number(d.net_amount) || 0,
    }));

    // 5. POST to micro-report
    const reportHost = process.env.REPORT_SERVICE_HOST || '127.0.0.1';
    const reportPort = process.env.REPORT_SERVICE_HTTP_PORT || '6015';
    const reportUrl = `http://${reportHost}:${reportPort}/api/${this.bu_code}/report/viewer-with-data`;

    const payload = {
      template_name: template.name,
      data: {
        PRHeader: headerData,
        PRDetail: detailData,
      },
    };

    this.logger.debug(
      { function: 'printToReport', reportUrl, template_name: payload.template_name, detail_count: detailData.length },
      PurchaseRequestService.name,
    );

    const response = await fetch(reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return Result.error(`Report service error: ${response.status} ${errBody}`, ErrorCode.INTERNAL);
    }

    const result = await response.json() as { url?: string };
    if (!result.url) {
      return Result.error('Report service did not return viewer URL', ErrorCode.INTERNAL);
    }

    return Result.ok({ viewer_url: result.url });
  }

  /**
   * Recompute amount totals for one PR (or all non-deleted PRs in tenant if
   * prId is omitted). Used by the admin "regenerate totals" endpoint to repair
   * drift after manual DB edits or migrations.
   * @returns count of PRs recalculated
   */
  @TryCatch
  async regenerateTotals(
    user_id: string,
    tenant_id: string,
    prId?: string,
  ): Promise<Result<{ count: number }>> {
    this.logger.debug(
      { function: 'regenerateTotals', user_id, tenant_id, prId },
      PurchaseRequestService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }
    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    if (prId) {
      const exists = await prisma.tb_purchase_request.findFirst({
        where: { id: prId, deleted_at: null },
        select: { id: true },
      });
      if (!exists) {
        return Result.error('Purchase request not found', ErrorCode.NOT_FOUND);
      }
      await this.recalculatePurchaseRequestTotals(prisma, prId);
      return Result.ok({ count: 1 });
    }

    const prs = await prisma.tb_purchase_request.findMany({
      where: { deleted_at: null },
      select: { id: true },
    });
    for (const pr of prs) {
      await this.recalculatePurchaseRequestTotals(prisma, pr.id);
    }
    return Result.ok({ count: prs.length });
  }

  /**
   * Recompute base_net_amount, base_total_amount on tb_purchase_request from the
   * current set of (non-deleted) detail rows. Only base_* totals are stored on
   * the header because PR details can have mixed currencies.
   * เรียกหลังจาก insert / update / soft-delete tb_purchase_request_detail
   * เพื่อให้ list/sort สามารถใช้คอลัมน์ header ได้โดยตรง
   */
  async recalculatePurchaseRequestTotals(tx: any, prId: string): Promise<void> {
    const agg = await tx.tb_purchase_request_detail.aggregate({
      where: {
        purchase_request_id: prId,
        deleted_at: null,
      },
      _sum: {
        base_net_amount: true,
        base_total_price: true,
      },
    });

    await tx.tb_purchase_request.update({
      where: { id: prId },
      data: {
        base_net_amount: agg._sum.base_net_amount ?? 0,
        base_total_amount: agg._sum.base_total_price ?? 0,
      },
    });
  }
}
