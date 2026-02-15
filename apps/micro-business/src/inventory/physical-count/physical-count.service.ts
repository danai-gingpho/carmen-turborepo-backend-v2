import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  PrismaClient_TENANT,
  enum_physical_count_status,
  enum_physical_count_period_status,
  enum_doc_status,
  Prisma,
} from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/libs/paginate.query';
import {
  IPhysicalCountCreate,
  IPhysicalCountSave,
  IPhysicalCountSubmit,
  IPhysicalCountDetailCommentCreate,
  IPhysicalCountDetailCommentUpdate,
} from './interface/physical-count.interface';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Injectable, Inject } from '@nestjs/common';
import { format } from 'date-fns';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class PhysicalCountService {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountService.name,
  );

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
  ) {}

  @TryCatch
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    const details = await prisma.tb_physical_count_detail.findMany({
      where: { physical_count_id: id, deleted_at: null },
      include: {
        tb_unit_inventory: {
          select: { id: true, name: true },
        },
      },
    });

    const responseData = {
      ...physicalCount,
      details: details,
    };

    return Result.ok(responseData);
  }

  @TryCatch
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    location_ids: string[] = [],
    period_id?: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, location_ids, period_id },
      PhysicalCountService.name,
    );

    const defaultSearchFields = ['location_code', 'location_name'];

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

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const locationFilter = location_ids.length > 0
      ? { location_id: { in: location_ids } }
      : {};

    const periodFilter = period_id
      ? { period_id: period_id }
      : {};

    const whereClause = {
      ...q.where(),
      ...locationFilter,
      ...periodFilter,
      deleted_at: null,
    };

    const physicalCountList = await prisma.tb_physical_count.findMany({
      ...q.findMany(),
      where: whereClause,
      select: {
        id: true,
        period_id: true,
        location_id: true,
        location_code: true,
        location_name: true,
        status: true,
        product_counted: true,
        product_total: true,
        created_at: true,
        updated_at: true,
      },
    });

    const total = await prisma.tb_physical_count.count({
      where: whereClause,
    });

    return Result.ok({
      data: physicalCountList,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  @TryCatch
  async create(
    data: IPhysicalCountCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const period = await prisma.tb_physical_count_period.findFirst({
      where: { id: data.period_id, deleted_at: null },
    });

    if (!period) {
      return Result.error('Physical Count Period not found', ErrorCode.NOT_FOUND);
    }

    if (period.status !== enum_physical_count_period_status.counting) {
      return Result.error(
        'Physical Count Period is not in counting status',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const location = await prisma.tb_location.findFirst({
      where: { id: data.location_id, deleted_at: null },
    });

    if (!location) {
      return Result.error('Location not found', ErrorCode.NOT_FOUND);
    }

    const existingCount = await prisma.tb_physical_count.findFirst({
      where: {
        period_id: data.period_id,
        location_id: data.location_id,
        deleted_at: null,
      },
    });

    if (existingCount) {
      return this.findOne(existingCount.id, user_id, tenant_id);
    }

    const stockByProduct = await prisma.$queryRaw<
      Array<{
        product_id: string;
        product_name: string;
        product_code: string;
        product_sku: string;
        inventory_unit_id: string;
        on_hand_qty: Prisma.Decimal;
      }>
    >`
      SELECT
        itd.product_id,
        p.name as product_name,
        p.code as product_code,
        p.sku as product_sku,
        p.inventory_unit_id,
        COALESCE(SUM(itd.qty), 0) as on_hand_qty
      FROM tb_inventory_transaction_detail itd
      JOIN tb_product p ON itd.product_id = p.id
      WHERE itd.location_id = ${data.location_id}::uuid
        AND p.deleted_at IS NULL
      GROUP BY itd.product_id, p.name, p.code, p.sku, p.inventory_unit_id
      HAVING COALESCE(SUM(itd.qty), 0) != 0
    `;

    const result = await prisma.$transaction(async (tx) => {
      const physicalCount = await tx.tb_physical_count.create({
        data: {
          period_id: data.period_id,
          location_id: data.location_id,
          location_code: location.code,
          location_name: location.name,
          description: data.description || null,
          status: enum_physical_count_status.in_progress,
          start_counting_at: new Date(),
          start_counting_by_id: user_id,
          product_total: stockByProduct.length,
          product_counted: 0,
          created_by_id: user_id,
        },
      });

      if (stockByProduct.length > 0) {
        const detailsData = stockByProduct.map((item) => ({
          physical_count_id: physicalCount.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code,
          product_sku: item.product_sku,
          inventory_unit_id: item.inventory_unit_id,
          on_hand_qty: item.on_hand_qty,
          counted_qty: new Prisma.Decimal(0),
          diff_qty: new Prisma.Decimal(0),
          created_by_id: user_id,
        }));

        await tx.tb_physical_count_detail.createMany({
          data: detailsData,
        });
      }

      return physicalCount;
    });

    return this.findOne(result.id, user_id, tenant_id);
  }

  @TryCatch
  async save(
    data: IPhysicalCountSave,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'save', data, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Physical Count is already completed',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const detail of data.details) {
        const existingDetail = await tx.tb_physical_count_detail.findFirst({
          where: { id: detail.id, physical_count_id: data.id, deleted_at: null },
        });

        if (!existingDetail) {
          continue;
        }

        const countedQty = new Prisma.Decimal(detail.counted_qty);
        const diffQty = countedQty.minus(existingDetail.on_hand_qty);

        await tx.tb_physical_count_detail.update({
          where: { id: detail.id },
          data: {
            counted_qty: countedQty,
            diff_qty: diffQty,
            updated_by_id: user_id,
            updated_at: new Date(),
          },
        });
      }

      const allDetails = await tx.tb_physical_count_detail.findMany({
        where: { physical_count_id: data.id, deleted_at: null },
      });

      const totalCounted = allDetails.filter(
        (d) => d.counted_qty && !d.counted_qty.equals(0),
      ).length;

      await tx.tb_physical_count.update({
        where: { id: data.id },
        data: {
          product_counted: totalCounted,
          updated_by_id: user_id,
          updated_at: new Date(),
        },
      });
    });

    return this.findOne(data.id, user_id, tenant_id);
  }

  @TryCatch
  async submit(
    data: IPhysicalCountSubmit,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'submit', data, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Physical Count is already completed',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const period = await prisma.tb_physical_count_period.findFirst({
      where: { id: physicalCount.period_id, deleted_at: null },
    });

    const details = await prisma.tb_physical_count_detail.findMany({
      where: { physical_count_id: data.id, deleted_at: null },
    });

    const uncountedDetails = details.filter(
      (d) => d.counted_qty === null || d.counted_qty.equals(0),
    );

    if (uncountedDetails.length > 0) {
      return Result.error(
        `${uncountedDetails.length} products have not been counted yet`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    const detailsWithVariance = details.filter(
      (d) => d.diff_qty && !d.diff_qty.equals(0),
    );

    const periodNote = period
      ? `Physical Count Adjustment - Period: ${format(period.counting_period_from_date, 'yyyy-MM-dd')} to ${format(period.counting_period_to_date, 'yyyy-MM-dd')}`
      : 'Physical Count Adjustment';

    await prisma.$transaction(async (tx) => {
      const positiveVariance = detailsWithVariance.filter(
        (d) => d.diff_qty.greaterThan(0),
      );
      const negativeVariance = detailsWithVariance.filter(
        (d) => d.diff_qty.lessThan(0),
      );

      if (positiveVariance.length > 0) {
        const siNo = await this.generateSINo(new Date().toISOString(), tenant_id, user_id);

        const stockIn = await tx.tb_stock_in.create({
          data: {
            si_no: siNo,
            description: periodNote,
            doc_status: enum_doc_status.completed,
            doc_version: 0,
            created_by_id: user_id,
          },
        });

        let sequenceNo = 1;
        const stockInDetails = positiveVariance.map((d) => ({
          stock_in_id: stockIn.id,
          sequence_no: sequenceNo++,
          product_id: d.product_id,
          product_name: d.product_name,
          location_id: physicalCount.location_id,
          location_code: physicalCount.location_code,
          location_name: physicalCount.location_name,
          qty: d.diff_qty,
          cost_per_unit: new Prisma.Decimal(0),
          total_cost: new Prisma.Decimal(0),
          note: `Physical Count Adjustment - Variance: +${d.diff_qty}`,
          created_by_id: user_id,
        }));

        await tx.tb_stock_in_detail.createMany({
          data: stockInDetails,
        });
      }

      if (negativeVariance.length > 0) {
        const soNo = await this.generateSONo(new Date().toISOString(), tenant_id, user_id);

        const stockOut = await tx.tb_stock_out.create({
          data: {
            so_no: soNo,
            description: periodNote,
            doc_status: enum_doc_status.completed,
            doc_version: 0,
            created_by_id: user_id,
          },
        });

        let sequenceNo = 1;
        const stockOutDetails = negativeVariance.map((d) => ({
          stock_out_id: stockOut.id,
          sequence_no: sequenceNo++,
          product_id: d.product_id,
          product_name: d.product_name,
          location_id: physicalCount.location_id,
          location_code: physicalCount.location_code,
          location_name: physicalCount.location_name,
          qty: d.diff_qty.abs(),
          cost_per_unit: new Prisma.Decimal(0),
          total_cost: new Prisma.Decimal(0),
          note: `Physical Count Adjustment - Variance: ${d.diff_qty}`,
          created_by_id: user_id,
        }));

        await tx.tb_stock_out_detail.createMany({
          data: stockOutDetails,
        });
      }

      await tx.tb_physical_count.update({
        where: { id: data.id },
        data: {
          status: enum_physical_count_status.completed,
          completed_at: new Date(),
          completed_by_id: user_id,
          updated_by_id: user_id,
          updated_at: new Date(),
        },
      });
    });

    return this.findOne(data.id, user_id, tenant_id);
  }

  @TryCatch
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const physicalCount = await prisma.tb_physical_count.findFirst({
      where: { id, deleted_at: null },
    });

    if (!physicalCount) {
      return Result.error('Physical Count not found', ErrorCode.NOT_FOUND);
    }

    if (physicalCount.status === enum_physical_count_status.completed) {
      return Result.error(
        'Cannot delete completed Physical Count',
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.tb_physical_count_detail.updateMany({
        where: { physical_count_id: id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });

      await tx.tb_physical_count.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });
    });

    return Result.ok({ id });
  }

  // ==================== Detail Comment CRUD ====================

  @TryCatch
  async findDetailComments(
    physical_count_detail_id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailComments', physical_count_detail_id, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const comments = await prisma.tb_physical_count_detail_comment.findMany({
      where: { physical_count_detail_id, deleted_at: null },
      orderBy: { created_at: 'asc' },
    });

    return Result.ok(comments);
  }

  @TryCatch
  async createDetailComment(
    data: IPhysicalCountDetailCommentCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetailComment', data, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const detail = await prisma.tb_physical_count_detail.findFirst({
      where: { id: data.physical_count_detail_id, deleted_at: null },
    });

    if (!detail) {
      return Result.error('Physical Count Detail not found', ErrorCode.NOT_FOUND);
    }

    const comment = await prisma.tb_physical_count_detail_comment.create({
      data: {
        physical_count_detail_id: data.physical_count_detail_id,
        type: 'user',
        user_id: user_id,
        message: data.message || null,
        attachments: data.attachments || [],
        created_by_id: user_id,
      },
    });

    return Result.ok(comment);
  }

  @TryCatch
  async updateDetailComment(
    data: IPhysicalCountDetailCommentUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'updateDetailComment', data, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const existingComment = await prisma.tb_physical_count_detail_comment.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!existingComment) {
      return Result.error('Comment not found', ErrorCode.NOT_FOUND);
    }

    const { id, ...updateData } = data;

    const comment = await prisma.tb_physical_count_detail_comment.update({
      where: { id: data.id },
      data: {
        ...updateData,
        updated_by_id: user_id,
        updated_at: new Date(),
      },
    });

    return Result.ok(comment);
  }

  @TryCatch
  async deleteDetailComment(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'deleteDetailComment', id, user_id, tenant_id },
      PhysicalCountService.name,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const existingComment = await prisma.tb_physical_count_detail_comment.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existingComment) {
      return Result.error('Comment not found', ErrorCode.NOT_FOUND);
    }

    await prisma.tb_physical_count_detail_comment.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok({ id });
  }

  // ==================== Private Helper Methods ====================

  private async generateSINo(
    siDate: string,
    bu_code: string,
    user_id: string,
  ): Promise<string> {
    try {
      const res: Observable<any> = this.masterService.send(
        { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
        { type: 'SI', user_id, bu_code },
      );
      const response = await firstValueFrom(res);
      const patterns = response.data;

      let datePattern: any;
      let runningPattern: any;
      patterns.forEach((pattern: any) => {
        if (pattern.type === 'date') {
          datePattern = pattern;
        } else if (pattern.type === 'running') {
          runningPattern = pattern;
        }
      });

      const getDate = new Date(siDate);

      const generateCodeRes: Observable<any> = this.masterService.send(
        { cmd: 'running-code.generate-code', service: 'running-codes' },
        {
          type: 'SI',
          issueDate: getDate,
          last_no: 0,
          user_id,
          bu_code: bu_code,
        },
      );
      const generateCodeResponse = await firstValueFrom(generateCodeRes);
      return generateCodeResponse.data.code;
    } catch (error) {
      return `SI-PC-${format(new Date(), 'yyyyMMddHHmmss')}`;
    }
  }

  private async generateSONo(
    soDate: string,
    bu_code: string,
    user_id: string,
  ): Promise<string> {
    try {
      const res: Observable<any> = this.masterService.send(
        { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
        { type: 'SO', user_id, bu_code },
      );
      const response = await firstValueFrom(res);
      const patterns = response.data;

      let datePattern: any;
      let runningPattern: any;
      patterns.forEach((pattern: any) => {
        if (pattern.type === 'date') {
          datePattern = pattern;
        } else if (pattern.type === 'running') {
          runningPattern = pattern;
        }
      });

      const getDate = new Date(soDate);

      const generateCodeRes: Observable<any> = this.masterService.send(
        { cmd: 'running-code.generate-code', service: 'running-codes' },
        {
          type: 'SO',
          issueDate: getDate,
          last_no: 0,
          user_id,
          bu_code: bu_code,
        },
      );
      const generateCodeResponse = await firstValueFrom(generateCodeRes);
      return generateCodeResponse.data.code;
    } catch (error) {
      return `SO-PC-${format(new Date(), 'yyyyMMddHHmmss')}`;
    }
  }
}
