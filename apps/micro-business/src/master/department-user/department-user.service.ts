import { BackendLogger } from '@/common/helpers/backend.logger';
import { TenantService } from '@/tenant/tenant.service';
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class DepartmentUserService {
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
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentUserService.name,
  );
  /**
   * Initialize the Prisma service for the tenant
   * เริ่มต้นบริการ Prisma สำหรับผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / รหัสผู้ใช้
   */
  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
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

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Find all users in a department
   * ค้นหาผู้ใช้ทั้งหมดในแผนก
   * @param department_id - Department ID / รหัสแผนก
   * @returns List of user IDs in the department / รายการรหัสผู้ใช้ในแผนก
   */
  @TryCatch
  async findAllUserInDepartment(
    department_id: string,
  ): Promise<Result<unknown>> {
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const res = await this.prismaService.tb_department_user.findMany({
      where: { department_id },
      select: { user_id: true }
    })

    return Result.ok(res);
  }

  /**
   * Check if a department has a Head of Department (HOD)
   * ตรวจสอบว่าแผนกมีหัวหน้าแผนก (HOD) หรือไม่
   * @param department_id - Department ID / รหัสแผนก
   * @returns Whether a HOD exists in the department / มีหัวหน้าแผนกในแผนกหรือไม่
   */
  @TryCatch
  async hasHodInDepartment(
    department_id: string,
  ): Promise<Result<boolean>> {
    const hodUser = await this.prismaService.tb_department_user.findFirst({
      where: {
        department_id,
        is_hod: true,
        deleted_at: null,
      },
      select: { id: true }
    });

    return Result.ok(!!hodUser);
  }

  /**
   * Get all HOD user IDs in a department
   * ดึงรหัสผู้ใช้ของหัวหน้าแผนกทั้งหมดในแผนก
   * @param department_id - Department ID / รหัสแผนก
   * @returns List of HOD user IDs / รายการรหัสผู้ใช้หัวหน้าแผนก
   */
  @TryCatch
  async getHodInDepartment(
    department_id: string,
  ): Promise<Result<string[]>> {
    const hodUsers = await this.prismaService.tb_department_user.findMany({
      where: {
        department_id,
        is_hod: true,
        deleted_at: null,
      },
      select: { user_id: true }
    });

    return Result.ok(hodUsers.map(h => h.user_id));
  }

  /**
   * Find a user's member department and HOD departments
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกทั้งหมดที่ user เป็น HOD
   * @param target_user_id - User ID to look up / รหัสผู้ใช้ที่ต้องการค้นหา
   * @returns Member department (single, nullable) and HOD departments (array)
   */
  @TryCatch
  async findByUserId(
    target_user_id: string,
  ): Promise<Result<{
    department: { id: string; code: string; name: string } | null;
    hod_departments: Array<{ id: string; code: string; name: string }>;
  }>> {
    const memberRecord = await this.prismaService.tb_department_user.findFirst({
      where: {
        user_id: target_user_id,
        OR: [{ is_hod: false }, { is_hod: null }],
        deleted_at: null,
      },
      select: { tb_department: { select: { id: true, code: true, name: true } } },
    });

    const hodRecords = await this.prismaService.tb_department_user.findMany({
      where: { user_id: target_user_id, is_hod: true, deleted_at: null },
      select: { tb_department: { select: { id: true, code: true, name: true } } },
    });

    return Result.ok({
      department: memberRecord?.tb_department ?? null,
      hod_departments: hodRecords.map((r) => r.tb_department),
    });
  }
}
