import { Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
// import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IApplicationRoleCreate, IApplicationRoleUpdate } from './interface/role.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class ApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(ApplicationRoleService.name);
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
      ApplicationRoleService.name,
    );

    const role = await this.prismaSystem.tb_application_role.findFirst({
      where: { id },
    });

    if (!role) {
      return Result.error('Role not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(role);
  }

  @TryCatch
  async findAll(user_id: string, tenant_id: string, paginate: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', paginate: paginate, user_id, tenant_id },
      ApplicationRoleService.name,
    );

    const defaultSearchFields = ['name', 'description'];

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

    const roles = await this.prismaSystem.tb_application_role.findMany({
      ...q.findMany(),
      select: {
        id: true,
        business_unit_id: true,
        name: true,
        description: true,
        created_at: true,
      },
    });

    const total = await this.prismaSystem.tb_application_role.count({
      where: { ...q.where() },
    });

    return Result.ok({
      paginate: {
        total: total,
        page: q.page,
        perpage: q.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: roles,
    });
  }

  @TryCatch
  async create(data: IApplicationRoleCreate, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data: data, user_id, tenant_id },
      ApplicationRoleService.name,
    );

    // find by name
    const existingRole = await this.prismaSystem.tb_application_role.findFirst(
      {
        where: { name: data.name },
      },
    );

    if (existingRole) {
      return Result.error('Role with this name already exists', ErrorCode.ALREADY_EXISTS);
    }

    const newRole = await this.prismaSystem.tb_application_role.create({
      data: {
        business_unit_id: data.business_unit_id,
        name: data.name,
        description: data.description,
        created_at: new Date(),
      },
    });

    return Result.ok({ id: newRole.id });
  }

  @TryCatch
  async update(data: IApplicationRoleUpdate, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data: data, user_id, tenant_id },
      ApplicationRoleService.name,
    );

    const role = await this.prismaSystem.tb_application_role.findFirst({
      where: { id: data.id },
    });

    if (!role) {
      return Result.error('Role not found', ErrorCode.NOT_FOUND);
    }

    const updatedRole = await this.prismaSystem.tb_application_role.update({
      where: { id: data.id },
      data: {
        business_unit_id: data.business_unit_id,
        name: data.name,
        description: data.description,
        updated_at: new Date(),
      },
    });

    return Result.ok({ id: updatedRole.id });
  }

  @TryCatch
  async remove(id: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'remove', id: id, user_id, tenant_id },
      ApplicationRoleService.name,
    );

    const role = await this.prismaSystem.tb_application_role.findFirst({
      where: { id },
    });

    if (!role) {
      return Result.error('Role not found', ErrorCode.NOT_FOUND);
    }

    // check foreign key in tb_user
    const userWithRole = await this.prismaSystem.tb_user.findFirst({
      where: { id: id },
    });

    if (userWithRole) {
      return Result.error('Cannot delete role assigned to users', ErrorCode.ALREADY_EXISTS);
    }

    await this.prismaSystem.tb_application_role.delete({
      where: { id },
    });

    return Result.ok({ id });
  }
}
