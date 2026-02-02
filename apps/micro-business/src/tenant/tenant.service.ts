import { HttpStatus, Inject, Injectable, Logger, HttpException } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { concat, firstValueFrom, Observable } from 'rxjs';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { PrismaClient_TENANT, PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TenantService {
  private readonly logger: BackendLogger = new BackendLogger(
    TenantService.name,
  );
  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) { }

  async getTenantInfo(userId: string): Promise<any> {
    this.logger.debug({ function: 'getTenantInfo', userId }, TenantService.name);
    const tenant = await this.prismaSystem.tb_user_tb_business_unit
      .findFirst({
        where: {
          user_id: userId,
          is_default: true,
        },
        select: {
          tb_business_unit: {
            select: {
              id: true,
              db_connection: true,
            },
          },
        },
      })
      .then(async (res) => {
        return {
          tenant_id: res.tb_business_unit.id,
          db_connection: res.tb_business_unit.db_connection,
        };
      });

    return tenant;
  }

  async getUserDepartment(userId: string, tenantId: string): Promise<any> {
    this.logger.debug(
      { function: 'getUserDepartment', userId, tenantId },
      TenantService.name,
    );

    const tenant = await this.getdb_connection(userId, tenantId);

    if (!tenant) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Tenant not found',
        },
      };
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    try {

      const departments = await prisma.tb_department_user.findFirst({
        where: {
          user_id: userId,
        },
        select: {
          user_id: true,
          department_id: true,
          is_hod: true,
        },
      }).then(async (res) => {

        const department = await prisma.tb_department.findFirst({
          where: {
            id: res.department_id,
          },
          select: {
            name: true,
          },
        });

        return {
          // user_id: userId,
          // tenant_id: tenantId,
          is_hod: res.is_hod ?? false,
          id: res.department_id ?? null,
          name: department.name ?? null,
        };
      });

      return departments;

    } catch (error) {
      this.logger.error(
        { function: 'getUserDepartment', error },
        TenantService.name,
      );
      // return {
      //   response: {
      //     status: HttpStatus.INTERNAL_SERVER_ERROR,
      //     message: 'Internal server error',
      //   },
      // };
      return null;
    }
  }

  async getTenantByCode(bu_code: string, user_id: string): Promise<any> {
    this.logger.debug(
      { function: 'getTenantByCode', bu_code },
      TenantService.name,
    );

    const tenant = await this.prismaSystem.tb_business_unit
      .findFirst({
        where: {
          code: bu_code,
          tb_user_tb_business_unit: {
            some: { user_id: user_id },
          },
        },
      })

    return tenant;
  }

  async getSystemBusinessUnitConfig(userId: string, tenantId: string): Promise<any> {
    this.logger.debug(
      { function: 'getSystemBusinessUnitConfig', userId, tenantId },
      TenantService.name,
    );

    const tenant = await this.getdb_connection(userId, tenantId);

    if (!tenant) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Tenant not found',
        },
      };
    }

    const res: Observable<any> = this.clusterService.send(
      {
        cmd: 'business-unit.get-system-configs',
        service: 'business-unit',
      },
      { user_id: userId, bu_code: tenant.bu_code, version: 'latest' },
    );

    const response = await firstValueFrom(res);

    this.logger.debug(
      { function: 'getSystemBusinessUnitConfig', response },
      TenantService.name,
    );

    return {
      data: response.data
    };
  }

  async getdbConnectionByCode(user_id: string, tenantId: string): Promise<any> {
    this.logger.debug(
      { function: 'getdb_connection', user_id, tenantId },
      TenantService.name,
    );

    const tenant = await this.prismaSystem.tb_user_tb_business_unit
      .findFirst({
        where: {
          user_id: user_id,
          tb_business_unit: { code: tenantId },
        },
        select: {
          tb_business_unit: {
            select: {
              id: true,
              db_connection: true,
            },
          },
        },
      })
      .then((res) => {
        if (!res || !res.tb_business_unit) {
          throw new Error('Business unit not found');
        }

        const result = {
          tenant_id: res.tb_business_unit.id,
          db_connection: this.getConnectionString(
            res.tb_business_unit.db_connection as unknown as databaseConfig,
          ),
        };

        this.logger.debug(
          { getdb_connection_master: result },
          TenantService.name,
        );

        return result;
      });

    return tenant;
  }
  async getdb_connection(user_id: string, tenantId: string): Promise<any> {
    this.logger.debug(
      { function: 'getdb_connection', user_id, tenantId },
      TenantService.name,
    );

    const tenant = await this.prismaSystem.tb_user_tb_business_unit
      .findFirst({
        where: {
          user_id: user_id,
          business_unit_id: tenantId,
        },
        select: {
          tb_business_unit: {
            select: {
              id: true,
              db_connection: true,
              code: true,
            },
          },
        },
      })
      .then((res) => {
        if (!res || !res.tb_business_unit) {
          throw new Error('Business unit not found');
        }

        const result = {
          tenant_id: res.tb_business_unit.id,
          db_connection: this.getConnectionString(
            res.tb_business_unit.db_connection as unknown as databaseConfig,
          ),
          bu_code: res.tb_business_unit.code,
        };

        this.logger.debug(
          { function: 'getdb_connection', result },
          TenantService.name,
        );

        return result;
      });

    return tenant;
  }

  getConnectionString(db_connection: databaseConfig): string {

    switch (db_connection.provider) {
      case 'postgresql':
        return `postgres://${db_connection.username}:${db_connection.password}@${db_connection.host}:${db_connection.port}/${db_connection.database}?schema=${db_connection.schema}`;
      case 'mysql':
        return `mysql://${db_connection.username}:${db_connection.password}@${db_connection.host}:${db_connection.port}/${db_connection.database}`;
      case 'mssql':
        return `mssql://${db_connection.username}:${db_connection.password}@${db_connection.host}:${db_connection.port}/${db_connection.database}`;
      case 'sqlite':
        return `sqlite://${db_connection.host}/${db_connection.database}`;
    }
  }

  async prismaTenantInstance(
    bu_code: string,
    user_id: string,
  ): Promise<PrismaClient> {
    try {
      const tenant = await this.getdbConnectionByCode(user_id, bu_code);

      if (!tenant) {
        throw new HttpException('Tenant not found', HttpStatus.NO_CONTENT);
      }

      const prisma = await this.prismaTenant(
        tenant.tenant_id,
        tenant.db_connection,
      );

      if (!prisma) {
        throw new Error('Prisma client is not initialized');
      }

      return prisma;
    } catch (error) {
      this.logger.error(
        { function: 'prismaTenantInstance', error },
        TenantService.name,
      );
      throw error;
    }
  }

  async getdb_connection_for_external(bu_code: string, application: string): Promise<PrismaClient> {
    this.logger.debug(
      { function: `getdb_connection_for_external bu_code: ${bu_code} application: ${application}` },
      TenantService.name,
    );

    const tenant = await this.prismaSystem.tb_business_unit
      .findFirst({
        where: {
          code: bu_code,
        },
        select: {
          id: true,
          db_connection: true,
        },
      })
      .then((res) => {
        if (!res) {
          throw new Error('Business unit not found');
        }

        const result = {
          tenant_id: res.id,
          db_connection: this.getConnectionString(
            res.db_connection as unknown as databaseConfig,
          ),
        };

        this.logger.debug(
          { getdb_connection_for_external: result },
          TenantService.name,
        );

        return result;
      });

    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NO_CONTENT);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    if (!prisma) {
      throw new Error('Prisma client is not initialized');
    }

    return prisma;
  }
}

interface databaseConfig {
  provider: 'postgresql' | 'mysql' | 'mssql' | 'sqlite';
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
  schema: string;
}
