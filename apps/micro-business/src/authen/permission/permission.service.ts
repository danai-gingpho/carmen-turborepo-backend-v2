import { Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
// import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPermissionCreate,
  IPermissionUpdate,
} from './interface/permission.interface';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class PermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    PermissionService.name,
  );

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id: id, user_id, tenant_id },
      PermissionService.name,
    );

    const permission = await this.prismaSystem.tb_permission.findFirst({
      where: { id },
    });

    if (!permission) {
      return Result.error('Permission not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(permission);
  }

  @TryCatch
  async findAll(user_id: string, tenant_id: string, paginate: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', paginate: paginate, user_id, tenant_id },
      PermissionService.name,
    );

    console.log('Paginate:', paginate);

    const defaultSearchFields = ['resource', 'action', 'description'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchFields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    console.log('Query Params:', q.findMany());

    const permissions = await this.prismaSystem.tb_permission.findMany({
      ...q.findMany(),
      select: {
        id: true,
        resource: true,
        action: true,
        description: true,
        created_at: true,
      },
    });

    const total = await this.prismaSystem.tb_permission.count({
      where: { ...q.where() },
    });

    return Result.ok({
      paginate: {
        total: total,
        page: q.page,
        perpage: q.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: permissions,
    });
  }

  @TryCatch
  async create(data: IPermissionCreate, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data: data, user_id, tenant_id },
      PermissionService.name,
    );

    // find by resource and action (compound unique)
    const existingPermission = await this.prismaSystem.tb_permission.findFirst(
      {
        where: {
          resource: data.resource,
          action: data.action,
        },
      },
    );

    if (existingPermission) {
      return Result.error('Permission with this resource and action already exists', ErrorCode.ALREADY_EXISTS);
    }

    const newPermission = await this.prismaSystem.tb_permission.create({
      data: {
        resource: data.resource,
        action: data.action,
        description: data.description,
        created_at: new Date(),
      },
    });

    return Result.ok({ id: newPermission.id });
  }

  @TryCatch
  async update(data: IPermissionUpdate, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data: data, user_id, tenant_id },
      PermissionService.name,
    );

    const permission = await this.prismaSystem.tb_permission.findFirst({
      where: { id: data.id },
    });

    if (!permission) {
      return Result.error('Permission not found', ErrorCode.NOT_FOUND);
    }

    const updatedPermission = await this.prismaSystem.tb_permission.update({
      where: { id: data.id },
      data: {
        resource: data.resource,
        action: data.action,
        description: data.description,
        updated_at: new Date(),
      },
    });

    return Result.ok({ id: updatedPermission.id });
  }

  @TryCatch
  async remove(id: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'remove', id: id, user_id, tenant_id },
      PermissionService.name,
    );

    const permission = await this.prismaSystem.tb_permission.findFirst({
      where: { id },
    });

    if (!permission) {
      return Result.error('Permission not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_permission.delete({
      where: { id },
    });

    return Result.ok({ id });
  }
}
