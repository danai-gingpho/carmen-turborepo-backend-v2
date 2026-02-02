import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import {
  enum_workflow_type,
  PrismaClient,
} from '@repo/prisma-shared-schema-tenant';
import {
  ICreateWorkflow,
  IUpdateWorkflow,
} from './interface/workflows.interface';
import { TenantService } from '@/tenant/tenant.service';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import {
  ERROR_MISSING_BU_CODE,
  ERROR_MISSING_TENANT_ID,
  ERROR_MISSING_USER_ID,
} from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  TryCatch,
  Result,
  ErrorCode,
  WorkflowResponseSchema,
  WorkflowListItemResponseSchema,
  WorkflowByTypeResponseSchema,
} from '@/common';

@Injectable()
export class WorkflowsService {
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

  async initializePrismaService(
    bu_code: string,
    userId: string,
  ): Promise<void> {
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

  private readonly logger: BackendLogger = new BackendLogger(
    WorkflowsService.name,
  );

  constructor(private readonly tenantService: TenantService) {}

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, bu_code: this.bu_code },
      WorkflowsService.name,
    );

    const workflow = await this.prismaService.tb_workflow.findFirst({
      where: {
        id: id,
      },
    });

    if (!workflow) {
      return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
    }

    // Serialize response data
    const serializedWorkflow = WorkflowResponseSchema.parse(workflow);

    return Result.ok(serializedWorkflow);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      WorkflowsService.name,
    );
    const defaultSearchFields = ['name'];

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
    const workflows = await this.prismaService.tb_workflow.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_workflow.count({
      where: q.where(),
    });

    // Serialize response data
    const serializedWorkflows = workflows.map((workflow) =>
      WorkflowListItemResponseSchema.parse(workflow),
    );

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedWorkflows,
    });
  }

  @TryCatch
  async findByType(
    type: enum_workflow_type,
    user_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findByType',
        type,
        user_id,
      },
      WorkflowsService.name,
    );

    const results = await this.prismaService.tb_workflow.findMany({
      where: {
        workflow_type: type,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        data: true,
      },
    });

    // Process workflows with proper async handling
    const workflows = await Promise.all(
      results.map(async (workflow) => {
        const data = workflow.data as any;
        let can_create = false;

        if (data && typeof data === 'object') {
          const usersInCreateRequestStage = await this.findAllUsersInStages(
            'Create Request',
            data,
          );
          const userFound = usersInCreateRequestStage.find(
            (user) => user.user_id === user_id,
          );
          can_create = !!userFound;
        }

        return {
          id: workflow.id,
          name: workflow.name,
          can_create,
        };
      }),
    );

    // Serialize response data
    const serializedWorkflows = workflows.map((workflow) =>
      WorkflowByTypeResponseSchema.parse(workflow),
    );

    return Result.ok({
      paginate: {
        total: workflows.length,
        page: 1,
        perpage: workflows.length,
        pages: 1,
      },
      data: serializedWorkflows,
    });
  }

  async findAllUsersInStages(
    stage_name: string,
    data: object,
  ): Promise<
    {
      user_id: string;
      email: string;
      firstname: string;
      lastname: string;
      department: string;
      initials: string;
    }[]
  > {
    // mock data structure
    // const xx = {
    //   stages: [
    //     {
    //       sla: '24',
    //       name: 'Create Request',
    //       role: 'create',
    //       sla_unit: 'hours',
    //       description: 'Initial stage for creating and submitting requests',
    //       hide_fields: { total_price: false, price_per_unit: false },
    //       assigned_users: [
    //         {
    //           email: 'system-admin@blueledgers.com',
    //           user_id: 'fe007ceb-9320-41ed-92ac-d6ea1f66b3c1',
    //           initials: 'ss',
    //           lastname: 'system-admin',
    //           firstname: 'system-admin',
    //           department: {},
    //           middlename: '',
    //         },
    //         {
    //           email: 'admin@blueledgers.com',
    //           user_id: '3c5280a7-492e-421d-b739-7447455ce99e',
    //           initials: 'aa',
    //           lastname: 'admin',
    //           firstname: 'admin',
    //           department: {
    //             id: '7e739b3a-6026-450d-95e4-133198672a89',
    //             name: 'Kitchen',
    //           },
    //           middlename: '',
    //         },
    //       ],
    //       creator_access: 'only_creator',
    //       available_actions: {
    //         reject: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //         submit: {
    //           is_active: true,
    //           recipients: {
    //             next_step: true,
    //             requestor: true,
    //             current_approve: false,
    //           },
    //         },
    //         approve: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //         sendback: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //       },
    //     },
    //     {
    //       sla: '24',
    //       name: 'HOD',
    //       role: 'approve',
    //       is_hod: true,
    //       sla_unit: 'hours',
    //       description: '',
    //       hide_fields: { total_price: false, price_per_unit: false },
    //       assigned_users: [],
    //       creator_access: 'only_creator',
    //       available_actions: {
    //         reject: {
    //           is_active: true,
    //           recipients: {
    //             next_step: false,
    //             requestor: true,
    //             current_approve: false,
    //           },
    //         },
    //         submit: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //         approve: {
    //           is_active: true,
    //           recipients: {
    //             next_step: true,
    //             requestor: true,
    //             current_approve: false,
    //           },
    //         },
    //         sendback: {
    //           is_active: true,
    //           recipients: {
    //             next_step: false,
    //             requestor: true,
    //             current_approve: false,
    //           },
    //         },
    //       },
    //       sla_warning_notification: {
    //         recipients: { requestor: false, current_approve: false },
    //       },
    //     },
    //     {
    //       sla: '24',
    //       name: 'Purchase',
    //       role: 'purchase',
    //       sla_unit: 'hours',
    //       description: '',
    //       hide_fields: { total_price: false, price_per_unit: false },
    //       assigned_users: [],
    //       creator_access: 'only_creator',
    //       available_actions: {
    //         reject: {
    //           is_active: true,
    //           recipients: {
    //             next_step: false,
    //             requestor: true,
    //             current_approve: false,
    //           },
    //         },
    //         submit: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //         approve: {
    //           is_active: true,
    //           recipients: {
    //             next_step: true,
    //             requestor: true,
    //             current_approve: false,
    //           },
    //         },
    //         sendback: {
    //           is_active: true,
    //           recipients: {
    //             next_step: false,
    //             requestor: true,
    //             current_approve: false,
    //           },
    //         },
    //       },
    //       sla_warning_notification: {
    //         recipients: { requestor: false, current_approve: false },
    //       },
    //     },
    //     {
    //       sla: '0',
    //       name: 'Completed',
    //       role: 'approve',
    //       sla_unit: 'hours',
    //       description: 'Workflow completed successfully',
    //       hide_fields: { total_price: false, price_per_unit: false },
    //       assigned_users: [],
    //       creator_access: 'only_creator',
    //       available_actions: {
    //         reject: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //         submit: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //         approve: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //         sendback: {
    //           is_active: false,
    //           recipients: {
    //             next_step: false,
    //             requestor: false,
    //             current_approve: false,
    //           },
    //         },
    //       },
    //     },
    //   ],
    //   products: [],
    //   notifications: [],
    //   routing_rules: [],
    //   notification_templates: [],
    //   document_reference_pattern: 'PR-{YYYY}-{MM}-{####}',
    // };

    const usersInStage: {
      user_id: string;
      email: string;
      firstname: string;
      lastname: string;
      department: string;
      initials: string;
    }[] = [];
    if (data && typeof data === 'object' && 'stages' in data) {
      const stages = (data as any).stages;
      if (Array.isArray(stages)) {
        const stage = stages.find((s: any) => s.name === stage_name);
        if (stage && 'assigned_users' in stage) {
          const assigned_users = stage.assigned_users;
          if (Array.isArray(assigned_users)) {
            for (const user of assigned_users) {
              if ('user_id' in user) {
                usersInStage.push(user);
              }
            }
          }
        }
      }
    }
    return usersInStage;
  }

  @TryCatch
  async findAllWorkflowByIds(
    ids: string[],
    bu_code: string,
    user_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllWorkflowByIds', ids, bu_code, user_id },
      WorkflowsService.name,
    );

    const workflows = await this.prismaService.tb_workflow.findMany({
      where: {
        id: {
          in: ids,
        },
        is_active: true,
      },
    });

    // Serialize response data
    const serializedWorkflows = workflows.map((workflow) =>
      WorkflowListItemResponseSchema.parse(workflow),
    );

    return Result.ok(serializedWorkflows);
  }

  @TryCatch
  async create(data: ICreateWorkflow): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      WorkflowsService.name,
    );

    const foundWorkflow = await this.prismaService.tb_workflow.findFirst({
      where: {
        name: data.name,
        workflow_type: data.workflow_type,
      },
    });

    if (foundWorkflow) {
      return Result.error('Workflow already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createWorkflow = await this.prismaService.tb_workflow.create({
      data: {
        ...data,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createWorkflow.id });
  }

  @TryCatch
  async update(data: IUpdateWorkflow): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      WorkflowsService.name,
    );

    const workflow = await this.prismaService.tb_workflow.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!workflow) {
      return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
    }

    const updateWorkflow = await this.prismaService.tb_workflow.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
      },
    });

    return Result.ok({ id: updateWorkflow.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      WorkflowsService.name,
    );

    const workflow = await this.prismaService.tb_workflow.findFirst({
      where: {
        id: id,
      },
    });

    if (!workflow) {
      return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_workflow.update({
      where: {
        id: id,
      },
      data: {
        is_active: false,
        deleted_by_id: this.userId,
        deleted_at: new Date().toISOString(),
      },
    });

    // const deleteWorkflow = await prisma.tb_workflow.update({
    //   where: {
    //     id: id,
    //   },
    //   data: {
    //     is_active: false,
    //     updated_by_id: this.userId,
    //   },
    // });

    return Result.ok(null);
  }
}
