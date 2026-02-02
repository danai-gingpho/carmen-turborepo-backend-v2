import {
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { enum_business_unit_config_key, PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  IBusinessUnitConfig,
  IBusinessUnitCreate,
  IBusinessUnitUpdate,
  IUserBusinessUnitCreate,
  IUserBusinessUnitUpdate,
} from './interface/business-unit.interface';
// import { IPaginate } from 'src/shared-interface/paginate.interface';
import QueryParams from 'src/libs/paginate.query';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { TenantService } from '@/tenant/tenant.service';
import { DefaultCurrencyObject as DefaultCurrencyObjectSchema, IDefaultCurrencyObject, IPaginate, Result, ErrorCode, TryCatch } from '@/common';

@Injectable()
export class BusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    BusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE')
    private readonly clusterService: ClientProxy,
    @Inject('KEYCLOAK_SERVICE')
    private readonly keycloakService: ClientProxy,
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
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
        config: data.config as any,
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
        config: data.config as any,
        is_hq: data.is_hq,
        is_active: data.is_active,
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
      },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_user_tb_business_unit.delete({
      where: {
        id: id,
      },
    });

    // await this.prismaSystem.tb_business_unit.update({
    //   where: { id },
    //   data: {
    //     is_active: false,
    //     updated_by_id: user_id,
    //     updated_at: new Date(),
    //   },
    // });

    return Result.ok(null);
  }

  @TryCatch
  async listBusinessUnit(paginate: IPaginate): Promise<Result<{ paginate: any; data: any[] }>> {
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
    });

    const total = await this.prismaSystem.tb_business_unit.count({
      where: q.where(),
    });

    return Result.ok({
      paginate: {
        total: total,
        page: paginate.page,
        perpage: paginate.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: businessUnits,
    });
  }

  @TryCatch
  async getBusinessUnitById(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'getBusinessUnitById', id: id },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        id,
      },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(businessUnit);
  }

  @TryCatch
  async getBusinessUnitByUserId(user_id: string): Promise<Result<any[]>> {
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
  async setDefaultTenant(user_id: string, tenant_id: string): Promise<Result<any[]>> {
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
            },
          },
        },
      })
      .then(async (res) => {

        const data = [];

        for (const item of res) { 
          const user_department = await this.tenantService.getUserDepartment(
            user_id,
            item.tb_business_unit.id,
          );

          const businessUnitConfig = await this.tenantService.getSystemBusinessUnitConfig(
            user_id,
            item.tb_business_unit.id,
          );

          data.push({
            id: item.tb_business_unit.id,
            name: item.tb_business_unit.name,
            code: item.tb_business_unit.code,
            alias_name: item.tb_business_unit.alias_name || '',
            is_default: item.is_default,
            department: user_department,
            config: businessUnitConfig.data,
          });

        }
        return data;
      });

    return Result.ok(updatedListRecords);
  }

  // User Business Unit

  @TryCatch
  async userBusinessUnitFindOne(id: string): Promise<Result<any>> {
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
  async userBusinessUnitFindAll(paginate: IPaginate): Promise<Result<{ paginate: any; data: any[] }>> {
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
    } catch (error: any) {
      this.logger.error(
        `Error calling Keycloak service: ${error.message}`,
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
    } catch (error: any) {
      this.logger.error(
        `Error calling Keycloak service: ${error.message}`,
        BusinessUnitService.name,
      );
    }

    return Result.ok(null);
  }

  // Business Unit Config

  @TryCatch
  async getBusinessUnitConfigs(
    bu_code: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigs',
        bu_code: bu_code,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    const businessUnitConfig = businessUnit?.config || [];

    return Result.ok(businessUnitConfig);
  }

  @TryCatch
  async putBusinessUnitConfigs(
    bu_code: string,
    data: IBusinessUnitConfig[],
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      {
        function: 'putBusinessUnitConfigs',
        bu_code: bu_code,
        data: data,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    const validationResults = data.map((item: IBusinessUnitConfig) => {
      const { error, message } = BusinessUnitService.validateValueByDataType(
        item.value,
        item.datatype,
      );
      if (error) {
        return message;
      }
      return null;
    });

    const errorResult = validationResults.find((result) => result !== null);
    if (errorResult) {
      return Result.error(errorResult, ErrorCode.VALIDATION_FAILURE);
    }

    await this.prismaSystem.tb_business_unit.update({
      where: { id: businessUnit.id },
      data: { config: data as any },
    });

    return Result.ok({ id: businessUnit.id });
  }

  @TryCatch
  async postBusinessUnitConfigs(
    bu_code: string,
    data: IBusinessUnitConfig[],
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      {
        function: 'postBusinessUnitConfigs',
        bu_code: bu_code,
        data: data,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    if (data.length > 0) {
      const validationResults = data.map((item: IBusinessUnitConfig) => {
        const { error, message } = BusinessUnitService.validateValueByDataType(
          item.value,
          item.datatype,
        );
        if (error) {
          return message;
        }
        return null;
      });

      const errorResult = validationResults.find((result) => result !== null);
      if (errorResult) {
        return Result.error(errorResult, ErrorCode.VALIDATION_FAILURE);
      }
    }

    await this.prismaSystem.tb_business_unit.update({
      where: { id: businessUnit.id },
      data: { config: data as any },
    });

    return Result.ok({ id: businessUnit.id });
  }

  @TryCatch
  async deleteBusinessUnitConfigByKey(
    bu_code: string,
    key: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      {
        function: 'deleteBusinessUnitConfigByKey',
        bu_code: bu_code,
        key: key,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    const updatedConfig = {
      ...(businessUnit.config as IBusinessUnitConfig[]),
    } as any;
    delete updatedConfig[key];

    await this.prismaSystem.tb_business_unit.update({
      where: { id: businessUnit.id },
      data: { config: updatedConfig },
    });

    return Result.ok({ id: businessUnit.id });
  }

  @TryCatch
  async getBusinessUnitConfigByKeyExists(
    bu_code: string,
    key: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<{ exists: boolean }>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigByKeyExists',
        bu_code: bu_code,
        key: key,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok({ exists: businessUnit.config[key] !== undefined });
  }

  @TryCatch
  async getBusinessUnitConfigByKey(
    bu_code: string,
    key: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<IBusinessUnitConfig | null>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigByKey',
        bu_code: bu_code,
        key: key,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    const configs = (businessUnit.config as IBusinessUnitConfig[]) ?? [];

    const config = configs.filter((item) => item.key === key)[0] ?? null;

    return Result.ok(config);
  }

  @TryCatch
  async patchBusinessUnitConfigs(
    bu_code: string,
    data: IBusinessUnitConfig,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<{ id: string }>> {
    this.logger.debug(
      {
        function: 'patchBusinessUnitConfigs',
        bu_code: bu_code,
        data: data,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );

    console.log(data);

    const { error, message } = BusinessUnitService.validateValueByDataType(
      data.value,
      data.datatype,
    );

    console.log(error, message);

    if (error) {
      return Result.error(message, ErrorCode.VALIDATION_FAILURE);
    }

    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit not found', ErrorCode.NOT_FOUND);
    }

    // get config
    const configs = (businessUnit.config as IBusinessUnitConfig[]) ?? [];

    const configIndex = configs.findIndex((item) => item.key === data.key);

    let new_id = uuidv4();

    if (configIndex === -1) {
      const obj: IBusinessUnitConfig = {
        ...data,
        id: new_id,
      }
      configs.push(obj);
    } else {

      new_id = configs[configIndex].id;

      configs[configIndex] = {
        ...configs[configIndex],
        ...data,
        id: new_id,
      } as IBusinessUnitConfig;
    }

    // update business unit config
    await this.prismaSystem.tb_business_unit.update({
      where: { id: businessUnit.id },
      data: {
        config: configs as any,
      },
    });

    return Result.ok({ id: new_id });
  }

  @TryCatch
  async getSystemBusinessUnitConfigs(
    bu_code: string,
    user_id: string,
    // tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getSystemBusinessUnitConfigs',
        bu_code: bu_code,
        user_id: user_id,
        // tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );

    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit config not found', ErrorCode.NOT_FOUND);
    }

    const configs : IBusinessUnitConfig[] = businessUnit.config as IBusinessUnitConfig[] ?? null  ;

    // for (const key in enum_business_unit_config_key) {
    //   const config = (businessUnit.config as IBusinessUnitConfig[])?.find((item) => item.key === key) ?? null;
    //   if (config) {
    //     // configs.push(config);
    //     configs[key] = config.value;
    //   }
    // }

    return Result.ok(configs);
  }

  @TryCatch
  async findCurrentTenantConfigByKey(
    bu_code: string,
    key: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<IBusinessUnitConfig>> {
    this.logger.debug(
      {
        function: 'findCurrentTenantConfigByKey',
        bu_code: bu_code,
        key: key,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
      BusinessUnitService.name,
    );
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return Result.error('Business unit config not found', ErrorCode.NOT_FOUND);
    }

    const configs = (businessUnit.config as IBusinessUnitConfig[]) ?? [];

    const config = configs.filter((item) => item.key === key)[0] ?? {};

    return Result.ok(config as IBusinessUnitConfig);
  }

  static validateValueByDataType(
    value: any,
    datatype: string,
  ): { error: boolean; message: string } {
    let error = false;
    let message = '';
    switch (datatype) {
      case 'string':
        if (typeof value !== 'string') {
          error = true;
          message = `Value must be a string for datatype 'string'`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          error = true;
          message = `Value must be a number for datatype 'number'`;
        }
        break;
      case 'boolean':
      case 'bool':
        if (typeof value !== 'boolean') {
          error = true;
          message = `Value must be a boolean for datatype 'boolean'`;
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          error = true;
          message = `Value must be an array for datatype 'array'`;
        }
        break;
      case 'object':
        if (
          typeof value !== 'object' ||
          value === null ||
          Array.isArray(value)
        ) {
          error = true;
          message = `Value must be an object for datatype 'object'`;
        }
        break;
      case 'date':
      case 'datetime':
        if (!BusinessUnitService.isValidDate(value)) {
          error = true;
          message = `Value must be a valid date string or Date object for datatype '${datatype}'`;
        }
        break;

      case 'default_currency': {
        console.log({ default_currency: value });
        const result = DefaultCurrencyObjectSchema.parse(value);
        if (!result) {
          error = true;
          message = `Value must be a valid default currency object for datatype 'default_currency' ${value}`;
        }
        break;
      }

      default:
        error = true;
        message = `Unsupported datatype: ${datatype}`;
        break;
    }

    return { error, message };
  }

  static isValidDate(value: any): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    return false;
  }
}
