import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant/dist';
import { TenantService } from '@/tenant/tenant.service';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class UserApplicationRoleService {
  private readonly logger: BackendLogger = new BackendLogger(
    UserApplicationRoleService.name,
  );

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async findByUser(user_id: string, bu_code: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findByUser', user_id, bu_code },
      UserApplicationRoleService.name,
    );

    const user = await this.prismaSystem.tb_user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    const userProfile = await this.prismaSystem.tb_user_profile.findFirst({
      where: { user_id: user_id },
    });

    const tenant = await this.tenantService.getTenantByCode(bu_code, user_id);

    const userRoles = await this.prismaSystem.tb_user_tb_application_role.findMany({
      where: {
        user_id: user_id,
        tb_application_role: {
          business_unit_id: tenant.id,
        },
      },
      include: {
        tb_application_role: true,
      },
    });

    const formattedData = {
      user_id: user.id,
      username: user.username,
      firstname: userProfile?.firstname,
      middlename: userProfile?.middlename,
      lastname: userProfile?.lastname,
      application_roles: userRoles.map((role) => ({
        id: role.id,
        application_role_id: role.application_role_id,
        application_role_name: role.tb_application_role.name,
        application_role_description: role.tb_application_role.description,
        business_unit_id: role.tb_application_role.business_unit_id,
        assigned_at: role.created_at,
      })),
    };

    return Result.ok(formattedData);
  }

  @TryCatch
  async assign(
    data: {
      user_id: string; application_role_id: {
        add: string[];
      }
    },
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'assign', data, user_id, bu_code },
      UserApplicationRoleService.name,
    );

    const tenant = await this.tenantService.getTenantByCode(bu_code, user_id)


    // Check if user exists
    const user = await this.prismaSystem.tb_user_tb_business_unit.findFirst({
      where: {
        user_id: data.user_id,
        business_unit_id: tenant.id,
      },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    // Check if application role exists
    const applicationRole = await this.prismaSystem.tb_application_role.findFirst({
      where: {
        id: {
          in: data.application_role_id.add,
        },
        business_unit_id: tenant.id,
      },
    });

    if (!applicationRole) {
      return Result.error('Application role not found', ErrorCode.NOT_FOUND);
    }

    // Check if assignment already exists
    const existingAssignment = await this.prismaSystem.tb_user_tb_application_role.findFirst({
      where: {
        user_id: data.user_id,
        application_role_id: {
          in: data.application_role_id.add,
        },
      },
    });

    if (existingAssignment) {
      return Result.error('User already has this application role assigned', ErrorCode.ALREADY_EXISTS);
    }

    const bulkCreateData = data.application_role_id.add.map((roleId) => ({
      user_id: data.user_id,
      application_role_id: roleId,
      created_by_id: user_id,
      created_at: new Date(),
    }))

    // Create the assignment
    const newAssignment = await this.prismaSystem.tb_user_tb_application_role.createMany({
      data: bulkCreateData,
    })

    return Result.ok({ id: data.user_id });
  }

  @TryCatch
  async update(
    data: {
      user_id: string;
      application_role_id: {
        add?: string[];
        remove?: string[];
      };
    },
    requestUserId: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, requestUserId, bu_code },
      UserApplicationRoleService.name,
    );

    const tenant = await this.tenantService.getTenantByCode(bu_code, requestUserId);

    // Check if user exists in the business unit
    const user = await this.prismaSystem.tb_user_tb_business_unit.findFirst({
      where: {
        user_id: data.user_id,
        business_unit_id: tenant.id,
      },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    const addRoles = data.application_role_id?.add || [];
    const removeRoles = data.application_role_id?.remove || [];

    // Validate roles to add exist
    if (addRoles.length > 0) {
      const validAddRoles = await this.prismaSystem.tb_application_role.findMany({
        where: {
          id: { in: addRoles },
          business_unit_id: tenant.id,
        },
      });

      if (validAddRoles.length !== addRoles.length) {
        return Result.error('Some application roles to add were not found', ErrorCode.NOT_FOUND);
      }

      // Check for existing assignments to avoid duplicates
      const existingAssignments = await this.prismaSystem.tb_user_tb_application_role.findMany({
        where: {
          user_id: data.user_id,
          application_role_id: { in: addRoles },
        },
      });

      const existingRoleIds = existingAssignments.map((a) => a.application_role_id);
      const rolesToAdd = addRoles.filter((roleId) => !existingRoleIds.includes(roleId));

      if (rolesToAdd.length > 0) {
        const bulkCreateData = rolesToAdd.map((roleId) => ({
          user_id: data.user_id,
          application_role_id: roleId,
          created_by_id: requestUserId,
          created_at: new Date(),
        }));

        await this.prismaSystem.tb_user_tb_application_role.createMany({
          data: bulkCreateData,
        });
      }
    }

    // Remove roles
    if (removeRoles.length > 0) {
      const validRemoveRoles = await this.prismaSystem.tb_application_role.findMany({
        where: {
          id: { in: removeRoles },
          business_unit_id: tenant.id,
        },
      });

      if (validRemoveRoles.length !== removeRoles.length) {
        return Result.error('Some application roles to remove were not found', ErrorCode.NOT_FOUND);
      }

      await this.prismaSystem.tb_user_tb_application_role.deleteMany({
        where: {
          user_id: data.user_id,
          application_role_id: { in: removeRoles },
        },
      });
    }

    return Result.ok({ id: data.user_id });
  }

  @TryCatch
  async remove(
    data: { user_id: string; application_role_id: string },
    requestUserId: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'remove', data, requestUserId, bu_code },
      UserApplicationRoleService.name,
    );

    const tenant = await this.tenantService.getTenantByCode(bu_code, requestUserId);
    const user = await this.prismaSystem.tb_user_tb_business_unit.findFirst({
      where: {
        user_id: data.user_id,
        business_unit_id: tenant.id,
      },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    const applicationRole = await this.prismaSystem.tb_application_role.findUnique({
      where: {
        id: data.application_role_id,
        business_unit_id: tenant.id,
      },
    });

    if (!applicationRole) {
      return Result.error('Application role not found', ErrorCode.NOT_FOUND);
    }

    // Check if assignment exists
    const existingAssignment = await this.prismaSystem.tb_user_tb_application_role.findFirst({
      where: {
        user_id: data.user_id,
        application_role_id: data.application_role_id,
      },
    });

    if (!existingAssignment) {
      return Result.error('User does not have this application role assigned', ErrorCode.NOT_FOUND);
    }

    // Delete the assignment
    await this.prismaSystem.tb_user_tb_application_role.delete({
      where: { id: existingAssignment.id },
    });

    return Result.ok({ id: data.user_id });
  }
}
