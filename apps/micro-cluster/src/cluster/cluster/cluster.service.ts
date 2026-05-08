import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  IClusterCreate,
  IClusterUpdate,
  IUserCluster,
  IUserClusterDTO,
  IUserClusterUpdate,
} from './interface/cluster.interface';
import QueryParams from 'src/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { enum_cluster_user_role } from '@repo/prisma-shared-schema-platform';
import {
  IPaginate,
  ClusterDetailResponseSchema,
  ClusterListItemResponseSchema,
  UserClusterByClusterIdSchema,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class ClusterService {
  private readonly logger: BackendLogger = new BackendLogger(
    ClusterService.name,
  );
  constructor(
    @Inject('KEYCLOAK_SERVICE')
    private readonly keycloakService: ClientProxy,
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) { }

  @TryCatch
  async createCluster(data: IClusterCreate, user_id: string): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'createCluster', data: data, user_id: user_id },
      ClusterService.name,
    );
    const findCluster = await this.prismaSystem.tb_cluster.findFirst({
      where: {
        code: data.code,
        name: data.name,
      },
    });

    if (findCluster) {
      return Result.error('Cluster already exists', ErrorCode.ALREADY_EXISTS);
    }

    const findUser = await this.prismaSystem.tb_user.findFirst({
      where: { id: user_id },
    });

    if (!findUser) {
      return Result.error('User not found. Please ensure the user is registered in the system.', ErrorCode.NOT_FOUND);
    }

    const createCluster = await this.prismaSystem.tb_cluster.create({
      data: {
        ...data,
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: createCluster.id });
  }

  @TryCatch
  async updateCluster(data: IClusterUpdate, user_id: string): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'updateCluster', data: data, user_id: user_id },
      ClusterService.name,
    );
    const cluster = await this.prismaSystem.tb_cluster.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!cluster) {
      return Result.error('Cluster not found', ErrorCode.NOT_FOUND);
    }

    const findCluster = await this.prismaSystem.tb_cluster.findFirst({
      where: {
        code: data.code ?? cluster.code,
        name: data.name ?? cluster.name,
        id: {
          not: data.id,
        },
      },
    });

    if (findCluster) {
      return Result.error('Cluster already exists', ErrorCode.ALREADY_EXISTS);
    }

    const findUser = await this.prismaSystem.tb_user.findFirst({
      where: { id: user_id },
    });

    if (!findUser) {
      return Result.error('User not found. Please ensure the user is registered in the system.', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_cluster.update({
      where: { id: data.id },
      data: {
        ...data,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    return Result.ok({ id: data.id });
  }

  @TryCatch
  async deleteCluster(id: string, user_id: string): Promise<Result<null>> {
    this.logger.debug(
      { function: 'deleteCluster', id: id, user_id: user_id },
      ClusterService.name,
    );
    const cluster = await this.prismaSystem.tb_cluster.findFirst({
      where: { id: id },
    });

    if (!cluster) {
      return Result.error('Cluster not found', ErrorCode.NOT_FOUND);
    }

    const findUser = await this.prismaSystem.tb_user.findFirst({
      where: { id: user_id },
    });

    if (!findUser) {
      return Result.error('User not found. Please ensure the user is registered in the system.', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_cluster.update({
      where: { id: id },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by_id: user_id,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    return Result.ok(null);
  }

  @TryCatch
  async listCluster(paginate: IPaginate): Promise<Result<{ paginate: unknown; data: unknown[] }>> {
    this.logger.debug(
      { function: 'listCluster', paginate: paginate },
      ClusterService.name,
    );
    const defaultSearchFields = ['name', 'code'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const clusters = await this.prismaSystem.tb_cluster.findMany({
      ...q.findMany(),
      select: {
        id: true,
        name: true,
        code: true,
        alias_name: true,
        logo_url: true,
        max_license_bu: true,
        is_active: true,
        info: true,
        created_at: true,
        created_by_id: true,
        tb_user_tb_cluster_created_by_idTotb_user: {
          select: { username: true, email: true },
        },
        updated_at: true,
        updated_by_id: true,
        tb_user_tb_cluster_updated_by_idTotb_user: {
          select: { username: true, email: true },
        },
        deleted_at: true,
        deleted_by_id: true,
        _count: {
          select: {
            tb_business_unit: true,
            tb_cluster_user: true,
          },
        },
      },
    });

    const total = await this.prismaSystem.tb_cluster.count({
      where: q.where(),
    });

    // Fetch total_max_license_users per cluster (sum of max_license_users from all BUs)
    const clusterIds = clusters.map((c) => c.id);
    const buAggregations = clusterIds.length > 0
      ? await this.prismaSystem.tb_business_unit.groupBy({
          by: ['cluster_id'],
          where: { cluster_id: { in: clusterIds }, is_active: true },
          _sum: { max_license_users: true },
        })
      : [];

    const buAggMap = new Map(
      buAggregations.map((agg) => [agg.cluster_id, agg._sum.max_license_users ?? 0]),
    );

    // Resolve deleted_by usernames
    const deletedByIds = clusters
      .map((c) => c.deleted_by_id)
      .filter((id): id is string => !!id);
    const deletedByUsers = deletedByIds.length > 0
      ? await this.prismaSystem.tb_user.findMany({
          where: { id: { in: [...new Set(deletedByIds)] } },
          select: { id: true, username: true, email: true },
        })
      : [];
    const deletedByMap = new Map(
      deletedByUsers.map((u) => [u.id, u.username ?? u.email ?? null]),
    );

    const serializedClusters = clusters.map((item) => {
      const parsed = ClusterListItemResponseSchema.parse(item);
      return {
        ...parsed,
        total_max_license_users: buAggMap.get(item.id) ?? 0,
        deleted_by_name: item.deleted_by_id ? deletedByMap.get(item.deleted_by_id) ?? null : null,
      };
    });

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedClusters,
    });
  }

  @TryCatch
  async getClusterById(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getClusterById', id: id },
      ClusterService.name,
    );
    const cluster = await this.prismaSystem.tb_cluster.findFirst({
      where: { id, deleted_at: null },
      select: {
        id: true,
        name: true,
        code: true,
        alias_name: true,
        logo_url: true,
        max_license_bu: true,
        is_active: true,
        info: true,
        tb_business_unit: {
          select: {
            id: true,
            name: true,
            code: true,
            max_license_users: true,
          },
        },
        tb_cluster_user: {
          select: {
            id: true,
            user_id: true,
            role: true,
            parent_bu_id: true,
          },
        },
      },
    });

    if (!cluster) {
      return Result.error('Cluster not found', ErrorCode.NOT_FOUND);
    }

    const users = await this.prismaSystem.tb_user.findMany({
      where: {
        id: {
          in: cluster.tb_cluster_user.map((item) => item.user_id),
        },
      },
      select: {
        id: true,
        email: true,
        platform_role: true,
        tb_user_profile_tb_user_profile_user_idTotb_user: {
          select: {
            firstname: true,
            lastname: true,
            middlename: true,
            telephone: true,
          },
        },
      },
    });


    const clusterWithUsers = {
      ...cluster,
      tb_cluster_user: cluster.tb_cluster_user.map((clusterUser) => {
        const user = users.find((u) => u.id === clusterUser.user_id);
        return {
          ...clusterUser,
          user: user ? {
            id: user.id,
            email: user.email,
            platform_role: user.platform_role,
            profile: user.tb_user_profile_tb_user_profile_user_idTotb_user[0] || null,
          } : null,
        };
      }),
    };

    const serializedCluster = ClusterDetailResponseSchema.parse(clusterWithUsers);

    const total_count_license_users = (cluster.tb_business_unit || []).reduce(
      (sum, bu) => sum + (bu.max_license_users ?? 0),
      0,
    );

    return Result.ok({
      ...serializedCluster,
      total_count_license_users,
    });
  }

  @TryCatch
  async getAllUserCluster(): Promise<Result<IUserClusterDTO[]>> {
    this.logger.debug(
      { function: 'getAllUserCluster' },
      ClusterService.name,
    );

    const userClusters = await this.prismaSystem.tb_cluster_user.findMany({
      where: { is_active: true },
      select: {
        user_id: true,
        role: true,
        parent_bu_id: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        deleted_at: true,
        deleted_by_id: true,
        tb_cluster: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!userClusters.length) {
      return Result.ok([]);
    }

    const userIds = [...new Set(userClusters.map(item => item.user_id))];

    const users = await this.prismaSystem.tb_user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        email: true,
        platform_role: true,
        tb_user_profile_tb_user_profile_user_idTotb_user: {
          select: {
            firstname: true,
            lastname: true,
            middlename: true,
            telephone: true,
          },
        },
      },
    });

    const userBusinessUnits = await this.prismaSystem.tb_user_tb_business_unit.findMany({
      where: {
        user_id: { in: userIds }
      },
      select: {
        user_id: true,
        tb_business_unit: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const userMap = new Map(users.map(user => [user.id, user]));

    const businessUnitMap = new Map(
      userBusinessUnits.map(item => [item.user_id, item.tb_business_unit])
    );

    const transformedData = userClusters
      .map((item) => {
        const user = userMap.get(item.user_id);
        if (!user) {
          return null;
        }

        const userProfile = user.tb_user_profile_tb_user_profile_user_idTotb_user?.[0];
        const businessUnit = businessUnitMap.get(item.user_id);

        return {
          id: user.id,
          email: user.email,
          platform_role: user.platform_role,
          role: item.role,
          parent_bu_id: item.parent_bu_id,
          cluster: item.tb_cluster,
          user_info: userProfile || null,
          business_unit: businessUnit || null,
          created_at: item.created_at,
          created_by_id: item.created_by_id,
          updated_at: item.updated_at,
          updated_by_id: item.updated_by_id,
          deleted_at: item.deleted_at,
          deleted_by_id: item.deleted_by_id,
        };
      })
      .filter(Boolean);

    return Result.ok(transformedData);
  }

  @TryCatch
  async getUserClusterById(cluster_id: string): Promise<Result<unknown[]>> {
    this.logger.debug(
      { function: 'getUserClusterById', cluster_id: cluster_id },
      ClusterService.name,
    );
    const userCluster = await this.prismaSystem.tb_cluster_user
      .findMany({
        where: {
          cluster_id,
          is_active: true,
        },
        select: {
          id: true,
          user_id: true,
          role: true,
          parent_bu_id: true,
        },
      })
      .then(async (res) => {
        return Promise.all(
          res.map(async (item) => {
            const user = await this.prismaSystem.tb_user.findMany({
              where: { id: item.user_id },
              select: {
                email: true,
                platform_role: true,
                tb_user_profile_tb_user_profile_user_idTotb_user: {
                  select: {
                    firstname: true,
                    lastname: true,
                    middlename: true,
                    telephone: true,
                  },
                },
              },
            });
            return {
              id: item.id,
              user_id: item.user_id,
              email: user[0].email,
              role: item.role,
              parent_bu_id: item.parent_bu_id,
              userInfo:
                user[0].tb_user_profile_tb_user_profile_user_idTotb_user[0],
            };
          }),
        );
      });

    const serializedUserCluster = userCluster.map((item) =>
      UserClusterByClusterIdSchema.parse(item)
    );

    return Result.ok(serializedUserCluster);
  }

  @TryCatch
  async createUserCluster(data: IUserCluster, user_id: string): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'createUserCluster', data: data, user_id: user_id },
      ClusterService.name,
    );
    const findCluster = await this.prismaSystem.tb_cluster.findFirst({
      where: { id: data.cluster_id },
    });

    if (!findCluster) {
      return Result.error('Cluster not found', ErrorCode.NOT_FOUND);
    }

    const findUser = await this.prismaSystem.tb_user.findFirst({
      where: { id: data.user_id },
    });

    if (!findUser) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    const createUserCluster = await this.prismaSystem.tb_cluster_user.create({
      data: {
        user_id: data.user_id,
        cluster_id: data.cluster_id,
        is_active: data.is_active,
        role: data.role as enum_cluster_user_role,
        parent_bu_id: data.parent_bu_id ?? null,
        created_by_id: user_id,
      },
    });

    // Add Cluster to user in Keycloak
    try {
      const keycloakResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.manageCluster', service: 'keycloak' },
          {
            userId: data.user_id,
            action: 'add',
            cluster: {
              cluster_id: findCluster.id,
              cluster_code: findCluster.code,
              role: data.role || 'user',
            },
          },
        ),
      );

      if (!keycloakResponse.success) {
        this.logger.warn(
          `Failed to add Cluster to Keycloak for user ${data.user_id}: ${keycloakResponse.error}`,
          ClusterService.name,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error calling Keycloak service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ClusterService.name,
      );
    }

    // Add user to Keycloak group if cluster has keycloak_group_id
    const clusterInfo = findCluster.info as Record<string, unknown> | null;
    const keycloakGroupId = clusterInfo?.keycloak_group_id as string | undefined;
    if (keycloakGroupId) {
      try {
        const groupResponse = await firstValueFrom(
          this.keycloakService.send(
            { cmd: 'keycloak.users.manageClusterGroup', service: 'keycloak' },
            {
              userId: data.user_id,
              groupId: keycloakGroupId,
              action: 'add',
            },
          ),
        );

        if (!groupResponse.success) {
          this.logger.warn(
            `Failed to add user to Keycloak group for cluster ${findCluster.code}: ${groupResponse.error}`,
            ClusterService.name,
          );
        }
      } catch (error: unknown) {
        this.logger.error(
          `Error calling Keycloak group service: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ClusterService.name,
        );
      }
    }

    return Result.ok({ id: createUserCluster.id });
  }

  @TryCatch
  async updateUserCluster(
    data: IUserClusterUpdate,
    user_id: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'updateUserCluster', data: data, user_id: user_id },
      ClusterService.name,
    );
    const findUserCluster = await this.prismaSystem.tb_cluster_user.findFirst({
      where: { id: data.id },
    });

    if (!findUserCluster) {
      return Result.error('User cluster not found', ErrorCode.NOT_FOUND);
    }

    if (data.cluster_id) {
      const findCluster = await this.prismaSystem.tb_cluster.findFirst({
        where: { id: data.cluster_id },
      });

      if (!findCluster) {
        return Result.error('Cluster not found', ErrorCode.NOT_FOUND);
      }
    }

    await this.prismaSystem.tb_cluster_user.update({
      where: { id: data.id },
      data: {
        cluster_id: data.cluster_id ?? findUserCluster.cluster_id,
        user_id: data.user_id ?? findUserCluster.user_id,
        is_active: data.is_active ?? findUserCluster.is_active,
        role: (data.role as enum_cluster_user_role) ?? findUserCluster.role,
        parent_bu_id: data.parent_bu_id !== undefined ? data.parent_bu_id : findUserCluster.parent_bu_id,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    return Result.ok({ id: data.id });
  }

  @TryCatch
  async deleteUserCluster(id: string, user_id: string): Promise<Result<null>> {
    this.logger.debug(
      { function: 'deleteUserCluster', id: id, user_id: user_id },
      ClusterService.name,
    );
    const findUserCluster = await this.prismaSystem.tb_cluster_user.findFirst({
      where: { id },
      include: {
        tb_cluster: true,
      },
    });

    if (!findUserCluster) {
      return Result.error('User cluster not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_cluster_user.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    // Remove Cluster from user in Keycloak
    try {
      const keycloakResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.manageCluster', service: 'keycloak' },
          {
            userId: findUserCluster.user_id,
            action: 'remove',
            cluster: {
              cluster_id: findUserCluster.cluster_id,
            },
          },
        ),
      );

      if (!keycloakResponse.success) {
        this.logger.warn(
          `Failed to remove Cluster from Keycloak for user ${findUserCluster.user_id}: ${keycloakResponse.error}`,
          ClusterService.name,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error calling Keycloak service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ClusterService.name,
      );
    }

    // Remove user from Keycloak group if cluster has keycloak_group_id
    const clusterInfo = findUserCluster.tb_cluster.info as Record<string, unknown> | null;
    const keycloakGroupId = clusterInfo?.keycloak_group_id as string | undefined;
    if (keycloakGroupId) {
      try {
        const groupResponse = await firstValueFrom(
          this.keycloakService.send(
            { cmd: 'keycloak.users.manageClusterGroup', service: 'keycloak' },
            {
              userId: findUserCluster.user_id,
              groupId: keycloakGroupId,
              action: 'remove',
            },
          ),
        );

        if (!groupResponse.success) {
          this.logger.warn(
            `Failed to remove user from Keycloak group for cluster ${findUserCluster.tb_cluster.code}: ${groupResponse.error}`,
            ClusterService.name,
          );
        }
      } catch (error: unknown) {
        this.logger.error(
          `Error calling Keycloak group service: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ClusterService.name,
        );
      }
    }

    return Result.ok(null);
  }
}
