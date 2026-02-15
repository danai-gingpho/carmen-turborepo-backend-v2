import { Inject, Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import QueryParams from '@/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPaginate,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class UserService {
  private readonly logger: BackendLogger = new BackendLogger(UserService.name);

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) {}

  @TryCatch
  async listUsers(
    paginate: IPaginate,
  ): Promise<Result<{ paginate: any; data: any[] }>> {
    this.logger.debug(
      { function: 'listUsers', paginate: paginate },
      UserService.name,
    );
    const defaultSearchFields = ['username', 'email'];

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

    const { where, orderBy, skip, take } = q.findMany();

    // Check if 'name' sort is requested (maps to profile firstname+middlename+lastname)
    let nameSortDir: 'asc' | 'desc' | null = null;
    const filteredOrderBy: any[] = [];
    if (Array.isArray(orderBy)) {
      for (const o of orderBy) {
        const key = Object.keys(o)[0];
        if (key === 'name') {
          nameSortDir = o[key] === 'desc' ? 'desc' : 'asc';
        } else {
          filteredOrderBy.push(o);
        }
      }
    }

    let userIds: string[] | null = null;

    if (nameSortDir) {
      // Use raw SQL to sort by concatenated profile name
      const search = q.search || '';
      const direction = nameSortDir === 'desc' ? 'DESC' : 'ASC';
      const rows: { id: string }[] = await this.prismaSystem.$queryRawUnsafe(
        `SELECT u.id FROM tb_user u
         LEFT JOIN tb_user_profile p ON p.user_id = u.id
         WHERE ($1 = '' OR u.username ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
         ORDER BY CONCAT(COALESCE(p.firstname,''), ' ', COALESCE(p.middlename,''), ' ', COALESCE(p.lastname,'')) ${direction}
         LIMIT $2 OFFSET $3`,
        search,
        take,
        skip,
      );
      userIds = rows.map((r) => r.id);
    }

    const users = await this.prismaSystem.tb_user
      .findMany({
        where: userIds ? { id: { in: userIds } } : where,
        orderBy: userIds ? undefined : (filteredOrderBy.length > 0 ? filteredOrderBy : orderBy),
        skip: userIds ? undefined : skip,
        take: userIds ? undefined : take,
        include: {
          tb_user_profile_tb_user_profile_user_idTotb_user: {
            select: {
              firstname: true,
              lastname: true,
              middlename: true,
            },
          },
          tb_user_tb_business_unit_tb_user_tb_business_unit_user_idTotb_user: {
            select: {
              id: true,
              is_active: true,
            },
          },
          _count: {
            select: {
              tb_cluster_user_tb_cluster_user_user_idTotb_user: true,
            },
          },
        },
      })
      .then((data) => {
        const mapped = data.map((item: any) => {
          const profile =
            item.tb_user_profile_tb_user_profile_user_idTotb_user?.[0];
          return {
            id: item.id,
            username: item.username,
            email: item.email,
            alias_name: item.alias_name,
            platform_role: item.platform_role,
            is_active: item.is_active,
            is_online: item.is_online,
            firstname: profile?.firstname ?? null,
            lastname: profile?.lastname ?? null,
            middlename: profile?.middlename ?? null,
            business_unit:
              (item.tb_user_tb_business_unit_tb_user_tb_business_unit_user_idTotb_user || []).map((bu: any) => ({
                id: bu.id,
                is_active: bu.is_active,
              })),
            cluster_count:
              item._count?.tb_cluster_user_tb_cluster_user_user_idTotb_user ??
              0,
            created_at: item.created_at,
            created_by_id: item.created_by_id,
            updated_at: item.updated_at,
            updated_by_id: item.updated_by_id,
          };
        });

        // Preserve the raw SQL sort order
        if (userIds) {
          const idIndex = new Map(userIds.map((id, i) => [id, i]));
          mapped.sort((a, b) => (idIndex.get(a.id) ?? 0) - (idIndex.get(b.id) ?? 0));
        }

        return mapped;
      });

    const total = await this.prismaSystem.tb_user.count({
      where: q.where(),
    });

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: users,
    });
  }

  @TryCatch
  async getUser(id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'getUser', id: id }, UserService.name);
    const user = await this.prismaSystem.tb_user.findUnique({
      where: { id },
      include: {
        tb_user_profile_tb_user_profile_user_idTotb_user: true,
        tb_user_tb_business_unit_tb_user_tb_business_unit_user_idTotb_user: {
          include: {
            tb_business_unit: {
              select: {
                id: true,
                code: true,
                name: true,
                is_active: true,
                cluster_id: true,
              },
            },
          },
        },
        tb_cluster_user_tb_cluster_user_user_idTotb_user: {
          where: { is_active: true },
          include: {
            tb_cluster: {
              select: {
                id: true,
                code: true,
                name: true,
                is_active: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    const {
      tb_user_profile_tb_user_profile_user_idTotb_user,
      tb_user_tb_business_unit_tb_user_tb_business_unit_user_idTotb_user,
      tb_cluster_user_tb_cluster_user_user_idTotb_user,
      ...rest
    } = user as any;
    const profile = tb_user_profile_tb_user_profile_user_idTotb_user?.[0];
    const business_units = (tb_user_tb_business_unit_tb_user_tb_business_unit_user_idTotb_user || []).map((ub: any) => ({
      id: ub.id,
      role: ub.role,
      is_default: ub.is_default,
      is_active: ub.is_active,
      business_unit: ub.tb_business_unit || null,
    }));
    const clusters = (tb_cluster_user_tb_cluster_user_user_idTotb_user || []).map((cu: any) => ({
      id: cu.id,
      cluster_id: cu.cluster_id,
      role: cu.role,
      cluster: cu.tb_cluster || null,
    }));

    return Result.ok({
      ...rest,
      profile: profile || null,
      business_units,
      clusters,
    });
  }

  @TryCatch
  async createUser(data: any): Promise<Result<{ id: string }>> {
    this.logger.debug({ function: 'createUser', data: data }, UserService.name);
    const {
      username,
      email,
      firstname,
      lastname,
      middlename,
      platform_role,
      is_active,
    } = data;

    const findUser = await this.prismaSystem.tb_user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (findUser) {
      return Result.error('User already exists', ErrorCode.ALREADY_EXISTS);
    }

    const newUser = await this.prismaSystem.tb_user.create({
      data: {
        username,
        email,
        platform_role,
        is_active,
        created_at: new Date(),
        updated_at: new Date(),
        tb_user_profile_tb_user_profile_user_idTotb_user: {
          create: [
            {
              firstname,
              lastname,
              middlename,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        },
      },
    });

    return Result.ok({ id: newUser.id });
  }

  @TryCatch
  async updateUser(id: string, data: any): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'updateUser', id: id, data: data },
      UserService.name,
    );
    const {
      username,
      email,
      firstname,
      lastname,
      middlename,
      platform_role,
      is_active,
    } = data;

    const user = await this.prismaSystem.tb_user.findUnique({
      where: { id },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    if (username || email) {
      const findUser = await this.prismaSystem.tb_user.findFirst({
        where: {
          OR: [{ username }, { email }],
          NOT: { id },
        },
      });

      if (findUser) {
        return Result.error(
          'Username or email already exists',
          ErrorCode.ALREADY_EXISTS,
        );
      }
    }

    await this.prismaSystem.tb_user.update({
      where: { id },
      data: {
        username,
        email,
        platform_role,
        is_active,
        updated_at: new Date(),
        tb_user_profile_tb_user_profile_user_idTotb_user: {
          updateMany: {
            where: { user_id: id },
            data: {
              firstname,
              lastname,
              middlename,
              updated_at: new Date(),
            },
          },
        },
      },
    });

    return Result.ok({ id });
  }

  @TryCatch
  async deleteUser(id: string): Promise<Result<null>> {
    this.logger.debug({ function: 'deleteUser', id: id }, UserService.name);
    const user = await this.prismaSystem.tb_user.findUnique({
      where: { id },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_user.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return Result.ok(null);
  }
}
