import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { TryCatch, Result, ErrorCode } from '@/common';

export interface IPaginate {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
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

  constructor(private readonly tenantService: TenantService) {}

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

  @TryCatch
  async findAll(
    paginate: IPaginate,
    filters?: IActivityLogFilter,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', paginate, filters },
      ActivityLogService.name,
    );

    const page = paginate?.page || 1;
    const limit = paginate?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
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

    const orderBy: any = {};
    if (paginate?.sortBy) {
      orderBy[paginate.sortBy] = paginate.sortOrder || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prismaService.tb_activity.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prismaService.tb_activity.count({ where }),
    ]);

    return Result.ok({
      paginate: {
        total,
        page,
        perpage: limit,
        pages: total === 0 ? 1 : Math.ceil(total / limit),
      },
      data,
    });
  }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'findOne', id }, ActivityLogService.name);

    const activity = await this.prismaService.tb_activity.findUnique({
      where: { id },
    });

    if (!activity) {
      return Result.error('Activity log not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(activity);
  }

  @TryCatch
  async delete(id: string, userId: string): Promise<Result<any>> {
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

  @TryCatch
  async deleteMany(ids: string[], userId: string): Promise<Result<any>> {
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

  @TryCatch
  async hardDelete(id: string): Promise<Result<any>> {
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

  @TryCatch
  async hardDeleteMany(ids: string[]): Promise<Result<any>> {
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
