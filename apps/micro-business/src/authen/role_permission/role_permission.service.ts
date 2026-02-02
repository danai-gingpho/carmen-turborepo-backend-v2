import { Injectable, Inject } from '@nestjs/common'
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform'
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant'
import { TenantService } from '@/tenant/tenant.service'
import {
  IApplicationRolePermissionCreate,
  IApplicationRolePermissionUpdate,
} from './interface/role_permission.interface'
import { BackendLogger } from '@/common/helpers/backend.logger'
import QueryParams from '@/libs/paginate.query'
import getPaginationParams from '@/libs/pagination.param'
import { TryCatch, Result, ErrorCode } from '@/common'

@Injectable()
export class ApplicationRolePermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRolePermissionService.name,
  )

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findOne(id: string, user_id: string, bu_code: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, bu_code },
      ApplicationRolePermissionService.name,
    )

    const response =
      await this.prismaSystem.tb_application_role.findFirst({
        where: { id: id },
        select: {
          id: true,
          name: true,
          tb_application_role_tb_permission: {
            select: {
              permission_id: true,
              tb_permission: {
                select: {
                  action: true,
                  resource: true,
                  description: true,
                },
              }
            }
          }
        }
      })

    if (!response) {
      return Result.error('Role permission not found', ErrorCode.NOT_FOUND)
    }

    const rolePermission = {
      id: response.id,
      application_role_name: response.name,
      permissions: response.tb_application_role_tb_permission.map((item) => ({
        permission_id: item.permission_id,
        action: item.tb_permission.action,
        resource: item.tb_permission.resource,
        description: item.tb_permission.description,
      })),
    }

    return Result.ok(rolePermission)
  }

  @TryCatch
  async findAll(paginate: any, user_id: string, bu_code: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', paginate: paginate, user_id, bu_code },
      ApplicationRolePermissionService.name,
    );

    const defaultSearchFields = ['name', 'description'];

    console.log('Paginate:', paginate);

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
    const prismaParams = {
      where: {
        ...q.where(),
        tb_business_unit: {
          code: bu_code,
        },
      },
      select: {
        id: true,
        business_unit_id: true,
        name: true,
        description: true,
        created_at: true,
        tb_application_role_tb_permission: {
          select: {
            permission_id: true,
            tb_permission: {
              select: {
                action: true,
                resource: true,
                description: true,
              },
            }
          }
        }
      },
      orderBy: q.orderBy(),
      ...pagination,
    };

    const roles = await this.prismaSystem.tb_application_role.findMany(prismaParams);

    const roleWithPermissions = roles.map((role: any) => ({
      id: role.id,
      business_unit_id: role.business_unit_id,
      name: role.name,
      description: role.description,
      created_at: role.created_at,
      permissions: role.tb_application_role_tb_permission.map((item: any) => ({
        permission_id: item.permission_id,
        action: item.tb_permission.action,
        resource: item.tb_permission.resource,
        description: item.tb_permission.description,
      })),
    }));

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
      data: roleWithPermissions,
    });
  }

  @TryCatch
  async create(
    data: IApplicationRolePermissionCreate,
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data: data, user_id, bu_code },
      ApplicationRolePermissionService.name,
    )

    if (data?.permissions) {
      const permission = await this.prismaSystem.tb_permission.findMany({
        where: { id: { in: data?.permissions?.add } },
      })
      if (permission.length !== data?.permissions?.add.length) {
        return Result.error('Permission not found', ErrorCode.NOT_FOUND)
      }
    }
    const tenant = await this.tenantService.getTenantByCode(bu_code, user_id)
    const isRoleNameExist = await this.prismaSystem.tb_application_role.findFirst({
      where: {
        name: data.application_role_name,
        business_unit_id: tenant.id,
      },
    })
    if (isRoleNameExist) {
      return Result.error('Role name already exists', ErrorCode.ALREADY_EXISTS)
    }

    const createdApplicationRoleId = await this.prismaSystem.$transaction(async (prisma) => {
      const newRole = await prisma.tb_application_role.create({
        data: {
          name: data.application_role_name,
          business_unit_id: tenant.id,
          is_active: true,
          created_by_id: user_id,
          created_at: new Date(),
        },
      })

      if (data?.permissions?.add && data.permissions.add.length > 0) {
        for (const permissionId of data.permissions.add) {
          await prisma.tb_application_role_tb_permission.create({
            data: {
              application_role_id: newRole.id,
              permission_id: permissionId,
              is_active: true,
              created_by_id: user_id,
              created_at: new Date(),
            }
          })
        }
      }

      return newRole.id
    })

    return Result.ok({ id: createdApplicationRoleId })
  }

  @TryCatch
  async update(
    data: IApplicationRolePermissionUpdate,
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data: data, user_id, bu_code },
      ApplicationRolePermissionService.name,
    )
    const roleData = await this.prismaSystem.tb_application_role.findFirst({
      where: { id: data.id },
    })
    if (!roleData) {
      return Result.error('Application Role not found', ErrorCode.NOT_FOUND)
    }

    if (data.application_role_name) {
      const isRoleNameExist = await this.prismaSystem.tb_application_role.findFirst({
        where: {
          id: { not: data.id },
          name: data.application_role_name,
        },
      })
      if (isRoleNameExist && isRoleNameExist.id !== data.id) {
        return Result.error('Role name already exists', ErrorCode.ALREADY_EXISTS)
      }
    }

    const updatedId = await this.prismaSystem.$transaction(async (prisma) => {
      const updatedRole = await this.prismaSystem.tb_application_role.update({
        where: { id: data.id },
        data: {
          name: data?.application_role_name || roleData.name,
          is_active: data?.is_active !== undefined ? data.is_active : roleData.is_active,
          updated_by_id: user_id,
          updated_at: new Date(),
        }
      })

      if (data?.permissions?.remove && data.permissions.remove.length > 0) {
        for (const permissionId of data.permissions.remove) {
          await prisma.tb_application_role_tb_permission.deleteMany({
            where: {
              application_role_id: data.id,
              permission_id: permissionId,
            }
          })
        }
      }

      if (data?.permissions?.add && data.permissions.add.length > 0) {
        for (const permissionId of data.permissions.add) {
          const ifThisRoleHavePermission = await prisma.tb_application_role_tb_permission.findFirst({
            where: {
              application_role_id: data.id,
              permission_id: permissionId,
            }
          })
          if (ifThisRoleHavePermission) {
            continue
          }
          await prisma.tb_application_role_tb_permission.create({
            data: {
              application_role_id: data.id,
              permission_id: permissionId,
              is_active: true,
              created_by_id: user_id,
              created_at: new Date(),
            }
          })
        }
      }

      return updatedRole.id
    })

    return Result.ok({ id: updatedId })
  }

  @TryCatch
  async remove(id: string, user_id: string, bu_code: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'remove', id, user_id, bu_code },
      ApplicationRolePermissionService.name,
    )

    const isUserAssignedToRole = await this.prismaSystem.tb_user_tb_application_role.findFirst({
      where: { application_role_id: id },
    })
    if (isUserAssignedToRole) {
      return Result.error('Cannot delete role assigned to users', ErrorCode.INVALID_ARGUMENT)
    }

    const roleData = await this.prismaSystem.tb_application_role.findFirst({
      where: { id: id },
    })
    if (!roleData) {
      return Result.error('Application Role not found', ErrorCode.NOT_FOUND)
    }

    await this.prismaSystem.$transaction(async (prisma) => {
      await prisma.tb_application_role_tb_permission.deleteMany({
        where: { application_role_id: id },
      })

      await prisma.tb_application_role.delete({
        where: { id: id },
      })
    })

    return Result.ok({ id })
  }
}
