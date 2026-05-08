import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { TryCatch, Result, ErrorCode } from '@/common';

export interface IPaginate {
  page?: number;
  perpage?: number;
  search?: string;
  sort?: string[];
  filter?: Record<string, string>;
}

export interface IActivityLogFilter {
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  action?: string;
  start_date?: Date;
  end_date?: Date;
}

@Injectable()
export class ActivityLogService {
  private readonly logger: BackendLogger = new BackendLogger(
    ActivityLogService.name,
  );
  private _prismaService: PrismaClient | undefined;
  public userId: string;
  public bu_code: string;

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Initialize Prisma service for the tenant
   * เริ่มต้น Prisma service สำหรับผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
   */
  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(
      bu_code,
      userId,
    );
  }

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException(
        'Prisma service not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  /**
   * Parse sort parameter from gateway format to Prisma orderBy.
   * Supports "-field" (desc) and "field:asc" formats.
   */
  private parseSortParam(
    sort?: string[],
  ): Record<string, 'asc' | 'desc'> {
    if (!sort || sort.length === 0) {
      return { created_at: 'desc' };
    }
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    for (const item of sort) {
      if (item.startsWith('-')) {
        orderBy[item.slice(1)] = 'desc';
      } else if (item.includes(':')) {
        const [field, dir] = item.split(':');
        orderBy[field] = dir === 'desc' ? 'desc' : 'asc';
      } else {
        orderBy[item] = 'asc';
      }
    }
    return Object.keys(orderBy).length > 0 ? orderBy : { created_at: 'desc' };
  }

  /**
   * Find all activity logs with pagination and filters
   * ค้นหาบันทึกกิจกรรมทั้งหมดพร้อมการแบ่งหน้าและตัวกรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param filters - Optional activity log filters / ตัวกรองบันทึกกิจกรรม (ไม่บังคับ)
   * @returns Paginated list of activity logs / รายการบันทึกกิจกรรมแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    paginate: IPaginate,
    filters?: IActivityLogFilter,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', paginate, filters },
      ActivityLogService.name,
    );

    const page = paginate?.page || 1;
    const limit = paginate?.perpage || 20;
    const skip = (page - 1) * limit;

     
    const where: Record<string, any> = {
      deleted_at: null,
    };

    if (filters?.entity_type) {
      where.entity_type = filters.entity_type;
    }
    if (filters?.entity_id) {
      where.entity_id = filters.entity_id;
    }
    if (filters?.actor_id) {
      where.actor_id = filters.actor_id;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.start_date || filters?.end_date) {
      where.created_at = {};
      if (filters?.start_date) {
        where.created_at.gte = new Date(filters.start_date);
      }
      if (filters?.end_date) {
        where.created_at.lte = new Date(filters.end_date);
      }
    }

    if (paginate?.search) {
      where.OR = [
        { entity_type: { contains: paginate.search, mode: 'insensitive' } },
        { description: { contains: paginate.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.parseSortParam(paginate?.sort);

    const [data, total] = await Promise.all([
      this.prismaService.tb_activity.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prismaService.tb_activity.count({ where }),
    ]);

    const mappedData = await this.mapActorInfo(data);

    return Result.ok({
      paginate: {
        total,
        page,
        perpage: limit,
        pages: total === 0 ? 1 : Math.ceil(total / limit),
      },
      data: mappedData,
    });
  }

  /**
   * Find activity logs by entity type with pagination
   * ค้นหาบันทึกกิจกรรมตามประเภทเอนทิตีพร้อมการแบ่งหน้า
   * @param entityType - Entity type to filter by / ประเภทเอนทิตีที่จะกรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of activity logs / รายการบันทึกกิจกรรมแบบแบ่งหน้า
   */
  @TryCatch
  async findByEntity(
    entityType: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findByEntity', entityType, paginate },
      ActivityLogService.name,
    );

    const page = paginate?.page || 1;
    const limit = paginate?.perpage || 20;
    const skip = (page - 1) * limit;

     
    const where: Record<string, any> = {
      deleted_at: null,
      entity_type: { contains: entityType, mode: 'insensitive' },
    };

    if (paginate?.search) {
      where.OR = [
        { description: { contains: paginate.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.parseSortParam(paginate?.sort);

    const [data, total] = await Promise.all([
      this.prismaService.tb_activity.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prismaService.tb_activity.count({ where }),
    ]);

    const mappedData = await this.mapActorInfo(data);

    return Result.ok({
      paginate: {
        total,
        page,
        perpage: limit,
        pages: total === 0 ? 1 : Math.ceil(total / limit),
      },
      data: mappedData,
    });
  }

  /**
   * Map actor info (username, firstname, lastname) from platform schema
   * แมปข้อมูลผู้กระทำจาก platform schema (username, ชื่อ, นามสกุล)
   */
   
  private async mapActorInfo(data: any[]): Promise<any[]> {
    const actorIds = [...new Set(data.map((d) => d.actor_id).filter(Boolean))] as string[];
    if (actorIds.length === 0) return data;

    const [users, userProfiles] = await Promise.all([
      this.prismaSystem.tb_user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, username: true },
      }),
      this.prismaSystem.tb_user_profile.findMany({
        where: { user_id: { in: actorIds } },
        select: { user_id: true, firstname: true, middlename: true, lastname: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const profileMap = new Map(userProfiles.map((p) => [p.user_id, p]));

    return data.map((item) => {
      const user = item.actor_id ? userMap.get(item.actor_id) : null;
      const profile = item.actor_id ? profileMap.get(item.actor_id) : null;
      return {
        ...item,
        actor_username: user?.username ?? null,
        actor_firstname: profile?.firstname ?? null,
        actor_middlename: profile?.middlename ?? null,
        actor_lastname: profile?.lastname ?? null,
      };
    });
  }

  /**
   * Find an activity log by ID
   * ค้นหาบันทึกกิจกรรมรายการเดียวตาม ID
   * @param id - Activity log ID / ID บันทึกกิจกรรม
   * @returns Activity log detail / รายละเอียดบันทึกกิจกรรม
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'findOne', id }, ActivityLogService.name);

    const activity = await this.prismaService.tb_activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return Result.error('Activity log not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(activity);
  }

  /**
   * Soft delete an activity log
   * ลบบันทึกกิจกรรมแบบซอฟต์ดีลีท
   * @param id - Activity log ID / ID บันทึกกิจกรรม
   * @param userId - User ID performing the delete / ID ผู้ใช้ที่ทำการลบ
   * @returns Deleted activity log ID / ID บันทึกกิจกรรมที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string, userId: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, userId },
      ActivityLogService.name,
    );

    const activity = await this.prismaService.tb_activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return Result.error('Activity log not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_activity.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: userId,
      },
    });

    return Result.ok({ id: activity.id });
  }

  /**
   * Soft delete multiple activity logs
   * ลบบันทึกกิจกรรมหลายรายการแบบซอฟต์ดีลีท
   * @param ids - Array of activity log IDs / อาร์เรย์ ID บันทึกกิจกรรม
   * @param userId - User ID performing the delete / ID ผู้ใช้ที่ทำการลบ
   * @returns Count of deleted records / จำนวนที่ลบ
   */
  @TryCatch
  async deleteMany(ids: string[], userId: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'deleteMany', ids, userId },
      ActivityLogService.name,
    );

    if (!ids || ids.length === 0) {
      return Result.error('No activity log IDs provided', ErrorCode.INVALID_ARGUMENT);
    }

    const result = await this.prismaService.tb_activity.updateMany({
      where: {
        id: { in: ids },
        deleted_at: null,
      },
      data: {
        deleted_at: new Date(),
        deleted_by_id: userId,
      },
    });

    return Result.ok({ count: result.count });
  }

  /**
   * Permanently delete an activity log
   * ลบบันทึกกิจกรรมอย่างถาวร
   * @param id - Activity log ID / ID บันทึกกิจกรรม
   * @returns Deleted activity log ID / ID บันทึกกิจกรรมที่ลบแล้ว
   */
  @TryCatch
  async hardDelete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'hardDelete', id },
      ActivityLogService.name,
    );

    const activity = await this.prismaService.tb_activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return Result.error('Activity log not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_activity.delete({
      where: { id },
    });

    return Result.ok({ id: activity.id });
  }

  /**
   * Permanently delete multiple activity logs
   * ลบบันทึกกิจกรรมหลายรายการอย่างถาวร
   * @param ids - Array of activity log IDs / อาร์เรย์ ID บันทึกกิจกรรม
   * @returns Count of deleted records / จำนวนที่ลบ
   */
  @TryCatch
  async hardDeleteMany(ids: string[]): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'hardDeleteMany', ids },
      ActivityLogService.name,
    );

    if (!ids || ids.length === 0) {
      return Result.error('No activity log IDs provided', ErrorCode.INVALID_ARGUMENT);
    }

    const result = await this.prismaService.tb_activity.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return Result.ok({ count: result.count });
  }
}
