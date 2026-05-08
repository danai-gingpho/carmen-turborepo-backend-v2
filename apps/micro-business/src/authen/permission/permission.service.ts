import { Injectable } from '@nestjs/common';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
// import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  IPermissionCreate,
  IPermissionUpdate,
} from './interface/permission.interface';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class PermissionService {
  private readonly logger: BackendLogger = new BackendLogger(
    PermissionService.name,
  );

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
  ) { }

  /**
   * Find a permission by ID
   * ค้นหาสิทธิ์รายการเดียวตาม ID
   * @param id - Permission ID / ID สิทธิ์
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Permission detail / รายละเอียดสิทธิ์
   */
  @TryCatch
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id: id, user_id, tenant_id },
      PermissionService.name,
    );

    const permission = await this.prismaSystem.tb_permission.findFirst({
      where: { id },
    });

    if (!permission) {
      return Result.error('Permission not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(permission);
  }

  /**
   * Find all permissions with pagination
   * ค้นหาสิทธิ์ทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of permissions / รายการสิทธิ์แบบแบ่งหน้า
   */
  @TryCatch
  async findAll(user_id: string, tenant_id: string, paginate: any): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', paginate: paginate, user_id, tenant_id },
      PermissionService.name,
    );

    const p = paginate || {};
    const defaultSearchFields = ['resource', 'action', 'description'];

    const q = new QueryParams(
      p.page ?? 1,
      p.perpage ?? 100,
      p.search ?? '',
      p.searchFields ?? [],
      defaultSearchFields,
      p.filter ?? {},
      p.sort ?? [],
      p.advance ?? null,
    );

    const permissions = await this.prismaSystem.tb_permission.findMany({
      ...q.findMany(),
      select: {
        id: true,
        resource: true,
        action: true,
        description: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
        deleted_at: true,
        deleted_by_id: true,
      },
    });

    const total = await this.prismaSystem.tb_permission.count({
      where: { ...q.where() },
    });

    return Result.ok({
      paginate: {
        total: total,
        page: q.page,
        perpage: q.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: permissions,
    });
  }

  /**
   * Create a new permission
   * สร้างสิทธิ์ใหม่
   * @param data - Permission creation data / ข้อมูลสร้างสิทธิ์
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created permission ID / ID สิทธิ์ที่สร้างแล้ว
   */
  @TryCatch
  async create(data: IPermissionCreate, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data: data, user_id, tenant_id },
      PermissionService.name,
    );

    // find by resource and action (compound unique)
    const existingPermission = await this.prismaSystem.tb_permission.findFirst(
      {
        where: {
          resource: data.resource,
          action: data.action,
        },
      },
    );

    if (existingPermission) {
      return Result.error('Permission with this resource and action already exists', ErrorCode.ALREADY_EXISTS);
    }

    const newPermission = await this.prismaSystem.tb_permission.create({
      data: {
        resource: data.resource,
        action: data.action,
        description: data.description,
        created_at: new Date(),
      },
    });

    return Result.ok({ id: newPermission.id });
  }

  /**
   * Update a permission
   * แก้ไขสิทธิ์
   * @param data - Permission update data / ข้อมูลแก้ไขสิทธิ์
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated permission ID / ID สิทธิ์ที่แก้ไขแล้ว
   */
  @TryCatch
  async update(data: IPermissionUpdate, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data: data, user_id, tenant_id },
      PermissionService.name,
    );

    const permission = await this.prismaSystem.tb_permission.findFirst({
      where: { id: data.id },
    });

    if (!permission) {
      return Result.error('Permission not found', ErrorCode.NOT_FOUND);
    }

    const updatedPermission = await this.prismaSystem.tb_permission.update({
      where: { id: data.id },
      data: {
        resource: data.resource,
        action: data.action,
        description: data.description,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updatedPermission.id });
  }

  /**
   * Delete a permission
   * ลบสิทธิ์
   * @param id - Permission ID / ID สิทธิ์
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted permission ID / ID สิทธิ์ที่ลบแล้ว
   */
  @TryCatch
  async remove(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'remove', id: id, user_id, tenant_id },
      PermissionService.name,
    );

    const permission = await this.prismaSystem.tb_permission.findFirst({
      where: { id },
    });

    if (!permission) {
      return Result.error('Permission not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaSystem.tb_permission.delete({
      where: { id },
    });

    return Result.ok({ id });
  }
}
