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

  @TryCatch
  async findAllUserInDepartment(
    department_id: string,
  ): Promise<Result<any>> {
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const res = await this.prismaService.tb_department_user.findMany({
      where: { department_id },
      select: { user_id: true }
    })

    return Result.ok(res);
  }

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
}
