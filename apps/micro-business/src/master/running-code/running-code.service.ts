import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import {
  ICreateRunningCode,
  IUpdateRunningCode,
} from './interface/running-code.interface';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/common/libs/paginate.query';
import { GenerateCode, getPattern } from '@/common/helpers/running-code.helper';
import { ICommonResponse } from '@/common/interface/common.interface';
import { PatternMapper } from '@/common/common.interface';
import { RUNNING_CODE_PRESET } from './const/running-code.const';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient, Prisma } from '@repo/prisma-shared-schema-tenant';

@Injectable()
export class RunningCodeService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(
      ERROR_MISSING_BU_CODE,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(
      ERROR_MISSING_USER_ID,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;

  /**
   * Initialize the Prisma service for the tenant
   * เริ่มต้นบริการ Prisma สำหรับผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / รหัสผู้ใช้
   */
  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    try {
      this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      throw new HttpException(
        `Failed to initialize Prisma for running-code (bu_code: ${bu_code}, userId: ${userId}): ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException(
        'Prisma service is not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  private readonly logger: BackendLogger = new BackendLogger(
    RunningCodeService.name,
  );

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Find a single running code configuration by ID
   * ค้นหาการตั้งค่ารหัสลำดับรายการเดียวตาม ID
   * @param id - Running code ID / รหัสการตั้งค่ารหัสลำดับ
   * @returns Running code detail / รายละเอียดรหัสลำดับ
   */
  async findOne(id: string): Promise<any> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );

    const runningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: { id },
    });

    if (!runningCode) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Running code not found',
        },
      };
    }

    return {
      data: runningCode,
      response: {
        status: HttpStatus.OK,
        message: 'Running code retrieved successfully',
      },
    };
  }

  /**
   * Find all running code configurations with pagination
   * ค้นหาการตั้งค่ารหัสลำดับทั้งหมดแบบแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of running codes / รายการรหัสลำดับแบบแบ่งหน้า
   */
  async findAll(
    paginate: IPaginate,
  ): Promise<any> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      RunningCodeService.name,
    );
    const defaultSearchFields = ['type'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);
    const runningCodes = await this.prismaService.tb_config_running_code.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_config_running_code.count({ where: q.where() });

    return {
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: runningCodes,
      response: {
        status: HttpStatus.OK,
        message: 'Running codes retrieved successfully',
      },
    };
  }

  /**
   * Find a running code configuration by type
   * ค้นหาการตั้งค่ารหัสลำดับตามประเภท
   * @param type - Running code type / ประเภทรหัสลำดับ
   * @returns Running code configuration / การตั้งค่ารหัสลำดับ
   */
  async findByType(
    type: string,
  ): Promise<any> {
    this.logger.debug(
      { function: 'findByType', type, user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );

    const runningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: { type },
    });

    return {
      data: runningCode,
      response: {
        status: HttpStatus.OK,
        message: 'Running code retrieved successfully',
      },
    };
  }

  /**
   * Create a new running code configuration
   * สร้างการตั้งค่ารหัสลำดับใหม่
   * @param data - Running code creation data / ข้อมูลสำหรับสร้างรหัสลำดับ
   * @returns Created running code ID / รหัสการตั้งค่ารหัสลำดับที่สร้างแล้ว
   */
  async create(data: ICreateRunningCode) {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );

    const foundRunningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: {
        type: data.type,
      },
    });

    if (foundRunningCode) {
      return {
        response: {
          status: HttpStatus.CONFLICT,
          message: 'Running code already exists',
        },
      };
    }

    const createRunningCode = await this.prismaService.tb_config_running_code.create({
      data: {
        ...data,
        config: data.config as Prisma.InputJsonValue,
        created_by_id: this.userId,
      },
    });

    return {
      data: { id: createRunningCode.id },
      response: {
        status: HttpStatus.CREATED,
        message: 'Running code created successfully',
      },
    };
  }

  /**
   * Initialize all default running code configurations
   * สร้างการตั้งค่ารหัสลำดับเริ่มต้นทั้งหมดสำหรับประเภทเอกสาร (PL, PR, SI, SO, PO, GRN, CN)
   * @returns List of initialized running codes / รายการรหัสลำดับที่สร้างขึ้น
   */
  async init(): Promise<any> {
    this.logger.debug(
      { function: 'init', user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );

    const defaultTypes = ['PL', 'PR', 'SI', 'SO', 'PO', 'GRN', 'CN'];
    const results: { type: string; id: string; status: 'created' | 'exists' }[] = [];

    for (const type of defaultTypes) {
      const existing = await this.prismaService.tb_config_running_code.findFirst({
        where: { type },
      });

      if (existing) {
        results.push({ type, id: existing.id, status: 'exists' });
        continue;
      }

      const created = await this.prismaService.tb_config_running_code.create({
        data: {
          type,
          config: RUNNING_CODE_PRESET[type].config as Prisma.InputJsonValue,
          note: 'initialized by system default.',
          created_by_id: this.userId,
        },
      });

      results.push({ type, id: created.id, status: 'created' });
    }

    return {
      data: results,
      response: {
        status: HttpStatus.CREATED,
        message: 'Running codes initialized successfully',
      },
    };
  }

  /**
   * Find a running code by type, or create with system defaults if not found
   * ค้นหารหัสลำดับตามประเภท หรือสร้างด้วยค่าเริ่มต้นของระบบหากไม่พบ
   * @param type - Running code type / ประเภทรหัสลำดับ
   * @returns Running code configuration / การตั้งค่ารหัสลำดับ
   */
  async findOneOrCreate(
    type: string,
  ): Promise<ICommonResponse<IUpdateRunningCode>> {
    this.logger.debug(
      { function: 'findOneOrCreate', type, user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );

    // Remark UPSERT is not working now because type is not unique so it can affect more record
    let foundRunningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: {
        type,
      },
    });

    if (!foundRunningCode) {
      if (!RUNNING_CODE_PRESET[type]) {
        throw new HttpException(
          `No running code preset found for type '${type}'. Available types: ${Object.keys(RUNNING_CODE_PRESET).join(', ')}`,
          HttpStatus.NOT_FOUND,
        );
      }
      foundRunningCode = await this.prismaService.tb_config_running_code.create({
        data: {
          type,
          config: RUNNING_CODE_PRESET[type].config,
          note: 'initialized by system default.',
        },
      });
    }

    return {
      data: foundRunningCode as IUpdateRunningCode,
      response: {
        status: HttpStatus.OK,
        message: 'Running code retrieved successfully',
      },
    };
  }

  /**
   * Update an existing running code configuration
   * อัปเดตการตั้งค่ารหัสลำดับที่มีอยู่
   * @param data - Running code update data / ข้อมูลสำหรับอัปเดตรหัสลำดับ
   * @returns Updated running code ID / รหัสการตั้งค่ารหัสลำดับที่อัปเดตแล้ว
   */
  async update(
    data: IUpdateRunningCode,
  ): Promise<any> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );

    const runningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: { id: data.id },
    });

    if (!runningCode) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Running code not found',
        },
      };
    }

    const updateRunningCode = await this.prismaService.tb_config_running_code.update({
      where: { id: data.id },
      data: {
        ...data,
        config: data.config as Prisma.InputJsonValue,
        updated_by_id: this.userId,
      },
    });

    return {
      data: { id: updateRunningCode.id },
      response: {
        status: HttpStatus.OK,
        message: 'Running code updated successfully',
      },
    };
  }

  /**
   * Soft delete a running code configuration
   * ลบการตั้งค่ารหัสลำดับแบบ soft delete
   * @param id - Running code ID / รหัสการตั้งค่ารหัสลำดับ
   * @returns Success message / ข้อความสำเร็จ
   */
  async delete(id: string): Promise<any> {
    this.logger.debug({ function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code }, RunningCodeService.name);

    const runningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: { id },
    });

    if (!runningCode) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Running code not found',
        },
      };
    }

    await this.prismaService.tb_config_running_code.update({
      where: { id }, data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return {
      response: {
        status: HttpStatus.OK,
        message: 'Running code deleted successfully',
      },
    };
  }

  /**
   * Get the running code pattern by type (creates default if not found)
   * ดึงรูปแบบรหัสลำดับตามประเภท (สร้างค่าเริ่มต้นหากไม่พบ)
   * @param type - Running code type / ประเภทรหัสลำดับ
   * @returns Running code pattern / รูปแบบรหัสลำดับ
   */
  async getRunningPatternByType(
    type: string,
  ): Promise<any> {
    this.logger.debug(
      { function: 'getRunningPatternByType', type, user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );
    const runningCode = await this.findOneOrCreate(type);
    const pattern = getPattern(runningCode.data.config as any);

    return {
      data: pattern,
      response: {
        status: HttpStatus.OK,
        message: 'Running code retrieved successfully',
      },
    };
  }

  /**
   * Generate a new running code based on type, date, and last number
   * สร้างรหัสลำดับใหม่ตามประเภท วันที่ และหมายเลขล่าสุด
   * @param type - Running code type / ประเภทรหัสลำดับ
   * @param date - Date for code generation / วันที่สำหรับสร้างรหัส
   * @param last_no - Last used number / หมายเลขล่าสุดที่ใช้
   * @returns Generated code / รหัสที่สร้างขึ้น
   */
  async generateCode(
    type: string,
    date: Date,
    last_no: number,
  ): Promise<any> {
    this.logger.debug(
      { function: 'generateCode', type, date, last_no, user_id: this.userId, tenant_id: this.bu_code },
      RunningCodeService.name,
    );

    const runningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: { type: { contains: type, mode: 'insensitive' } },
    });

    if (!runningCode || !runningCode.config) {
      throw new HttpException(
        `Running code configuration not found for type: ${type}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const newCode = GenerateCode(runningCode.config, date, last_no);

    return {
      data: {
        code: newCode,
      },
      response: {
        status: HttpStatus.OK,
        message: 'Running code generated successfully',
      },
    };
  }
}
