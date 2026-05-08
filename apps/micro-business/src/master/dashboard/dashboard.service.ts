import { HttpStatus, Injectable, HttpException, Inject } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_USER_ID } from '@/common/constant';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class DashboardService {
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
    DashboardService.name,
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
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) {}

  @TryCatch
  async findAll(): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code },
      DashboardService.name,
    );

    const dashboards = await this.prismaService.tb_dashboard_layout.findMany({
      where: {
        deleted_at: null,
        OR: [
          { owner_id: this.userId },
          { is_shared: true },
        ],
      },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return Result.ok(dashboards);
  }

  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      DashboardService.name,
    );

    const dashboard = await this.prismaService.tb_dashboard_layout.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        widgets: {
          where: { deleted_at: null },
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!dashboard) {
      return Result.error('Dashboard not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(dashboard);
  }

  @TryCatch
  async create(data: {
    name: string;
    description?: string;
    is_default?: boolean;
    is_shared?: boolean;
    settings?: Record<string, unknown>;
  }): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      DashboardService.name,
    );

    // If setting as default, unset other defaults for this user
    if (data.is_default) {
      await this.prismaService.tb_dashboard_layout.updateMany({
        where: { owner_id: this.userId, is_default: true, deleted_at: null },
        data: { is_default: false },
      });
    }

    const dashboard = await this.prismaService.tb_dashboard_layout.create({
      data: {
        name: data.name,
        description: data.description,
        is_default: data.is_default ?? false,
        is_shared: data.is_shared ?? false,
        owner_id: this.userId,
        settings: data.settings ?? {},
        created_by_id: this.userId,
      },
      include: {
        widgets: true,
      },
    });

    return Result.ok(dashboard);
  }

  @TryCatch
  async update(data: {
    id: string;
    name?: string;
    description?: string;
    is_default?: boolean;
    is_shared?: boolean;
    settings?: Record<string, unknown>;
  }): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      DashboardService.name,
    );

    const existing = await this.prismaService.tb_dashboard_layout.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!existing) {
      return Result.error('Dashboard not found', ErrorCode.NOT_FOUND);
    }

    if (data.is_default) {
      await this.prismaService.tb_dashboard_layout.updateMany({
        where: { owner_id: this.userId, is_default: true, deleted_at: null, NOT: { id: data.id } },
        data: { is_default: false },
      });
    }

    const { id, ...updateData } = data;
    const dashboard = await this.prismaService.tb_dashboard_layout.update({
      where: { id },
      data: {
        ...updateData,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok(dashboard);
  }

  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      DashboardService.name,
    );

    const existing = await this.prismaService.tb_dashboard_layout.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      return Result.error('Dashboard not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_dashboard_layout.update({
      where: { id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id });
  }

  @TryCatch
  async updateLayout(
    dashboardId: string,
    data: {
      widgets: Array<{
        id: string;
        grid_x: number;
        grid_y: number;
        grid_w: number;
        grid_h: number;
      }>;
    },
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'updateLayout', dashboardId, data, user_id: this.userId },
      DashboardService.name,
    );

    // Batch update widget positions
    await Promise.all(
      data.widgets.map((w) =>
        this.prismaService.tb_dashboard_widget.update({
          where: { id: w.id },
          data: {
            grid_x: w.grid_x,
            grid_y: w.grid_y,
            grid_w: w.grid_w,
            grid_h: w.grid_h,
            updated_by_id: this.userId,
            updated_at: new Date().toISOString(),
          },
        }),
      ),
    );

    return Result.ok({ id: dashboardId });
  }

  @TryCatch
  async addWidget(
    dashboardId: string,
    data: {
      widget_type: string;
      title: string;
      grid_x?: number;
      grid_y?: number;
      grid_w?: number;
      grid_h?: number;
      data_source_url: string;
      data_filters?: Record<string, unknown>;
      chart_config?: Record<string, unknown>;
      display_config?: Record<string, unknown>;
      refresh_interval_sec?: number | null;
    },
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'addWidget', dashboardId, data, user_id: this.userId },
      DashboardService.name,
    );

    const widget = await this.prismaService.tb_dashboard_widget.create({
      data: {
        dashboard_id: dashboardId,
        widget_type: data.widget_type,
        title: data.title,
        grid_x: data.grid_x ?? 0,
        grid_y: data.grid_y ?? 0,
        grid_w: data.grid_w ?? 4,
        grid_h: data.grid_h ?? 3,
        data_source_url: data.data_source_url,
        data_filters: data.data_filters ?? {},
        chart_config: data.chart_config ?? {},
        display_config: data.display_config ?? {},
        refresh_interval_sec: data.refresh_interval_sec ?? 300,
        created_by_id: this.userId,
      },
    });

    return Result.ok(widget);
  }

  @TryCatch
  async updateWidget(
    widgetId: string,
    data: {
      title?: string;
      data_source_url?: string;
      data_filters?: Record<string, unknown>;
      chart_config?: Record<string, unknown>;
      display_config?: Record<string, unknown>;
      refresh_interval_sec?: number | null;
    },
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'updateWidget', widgetId, data, user_id: this.userId },
      DashboardService.name,
    );

    const existing = await this.prismaService.tb_dashboard_widget.findFirst({
      where: { id: widgetId, deleted_at: null },
    });

    if (!existing) {
      return Result.error('Widget not found', ErrorCode.NOT_FOUND);
    }

    const widget = await this.prismaService.tb_dashboard_widget.update({
      where: { id: widgetId },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok(widget);
  }

  @TryCatch
  async deleteWidget(widgetId: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'deleteWidget', widgetId, user_id: this.userId },
      DashboardService.name,
    );

    const existing = await this.prismaService.tb_dashboard_widget.findFirst({
      where: { id: widgetId, deleted_at: null },
    });

    if (!existing) {
      return Result.error('Widget not found', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_dashboard_widget.update({
      where: { id: widgetId },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: widgetId });
  }
}
