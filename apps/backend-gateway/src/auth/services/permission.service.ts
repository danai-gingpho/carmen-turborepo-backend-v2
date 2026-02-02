import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { BackendLogger } from 'src/common/helpers/backend.logger';

export interface UserPermissions {
  [resource: string]: string[];
}

@Injectable()
export class PermissionService {
  private readonly logger = new BackendLogger(PermissionService.name);

  constructor(
    @Inject('PRISMA_SYSTEM') private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) { }

  /**
   * Fetches user permissions from the database
   * Returns permissions in the format: { resource: [actions] }
   * Example: { "procurement.purchase_request": ["view", "create"], "master.vendor": ["view"] }
   *
   * SQL equivalent:
   * SELECT tp.resource, tp.action
   * FROM tb_user_tb_application_role AS tutar
   * JOIN tb_application_role_tb_permission tartp ON tutar.application_role_id = tartp.application_role_id
   * JOIN tb_permission tp ON tartp.permission_id = tp.id
   * WHERE user_id = ?
   */
  async getUserPermissions(userId: string, buId: string): Promise<UserPermissions> {
    try {
      this.logger.debug(`Fetching permissions for userId: ${userId}`);

      const userRoles = await this.prismaSystem.tb_user_tb_application_role.findMany({
        where: {
          user_id: userId,
          tb_application_role: {
            business_unit_id: buId
          }
        },
        include: {
          tb_application_role: {
            include: {
              tb_application_role_tb_permission: {
                include: {
                  tb_permission: {
                    select: {
                      resource: true,
                      action: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      this.logger.debug(`Found ${userRoles.length} roles for user ${userId}`);

      // Transform the data into { resource: [actions] } format
      const permissionsMap: Record<string, Set<string>> = {};

      for (const userRole of userRoles) {
        const rolePermissions = userRole.tb_application_role.tb_application_role_tb_permission;

        for (const rolePermission of rolePermissions) {
          const { resource, action } = rolePermission.tb_permission;

          if (!permissionsMap[resource]) {
            permissionsMap[resource] = new Set<string>();
          }
          permissionsMap[resource].add(action);
        }
      }

      // Convert Set to Array for JSON serialization
      const permissions: UserPermissions = {};
      for (const [resource, actions] of Object.entries(permissionsMap)) {
        permissions[resource] = Array.from(actions);
      }

      this.logger.debug({
        userId,
        permissionCount: Object.keys(permissions).length,
        permissions,
      }, 'User permissions fetched successfully');

      return permissions;
    } catch (error) {
      this.logger.error(`Failed to fetch permissions for user ${userId}`, error);
      return {};
    }
  }

  /**
   * Check if user has the required permissions
   * Supports hierarchical permissions (e.g., 'view_all' or 'view_department' satisfies 'view')
   * Resources can use dot notation: 'procurement.purchase_request'
   * Actions use underscore: 'view', 'view_all', 'view_department'
   */
  hasPermission(
    userPermissions: UserPermissions,
    requiredResource: string,
    requiredActions: string[],
  ): boolean {
    const userActions = userPermissions[requiredResource];

    // If user doesn't have this resource at all, deny
    if (!userActions || !Array.isArray(userActions)) {
      return false;
    }

    // Check if user has all required actions for this resource
    for (const requiredAction of requiredActions) {
      const hasAction = userActions.some((userAction) => {
        // Exact match
        if (userAction === requiredAction) {
          return true;
        }

        // Hierarchical match: 'view_all' or 'view_department' should satisfy 'view'
        // Check if userAction starts with requiredAction followed by underscore
        if (userAction.startsWith(`${requiredAction}_`)) {
          return true;
        }

        return false;
      });

      if (!hasAction) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if user has all required permissions
   */
  hasAllPermissions(
    userPermissions: UserPermissions,
    requiredPermissions: Record<string, string[]>,
  ): boolean {
    for (const [resource, requiredActions] of Object.entries(requiredPermissions)) {
      if (!this.hasPermission(userPermissions, resource, requiredActions)) {
        return false;
      }
    }
    return true;
  }
}
