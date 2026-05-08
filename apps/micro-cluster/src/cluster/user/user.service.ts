import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import QueryParams from '@/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPaginate,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';
import { formatUserName } from './format-user-name';

@Injectable()
export class UserService {
  private readonly logger: BackendLogger = new BackendLogger(UserService.name);

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('KEYCLOAK_SERVICE')
    private readonly keycloakService: ClientProxy,
  ) {}

  @TryCatch
  async listUsers(
    paginate: IPaginate,
  ): Promise<Result<{ paginate: unknown; data: unknown[] }>> {
    this.logger.debug(
      { function: 'listUsers', paginate: paginate },
      UserService.name,
    );
    const profileFields = ['firstname', 'lastname', 'middlename'];
    const defaultSearchFields = ['username', 'email'];

    // Separate profile fields from direct tb_user fields
    const rawSearchFields = Array.isArray(paginate.searchfields) && paginate.searchfields.length > 0
      ? paginate.searchfields.flatMap((f: string) => f.split(',')).map((f: string) => f.trim()).filter(Boolean)
      : defaultSearchFields;
    const directFields = rawSearchFields.filter((f: string) => !profileFields.includes(f.split('|')[0]));
    const relatedProfileFields = rawSearchFields.filter((f: string) => profileFields.includes(f.split('|')[0]));

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      directFields.length > 0 ? directFields : undefined,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const { where, orderBy, skip, take } = q.findMany();

    // Add profile field search conditions to the OR clause
    if (paginate.search && relatedProfileFields.length > 0) {
      const profileOrConditions = relatedProfileFields.map((field: string) => ({
        tb_user_profile_tb_user_profile_user_idTotb_user: {
          some: {
            [field.split('|')[0]]: { contains: paginate.search, mode: 'insensitive' as const },
          },
        },
      }));

      if (!where.OR) {
        where.OR = profileOrConditions;
      } else {
        where.OR = [...where.OR, ...profileOrConditions];
      }
    }

    // Check if 'name' sort is requested (maps to profile firstname+middlename+lastname)
    let nameSortDir: 'asc' | 'desc' | null = null;
    const filteredOrderBy: Record<string, string>[] = [];
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
        const mapped = data.map((item) => {
          const profile =
            item.tb_user_profile_tb_user_profile_user_idTotb_user?.[0];
          return {
            id: item.id,
            username: item.username,
            email: item.email,
            alias_name: (item as any).alias_name,
            platform_role: item.platform_role,
            is_active: item.is_active,
            is_online: item.is_online,
            firstname: profile?.firstname ?? null,
            lastname: profile?.lastname ?? null,
            middlename: profile?.middlename ?? null,
            business_unit:
              (item.tb_user_tb_business_unit_tb_user_tb_business_unit_user_idTotb_user || []).map((bu) => ({
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
      where,
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
  async getUser(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'getUser', id: id }, UserService.name);
    const user = await this.prismaSystem.tb_user.findFirst({
      where: { id, deleted_at: null },
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
     
    } = user as unknown as Record<string, any>;
    const profile = tb_user_profile_tb_user_profile_user_idTotb_user?.[0];
    const business_units = (tb_user_tb_business_unit_tb_user_tb_business_unit_user_idTotb_user || []).map((ub) => ({
      id: ub.id,
      role: ub.role,
      is_default: ub.is_default,
      is_active: ub.is_active,
      business_unit: ub.tb_business_unit || null,
    }));
    const clusters = (tb_cluster_user_tb_cluster_user_user_idTotb_user || []).map((cu) => ({
      id: cu.id,
      cluster_id: cu.cluster_id,
      role: cu.role,
      parent_bu_id: cu.parent_bu_id || null,
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
      password,
    } = data;

    const findUser = await this.prismaSystem.tb_user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (findUser) {
      return Result.error('User already exists', ErrorCode.ALREADY_EXISTS);
    }

    // 1. Provision the user in Keycloak first so tb_user.id == Keycloak user id
    const kcResponse: any = await firstValueFrom(
      this.keycloakService.send(
        { cmd: 'keycloak.users.create', service: 'keycloak' },
        {
          data: {
            username,
            email,
            firstName: firstname,
            lastName: lastname,
            enabled: is_active ?? true,
            emailVerified: true,
            credentials: password
              ? [{ type: 'password', value: password, temporary: false }]
              : undefined,
          },
        },
      ),
    );

    if (kcResponse?.response?.status !== 201 && kcResponse?.response?.status !== 200) {
      return Result.error(
        kcResponse?.response?.message || 'Failed to create user in Keycloak',
        ErrorCode.INTERNAL,
      );
    }

    const keycloakUserId: string = kcResponse?.data?.userId;
    if (!keycloakUserId) {
      return Result.error('Keycloak did not return a user id', ErrorCode.INTERNAL);
    }

    // 2. Create tb_user with the Keycloak id; roll back Keycloak on failure
    try {
      const newUser = await this.prismaSystem.tb_user.create({
        data: {
          id: keycloakUserId,
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
    } catch (error) {
      // Roll back Keycloak user to keep systems in sync
      try {
        await firstValueFrom(
          this.keycloakService.send(
            { cmd: 'keycloak.users.delete', service: 'keycloak' },
            { userId: keycloakUserId },
          ),
        );
      } catch (rollbackError) {
        this.logger.error(
          `Failed to roll back Keycloak user ${keycloakUserId}: ${
            rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
          }`,
          UserService.name,
        );
      }
      throw error;
    }
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

    // Sync changes to Keycloak (best-effort; tb_user.id == Keycloak user id)
    try {
      const kcData: Record<string, unknown> = {};
      if (username !== undefined) kcData.username = username;
      if (email !== undefined) kcData.email = email;
      if (firstname !== undefined) kcData.firstName = firstname;
      if (lastname !== undefined) kcData.lastName = lastname;
      if (is_active !== undefined) kcData.enabled = is_active;

      if (Object.keys(kcData).length > 0) {
        await firstValueFrom(
          this.keycloakService.send(
            { cmd: 'keycloak.users.update', service: 'keycloak' },
            { userId: id, data: kcData },
          ),
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to sync user update to Keycloak: ${error instanceof Error ? error.message : String(error)}`,
        UserService.name,
      );
    }

    return Result.ok({ id });
  }

  @TryCatch
  async ensureUserExists(data: {
    id: string;
    username?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
  }): Promise<Result<{ id: string; created: boolean }>> {
    this.logger.debug(
      { function: 'ensureUserExists', id: data.id },
      UserService.name,
    );

    const existingUser = await this.prismaSystem.tb_user.findUnique({
      where: { id: data.id },
    });

    if (existingUser) {
      return Result.ok({ id: existingUser.id, created: false });
    }

    const newUser = await this.prismaSystem.$transaction(async (prisma) => {
      const user = await prisma.tb_user.create({
        data: {
          id: data.id,
          username: data.username || data.email || data.id,
          email: data.email || null,
          platform_role: 'user',
          is_active: true,
        },
      });

      await prisma.tb_user_profile.create({
        data: {
          user_id: user.id,
          firstname: data.firstname || '',
          lastname: data.lastname || '',
          bio: {},
        },
      });

      return user;
    });

    this.logger.log(
      { function: 'ensureUserExists', message: `Auto-provisioned user ${newUser.id}` },
      UserService.name,
    );

    return Result.ok({ id: newUser.id, created: true });
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
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });

    return Result.ok(null);
  }

  @TryCatch
  async hardDeleteUser(id: string): Promise<Result<null>> {
    this.logger.debug({ function: 'hardDeleteUser', id }, UserService.name);

    const user = await this.prismaSystem.tb_user.findUnique({
      where: { id },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    // 1. Delete from Keycloak (user.id is the Keycloak user ID)
    try {
      await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.delete', service: 'keycloak' },
          { userId: id },
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete user from Keycloak (may not exist): ${error instanceof Error ? error.message : String(error)}`,
        UserService.name,
      );
      // Continue with DB deletion even if Keycloak fails
    }

    // 2. Delete related records
    await this.prismaSystem.tb_user_tb_business_unit.deleteMany({
      where: { user_id: id },
    });

    await this.prismaSystem.tb_cluster_user.deleteMany({
      where: { user_id: id },
    });

    await this.prismaSystem.tb_user_profile.deleteMany({
      where: { user_id: id },
    });

    // 3. Delete tb_user
    await this.prismaSystem.tb_user.delete({
      where: { id },
    });

    return Result.ok(null);
  }

  /**
   * Resolve a batch of user ids to display names. Used by the gateway's
   * audit-user enrichment. Returns only ids that exist (callers treat
   * absence as "unknown"). Includes soft-deleted users (no deleted_at filter).
   * On Prisma error, logs and returns { users: [] } so the gateway can
   * degrade gracefully ({ id, name: "Unknown" }) instead of producing an
   * unhandled rejection.
   *
   * @param ids - Array of tb_user.id values to resolve. Empty array short-circuits without a DB call.
   * @returns Object containing a `users` array of `{ id, name }` entries; ids not in tb_user are omitted.
   */
  async resolveByIds(ids: string[]): Promise<{ users: Array<{ id: string; name: string }> }> {
    this.logger.debug({ function: 'resolveByIds', count: ids.length }, UserService.name);

    if (ids.length === 0) {
      return { users: [] };
    }

    try {
      const rows = await this.prismaSystem.tb_user.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          username: true,
          email: true,
          alias_name: true,
          tb_user_profile_tb_user_profile_user_idTotb_user: {
            select: { firstname: true, middlename: true, lastname: true },
          },
        },
      });

      const users = rows.map((r) => ({
        id: r.id,
        name: formatUserName({
          username: r.username,
          email: r.email,
          alias_name: r.alias_name,
          profile: r.tb_user_profile_tb_user_profile_user_idTotb_user?.[0] ?? null,
        }),
      }));

      return { users };
    } catch (err) {
      this.logger.warn(
        { function: 'resolveByIds', err, count: ids.length },
        UserService.name,
      );
      return { users: [] };
    }
  }
}
