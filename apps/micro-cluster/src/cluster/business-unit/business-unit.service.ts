import {
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  IBusinessUnitCreate,
  IBusinessUnitUpdate,
  IUserBusinessUnitCreate,
  IUserBusinessUnitUpdate,
} from './interface/business-unit.interface';
import QueryParams from 'src/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IPaginate, Result, ErrorCode, TryCatch } from '@/common';
import { BusinessUnitListItemResponseSchema } from './dto/business-unit.serializer';

@Injectable()
export class BusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    BusinessUnitService.name,
  );

  constructor(
    @Inject('KEYCLOAK_SERVICE')
    private readonly keycloakService: ClientProxy,
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) { }

  @TryCatch
  async createBusinessUnit(
    data: IBusinessUnitCreate,
    user_id: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'createBusinessUnit', data: data, user_id: user_id },
      BusinessUnitService.name,
    );
    const cluster = await this.prismaSystem.tb_cluster.findFirst({
      where: {
        id: data.cluster_id,
      },
    });

    if (!cluster) {
      return Result.error('Cluster not found', ErrorCode.NOT_FOUND);
    }

    if (cluster.max_license_bu != null) {
      const currentBuCount = await this.prismaSystem.tb_business_unit.count({
        where: {
          cluster_id: data.cluster_id,
          deleted_at: null,
        },
      });

      if (currentBuCount >= cluster.max_license_bu) {
        return Result.error(
          `Business unit limit reached. This cluster allows a maximum of ${cluster.max_license_bu} business units.`,
          ErrorCode.INVALID_ARGUMENT,
        );
      }
    }

    const findBusinessUnit = await this.prismaSystem.tb_business_unit.findFirst(
      {
        where: {
          cluster_id: data.cluster_id,
          code: data.code,
          name: data.name,
        },
      },
    );

    if (findBusinessUnit) {
      return Result.error('Business unit already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createBusinessUnit = await this.prismaSystem.tb_business_unit.create({
      data: {
        cluster_id: data.cluster_id,
        code: data.code,
        name: data.name,
        alias_name: data.alias_name,
        default_currency_id: data.default_currency_id,
        max_license_users: data.max_license_users ?? null,
        is_hq: data.is_hq,
        is_active: data.is_active,
        created_by_id: user_id,
      },
    });

    return Result.ok({ id: createBusinessUnit.id });
  }

  @TryCatch
  async updateBusinessUnit(
    data: IBusinessUnitUpdate,
    user_id: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'updateBusinessUnit', data: data, user_id: user_id },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    if (data.cluster_id) {
      const cluster = await this.prismaSystem.tb_cluster.findFirst({
        where: {
          id: data.cluster_id,
        },
      });

      if (!cluster) {
        return Result.error('Cluster not found', ErrorCode.NOT_FOUND);
      }
    }

    const findBusinessUnit = await this.prismaSystem.tb_business_unit.findFirst(
      {
        where: {
          cluster_id: data.cluster_id ?? businessUnit.cluster_id,
          code: data.code ?? businessUnit.code,
          name: data.name ?? businessUnit.name,
          id: {
            not: data.id,
          },
        },
      },
    );

    if (findBusinessUnit) {
      return Result.error('Business unit already exists', ErrorCode.ALREADY_EXISTS);
    }
    await this.prismaSystem.tb_business_unit.update({
      where: {
        id: data.id,
      },
      data: {
        cluster_id: data.cluster_id,
        code: data.code,
        name: data.name,
        alias_name: data.alias_name,
        description: data.description,
        default_currency_id: data.default_currency_id,
        max_license_users: data.max_license_users !== undefined ? data.max_license_users : undefined,
        is_hq: data.is_hq,
        is_active: data.is_active,
        db_connection: data.db_connection,
        config: data.config,
        calculation_method: data.calculation_method,
        // Company info
        branch_no: data.branch_no,
        company_name: data.company_name,
        company_address: data.company_address,
        company_email: data.company_email,
        company_tel: data.company_tel,
        company_zip_code: data.company_zip_code,
        tax_no: data.tax_no,
        // Hotel info
        hotel_name: data.hotel_name,
        hotel_address: data.hotel_address,
        hotel_email: data.hotel_email,
        hotel_tel: data.hotel_tel,
        hotel_zip_code: data.hotel_zip_code,
        // Format settings
        date_format: data.date_format,
        date_time_format: data.date_time_format,
        time_format: data.time_format,
        short_time_format: data.short_time_format,
        long_time_format: data.long_time_format,
        timezone: data.timezone,
        amount_format: data.amount_format,
        quantity_format: data.quantity_format,
        perpage_format: data.perpage_format,
        recipe_format: data.recipe_format,
        updated_by_id: user_id,
        updated_at: new Date(),
      },
    });

    return Result.ok({ id: data.id });
  }

  @TryCatch
  async deleteBusinessUnit(id: string, user_id: string): Promise<Result<null>> {
    this.logger.debug(
      { function: 'deleteBusinessUnit', id: id, user_id: user_id },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_business_unit.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok(null);
  }

  @TryCatch
  async listBusinessUnit(paginate: IPaginate): Promise<Result<{ paginate: unknown; data: unknown[] }>> {
    this.logger.debug(
      { function: 'listBusinessUnit', paginate: paginate },
      BusinessUnitService.name,
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

    const businessUnits = await this.prismaSystem.tb_business_unit.findMany({
      ...q.findMany(),
      include: {
        tb_cluster: { select: { name: true } },
        tb_user_tb_business_unit_created_by_idTotb_user: {
          select: { username: true, email: true },
        },
        tb_user_tb_business_unit_updated_by_idTotb_user: {
          select: { username: true, email: true },
        },
      },
    });

    const total = await this.prismaSystem.tb_business_unit.count({
      where: q.where(),
    });

    const serializedBusinessUnits = businessUnits.map((item) =>
      BusinessUnitListItemResponseSchema.parse(item),
    );

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedBusinessUnits,
    });
  }

  @TryCatch
  async getBusinessUnitById(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getBusinessUnitById', id: id },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        id,
      },
      include: {
        tb_cluster: { select: { name: true } },
        tb_user_tb_business_unit: {
          where: { is_active: true },
          select: {
            id: true,
            user_id: true,
            role: true,
            is_default: true,
            is_active: true,
            tb_user_tb_user_tb_business_unit_user_idTotb_user: {
              select: {
                username: true,
                email: true,
                platform_role: true,
                is_active: true,
                tb_user_profile_tb_user_profile_user_idTotb_user: {
                  select: {
                    firstname: true,
                    middlename: true,
                    lastname: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    // Flatten user data for frontend consumption
    const users = (businessUnit as any).tb_user_tb_business_unit?.map((item: any) => {
      const user = item.tb_user_tb_user_tb_business_unit_user_idTotb_user;
      const profile = user?.tb_user_profile_tb_user_profile_user_idTotb_user?.[0];
      return {
        id: item.id,
        user_id: item.user_id,
        role: item.role,
        is_default: item.is_default,
        is_active: item.is_active,
        username: user?.username ?? null,
        email: user?.email ?? null,
        platform_role: user?.platform_role ?? null,
        user_is_active: user?.is_active ?? null,
        firstname: profile?.firstname ?? null,
        middlename: profile?.middlename ?? null,
        lastname: profile?.lastname ?? null,
      };
    }) ?? [];

    const { tb_user_tb_business_unit, tb_cluster, ...rest } = businessUnit as any;

    return Result.ok({
      ...rest,
      cluster_name: tb_cluster?.name ?? null,
      users,
    });
  }

  @TryCatch
  async getBusinessUnitByUserId(user_id: string): Promise<Result<unknown[]>> {
    this.logger.debug(
      { function: 'getBusinessUnitByUserId', user_id: user_id },
      BusinessUnitService.name,
    );
    const businessUnits =
      await this.prismaSystem.tb_user_tb_business_unit.findMany({
        where: {
          user_id,
        },
        include: {
          tb_business_unit: true,
        },
      });

    return Result.ok(businessUnits);
  }

  @TryCatch
  async setDefaultTenant(user_id: string, tenant_id: string): Promise<Result<unknown[]>> {
    this.logger.debug(
      { function: 'setDefaultTenant', user_id: user_id, tenant_id: tenant_id },
      BusinessUnitService.name,
    );
    const user = await this.prismaSystem.tb_user.findFirst({
      where: { id: user_id },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    const findTenant = await this.prismaSystem.tb_business_unit.findFirst({
      where: { id: tenant_id },
    });

    if (!findTenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    // Update the default tenant
    await this.prismaSystem.tb_user_tb_business_unit.updateMany({
      where: {
        user_id: user_id,
        business_unit_id: tenant_id,
      },
      data: { is_default: true },
    });

    // Update the default tenant to false
    await this.prismaSystem.tb_user_tb_business_unit.updateMany({
      where: {
        user_id: user_id,
        business_unit_id: {
          not: tenant_id,
        },
      },
      data: {
        is_default: false,
      },
    });

    // Retrieve the updated records
    const updatedListRecords = await this.prismaSystem.tb_user_tb_business_unit
      .findMany({
        where: {
          user_id: user_id,
          is_active: true,
        },
        select: {
          is_default: true,
          tb_business_unit: {
            select: {
              id: true,
              name: true,
              code: true,
              alias_name: true,
              default_currency_id: true,
            },
          },
        },
      })
      .then(async (res) => {

        const data = [];

        for (const item of res) {
          data.push({
            id: item.tb_business_unit.id,
            name: item.tb_business_unit.name,
            code: item.tb_business_unit.code,
            alias_name: item.tb_business_unit.alias_name || '',
            is_default: item.is_default,
            department: null,
            default_currency_id: item.tb_business_unit.default_currency_id,
          });

        }
        return data;
      });

    return Result.ok(updatedListRecords);
  }

  // User Business Unit

  @TryCatch
  async userBusinessUnitFindOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'userBusinessUnitFindOne', id: id },
      BusinessUnitService.name,
    );
    const userBusinessUnit =
      await this.prismaSystem.tb_user_tb_business_unit.findFirst({
        where: {
          id,
        },
      });

    if (!userBusinessUnit) {
      return Result.error('User business unit not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(userBusinessUnit);
  }

  @TryCatch
  async userBusinessUnitFindAll(paginate: IPaginate): Promise<Result<{ paginate: unknown; data: unknown[] }>> {
    this.logger.debug(
      { function: 'userBusinessUnitFindAll', paginate: paginate },
      BusinessUnitService.name,
    );
    const defaultSearchFields = [];

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

    const userBusinessUnits =
      await this.prismaSystem.tb_user_tb_business_unit.findMany({
        ...q.findMany(),
      });

    const total = await this.prismaSystem.tb_user_tb_business_unit.count({
      where: q.where(),
    });

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: userBusinessUnits,
    });
  }

  @TryCatch
  async userBusinessUnitCreate(
    data: IUserBusinessUnitCreate,
    user_id: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'userBusinessUnitCreate', data: data, user_id: user_id },
      BusinessUnitService.name,
    );
    const user = await this.prismaSystem.tb_user.findFirst({
      where: {
        id: data.user_id,
      },
    });

    if (!user) {
      return Result.error('User not found', ErrorCode.NOT_FOUND);
    }

    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        id: data.business_unit_id,
      },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    const findUserBusinessUnit =
      await this.prismaSystem.tb_user_tb_business_unit.findFirst({
        where: {
          user_id: data.user_id,
          business_unit_id: data.business_unit_id,
        },
      });

    if (findUserBusinessUnit) {
      return Result.error('User business unit already exists', ErrorCode.ALREADY_EXISTS);
    }

    const createUserBusinessUnit =
      await this.prismaSystem.tb_user_tb_business_unit.create({
        data: {
          ...data,
          created_by_id: user_id,
        },
      });

    // Add BU to user in Keycloak
    try {
      const keycloakResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.manageBu', service: 'keycloak' },
          {
            userId: data.user_id,
            action: 'add',
            bu: {
              bu_id: businessUnit.id,
              bu_code: businessUnit.code,
              role: data.role || 'user',
            },
          },
        ),
      );

      if (!keycloakResponse.success) {
        this.logger.warn(
          `Failed to add BU to Keycloak for user ${data.user_id}: ${keycloakResponse.error}`,
          BusinessUnitService.name,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error calling Keycloak service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BusinessUnitService.name,
      );
    }

    return Result.ok({ id: createUserBusinessUnit.id });
  }

  @TryCatch
  async userBusinessUnitUpdate(
    data: IUserBusinessUnitUpdate,
    user_id: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      { function: 'userBusinessUnitUpdate', data: data, user_id: user_id },
      BusinessUnitService.name,
    );
    const userBusinessUnit =
      await this.prismaSystem.tb_user_tb_business_unit.findFirst({
        where: {
          id: data.id,
        },
      });

    if (!userBusinessUnit) {
      return Result.error('User business unit not found', ErrorCode.NOT_FOUND);
    }

    if (data.user_id) {
      const user = await this.prismaSystem.tb_user.findFirst({
        where: {
          id: data.user_id,
        },
      });

      if (!user) {
        return Result.error('User not found', ErrorCode.NOT_FOUND);
      }
    }

    if (data.business_unit_id) {
      const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
        where: {
          id: data.business_unit_id,
        },
      });

      if (!businessUnit) {
        return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
      }
    }

    const findUserBusinessUnit =
      await this.prismaSystem.tb_user_tb_business_unit.findFirst({
        where: {
          user_id: data.user_id ?? userBusinessUnit.user_id,
          business_unit_id:
            data.business_unit_id ?? userBusinessUnit.business_unit_id,
          id: {
            not: data.id,
          },
        },
      });

    if (findUserBusinessUnit) {
      return Result.error('User business unit already exists', ErrorCode.ALREADY_EXISTS);
    }

    await this.prismaSystem.tb_user_tb_business_unit.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: user_id,
        updated_at: new Date(),
      },
    });

    return Result.ok({ id: data.id });
  }

  @TryCatch
  async userBusinessUnitDelete(id: string, user_id: string): Promise<Result<null>> {
    this.logger.debug(
      { function: 'userBusinessUnitDelete', id: id, user_id: user_id },
      BusinessUnitService.name,
    );
    const userBusinessUnit =
      await this.prismaSystem.tb_user_tb_business_unit.findFirst({
        where: {
          id,
        },
        include: {
          tb_business_unit: true,
        },
      });

    if (!userBusinessUnit) {
      return Result.error('User business unit not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_user_tb_business_unit.delete({
      where: {
        id: id,
      },
    });

    // Remove BU from user in Keycloak
    try {
      const keycloakResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.manageBu', service: 'keycloak' },
          {
            userId: userBusinessUnit.user_id,
            action: 'remove',
            bu: {
              bu_id: userBusinessUnit.business_unit_id,
            },
          },
        ),
      );

      if (!keycloakResponse.success) {
        this.logger.warn(
          `Failed to remove BU from Keycloak for user ${userBusinessUnit.user_id}: ${keycloakResponse.error}`,
          BusinessUnitService.name,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `Error calling Keycloak service: ${error instanceof Error ? error.message : 'Unknown error'}`,
        BusinessUnitService.name,
      );
    }

    return Result.ok(null);
  }

}
