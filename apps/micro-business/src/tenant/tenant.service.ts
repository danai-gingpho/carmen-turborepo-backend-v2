import { HttpStatus, Inject, Injectable, Logger, HttpException } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { PrismaClient_TENANT, PrismaClient, enum_business_unit_config_key } from '@repo/prisma-shared-schema-tenant';

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
  ) { }

  /**
   * Get tenant connection info for the user's default business unit
   * ดึงข้อมูลการเชื่อมต่อผู้เช่าจากหน่วยธุรกิจเริ่มต้นของผู้ใช้
   * @param userId - User ID / ID ผู้ใช้
   * @returns Tenant connection details / รายละเอียดการเชื่อมต่อผู้เช่า
   */
  async getTenantInfo(userId: string): Promise<TenantConnection> {
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
          db_connection: this.getConnectionString(
            res.tb_business_unit.db_connection as unknown as databaseConfig,
          ),
        };
      });

    return tenant;
  }

  /**
   * Get the department of a user in a tenant
   * ดึงแผนกของผู้ใช้ในผู้เช่า
   * @param userId - User ID / ID ผู้ใช้
   * @param tenantId - Tenant ID / ID ผู้เช่า
   * @returns Department info with is_hod flag / ข้อมูลแผนกพร้อมสถานะหัวหน้าแผนก
   */
   
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

      const departmentUser = await prisma.tb_department_user.findFirst({
        where: {
          user_id: userId,
          deleted_at: null,
          OR: [{ is_hod: false }, { is_hod: null }],
        },
        select: {
          department_id: true,
        },
      });

      if (!departmentUser) {
        return null;
      }

      const department = await prisma.tb_department.findFirst({
        where: {
          id: departmentUser.department_id,
          deleted_at: null,
        },
        select: {
          name: true,
        },
      });

      return {
        id: departmentUser.department_id ?? null,
        name: department?.name ?? null,
      };

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

  /**
   * Get the HOD (Head of Department) department of a user
   * ดึงแผนกที่ผู้ใช้เป็นหัวหน้าแผนก
   * @param userId - User ID / ID ผู้ใช้
   * @param tenantId - Tenant ID / ID ผู้เช่า
   * @returns HOD department info or null / ข้อมูลแผนกที่เป็นหัวหน้าหรือ null
   */
   
  async getUserHodDepartment(userId: string, tenantId: string): Promise<any> {
    this.logger.debug(
      { function: 'getUserHodDepartment', userId, tenantId },
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
      const hodRecords = await prisma.tb_department_user.findMany({
        where: {
          user_id: userId,
          is_hod: true,
          deleted_at: null,
        },
        select: {
          user_id: true,
          department_id: true,
          is_hod: true,
        },
      });

      if (!hodRecords || hodRecords.length === 0) {
        return [];
      }

      const departments = await Promise.all(
        hodRecords.map(async (res) => {
          const department = await prisma.tb_department.findFirst({
            where: {
              id: res.department_id,
              deleted_at: null,
            },
            select: {
              name: true,
            },
          });

          return {
            id: res.department_id ?? null,
            name: department?.name ?? null,
          };
        }),
      );

      return departments.filter((d) => d.name !== null);
    } catch (error) {
      this.logger.error(
        { function: 'getUserHodDepartment', error },
        TenantService.name,
      );
      return [];
    }
  }

  /**
   * Get tenant/business unit by code
   * ดึงข้อมูลผู้เช่า/หน่วยธุรกิจตามรหัส
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Business unit data / ข้อมูลหน่วยธุรกิจ
   */
   
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

  /**
   * Get database connection by business unit code
   * ดึงการเชื่อมต่อฐานข้อมูลตามรหัสหน่วยธุรกิจ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenantId - Tenant/business unit code / รหัสผู้เช่า/หน่วยธุรกิจ
   * @returns Tenant connection details / รายละเอียดการเชื่อมต่อผู้เช่า
   */
  async getdbConnectionByCode(user_id: string, tenantId: string): Promise<TenantConnection> {
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
  /**
   * Get database connection by UUID or business unit code
   * ดึงการเชื่อมต่อฐานข้อมูลตาม UUID หรือรหัสหน่วยธุรกิจ
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenantId - Tenant ID (UUID) or business unit code / ID ผู้เช่า (UUID) หรือรหัสหน่วยธุรกิจ
   * @returns Tenant connection details / รายละเอียดการเชื่อมต่อผู้เช่า
   */
  async getdb_connection(user_id: string, tenantId: string): Promise<TenantConnection> {
    this.logger.debug(
      { function: 'getdb_connection', user_id, tenantId },
      TenantService.name,
    );

    // Detect if tenantId is a UUID or a bu_code and build the where clause accordingly
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);

    const tenant = await this.prismaSystem.tb_user_tb_business_unit
      .findFirst({
        where: {
          user_id: user_id,
          ...(isUUID
            ? { business_unit_id: tenantId }
            : { tb_business_unit: { code: tenantId } }),
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

        if (!res.tb_business_unit.db_connection) {
          throw new Error(`Business unit ${res.tb_business_unit.code} has no database connection configured`);
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

  /**
   * Build database connection string from config
   * สร้างสตริงการเชื่อมต่อฐานข้อมูลจากการตั้งค่า
   * @param db_connection - Database configuration / การตั้งค่าฐานข้อมูล
   * @returns Connection string / สตริงการเชื่อมต่อ
   */
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

  /**
   * Get a Prisma client instance for the tenant
   * ดึง Prisma client instance สำหรับผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Prisma client for the tenant / Prisma client สำหรับผู้เช่า
   */
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

  /**
   * Get database connection for external applications (no user validation)
   * ดึงการเชื่อมต่อฐานข้อมูลสำหรับแอปพลิเคชันภายนอก (ไม่ต้องตรวจสอบผู้ใช้)
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param application - Application name / ชื่อแอปพลิเคชัน
   * @returns Prisma client for the tenant / Prisma client สำหรับผู้เช่า
   */
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

  /**
   * Read a value from tb_business_unit.config (JSON array of {key, value})
   * อ่านค่าจาก config ของ business unit
   */
  async getBuConfig<T = unknown>(
    bu_id: string,
    key: enum_business_unit_config_key,
    default_value: T,
  ): Promise<T> {
    const bu = await this.prismaSystem.tb_business_unit.findFirst({
      where: { id: bu_id, deleted_at: null },
      select: { config: true },
    });

    if (!bu || !bu.config) {
      return default_value;
    }

    const configArr = bu.config as Array<{ key: string; value: unknown }>;
    if (!Array.isArray(configArr)) {
      return default_value;
    }

    const entry = configArr.find((c) => c.key === key);
    return entry === undefined ? default_value : (entry.value as T);
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

export interface TenantConnection {
  tenant_id: string;
  db_connection: string;
  bu_code?: string;
}
