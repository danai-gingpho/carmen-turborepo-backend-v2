import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
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
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
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

    await this.prismaSystem.tb_cluster.update({
      where: { id: id },
      data: {
        is_active: false,
        updated_at: new Date(),
        updated_by_id: user_id,
      },
    });

    return Result.ok(null);
  }

  @TryCatch
  async listCluster(paginate: IPaginate): Promise<Result<{ paginate: any; data: any[] }>> {
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
        is_active: true,
        info: true,
        _count: {
          select: {
            tb_business_unit: {
              where: {
                cluster_id: {
                  in: q.where().id,
                },
              },
            },
            tb_cluster_user: {
              where: {
                cluster_id: {
                  in: q.where().id,
                },
              },
            },
          },
        },
      },
    });

    const total = await this.prismaSystem.tb_cluster.count({
      where: q.where(),
    });

    const serializedClusters = clusters.map((item) =>
      ClusterListItemResponseSchema.parse(item)
    );

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
  async getClusterById(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'getClusterById', id: id },
      ClusterService.name,
    );
    const cluster = await this.prismaSystem.tb_cluster.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        is_active: true,
        info: true,
        tb_business_unit: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_cluster_user: {
          select: {
            id: true,
            user_id: true,
            role: true,
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

    return Result.ok(serializedCluster);
  }

  // async getAllUserCluster(): Promise<any> {
  //   this.logger.debug(
  //     { function: 'getAllUserCluster' },
  //     ClusterService.name,
  //   );
  //   const userCluster = await this.prismaSystem.tb_cluster_user
  //     .findMany({
  //       where: { is_active: true },
  //       select: {
  //         user_id: true,
  //         role: true,
  //         tb_cluster: {
  //           select: {
  //             id: true,
  //             name: true,
  //           },
  //         },
  //       },
  //     })
  //     .then(async (res) => {
  //       return Promise.all(
  //         res.map(async (item) => {
  //           const user = await this.prismaSystem.tb_user.findMany({
  //             where: { id: item.user_id },
  //             select: {
  //               id: true,
  //               email: true,
  //               platform_role: true,
  //               tb_user_profile_tb_user_profile_user_idTotb_user: {
  //                 select: {
  //                   firstname: true,
  //                   lastname: true,
  //                   middlename: true,
  //                 },
  //               },
  //             },
  //           });
  //           return {
  //             id: user[0].id,
  //             email: user[0].email,
  //             platform_role: user[0].platform_role,
  //             role: item.role,
  //             cluster: item.tb_cluster,
  //             userInfo:
  //               user[0].tb_user_profile_tb_user_profile_user_idTotb_user[0],
  //           };
  //         }),
  //       );
  //     });

  //   return {
  //     data: userCluster,
  //     response: {
  //       status: HttpStatus.OK,
  //       message: 'User cluster retrieved successfully',
  //     },
  //   };
  // }


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
          cluster: item.tb_cluster,
          user_info: userProfile || null,
          business_unit: businessUnit || null,
        };
      })
      .filter(Boolean);

    return Result.ok(transformedData);
  }

  @TryCatch
  async getUserClusterById(cluster_id: string): Promise<Result<any[]>> {
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
          user_id: true,
          role: true,
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
              email: user[0].email,
              role: item.role,
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
        created_by_id: user_id,
      },
    });

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

    return Result.ok(null);
  }

  // async setDefaultTenant(user_id: string, tenant_id: string) {
  //   const user = await this.prismaSystem.tb_user.findFirst({
  //     where: { id: user_id },
  //   });

  //   if (!user) {
  //     return {
  //       response: {
  //         status: HttpStatus.NO_CONTENT,
  //         message: 'User not found',
  //       },
  //     };
  //   }

  //   const findTenant = await this.prismaSystem.tb_business_unit.findFirst({
  //     where: { id: tenant_id },
  //   });

  //   if (!findTenant) {
  //     return {
  //       response: {
  //         status: HttpStatus.NO_CONTENT,
  //         message: 'Tenant not found',
  //       },
  //     };
  //   }

  //   // Update the default tenant
  //   await this.prismaSystem.tb_user_tb_business_unit.updateMany({
  //     where: {
  //       user_id: user_id,
  //       business_unit_id: tenant_id,
  //     },
  //     data: { is_default: true },
  //   });

  //   // Update the default tenant to false
  //   await this.prismaSystem.tb_user_tb_business_unit.updateMany({
  //     where: {
  //       user_id: user_id,
  //       business_unit_id: {
  //         not: tenant_id,
  //       },
  //     },
  //     data: {
  //       is_default: false,
  //     },
  //   });

  //   // Retrieve the updated records
  //   const updatedListRecords = await this.prismaSystem.tb_user_tb_business_unit
  //     .findMany({
  //       where: {
  //         user_id: user_id,
  //         is_active: true,
  //       },
  //       select: {
  //         is_default: true,
  //         tb_business_unit: {
  //           select: {
  //             id: true,
  //             name: true,
  //           },
  //         },
  //       },
  //     })
  //     .then((res) => {
  //       return res.map((item) => {
  //         return {
  //           id: item.tb_business_unit.id,
  //           name: item.tb_business_unit.name,
  //           is_default: item.is_default,
  //         };
  //       });
  //     });

  //   return {
  //     data: updatedListRecords,
  //     response: {
  //       status: HttpStatus.OK,
  //       message: 'Default tenant updated successfully',
  //     },
  //   };
  // }
}
