import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT, enum_doc_status } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/libs/paginate.query';
import { IStockInCreate, IStockInUpdate, IStockInDetailCreate, IStockInDetailUpdate } from './interface/stock-in.interface';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { Injectable, Inject } from '@nestjs/common';
import { format } from 'date-fns';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  StockInDetailResponseSchema,
  StockInListItemResponseSchema,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';

@Injectable()
export class StockInService {
  private readonly logger: BackendLogger = new BackendLogger(StockInService.name);

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
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'findOne', id, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    const stockInDetail = await prisma.tb_stock_in_detail.findMany({
      where: { stock_in_id: id, deleted_at: null },
      orderBy: { sequence_no: 'asc' },
    });

    const responseData = {
      ...stockIn,
      stock_in_detail: stockInDetail,
    };

    const serializedData = StockInDetailResponseSchema.parse(responseData);
    return Result.ok(serializedData);
  }

  @TryCatch
  async findAll(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug({ function: 'findAll', user_id, tenant_id, paginate }, StockInService.name);

    const defaultSearchFields = ['si_no', 'description'];

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

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockInList = await prisma.tb_stock_in.findMany({
      ...q.findMany(),
      where: {
        ...q.where(),
        deleted_at: null,
      },
      select: {
        id: true,
        si_no: true,
        description: true,
        doc_status: true,
        // workflow_name: true,
        // workflow_current_stage: true,
        created_at: true,
        updated_at: true,
      },
    });

    const total = await prisma.tb_stock_in.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    const serializedStockInList = stockInList.map((item) =>
      StockInListItemResponseSchema.parse(item)
    );

    return Result.ok({
      data: serializedStockInList,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  @TryCatch
  async create(data: IStockInCreate, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'create', data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Validate workflow if provided
    // if (data.workflow_id) {
    //   const workflow = await prisma.tb_workflow.findFirst({
    //     where: { id: data.workflow_id },
    //   });
    //   if (!workflow) {
    //     return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
    //   }
    // }

    // Validate stock_in_detail items
    if (data.stock_in_detail?.add) {
      const productNotFound: string[] = [];
      const locationNotFound: string[] = [];

      await Promise.all(
        data.stock_in_detail.add.map(async (item) => {
          if (item.product_id) {
            const product = await prisma.tb_product.findFirst({
              where: { id: item.product_id },
            });
            if (!product) {
              productNotFound.push(item.product_id);
            } else {
              item.product_name = product.name;
              item.product_local_name = product.local_name;
            }
          }

          if (item.location_id) {
            const location = await prisma.tb_location.findFirst({
              where: { id: item.location_id },
            });
            if (!location) {
              locationNotFound.push(item.location_id);
            } else {
              item.location_code = location.code;
              item.location_name = location.name;
            }
          }
        }),
      );

      if (productNotFound.length > 0) {
        return Result.error(`Product not found: ${productNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }

      if (locationNotFound.length > 0) {
        return Result.error(`Location not found: ${locationNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
      }
    }

    const tx = await prisma.$transaction(async (prisma) => {
      const stockInObject = { ...data };
      delete stockInObject.stock_in_detail;

      const createStockIn = await prisma.tb_stock_in.create({
        data: {
          ...stockInObject,
          created_by_id: user_id,
          si_no: await this.generateSINo(new Date().toISOString(), tenant_id, user_id),
          doc_version: 0,
          doc_status: enum_doc_status.draft,
        },
      });

      if (data.stock_in_detail?.add && data.stock_in_detail.add.length > 0) {
        let sequenceNo = 1;
        const stockInDetailObj = data.stock_in_detail.add.map((item) => ({
          stock_in_id: createStockIn.id,
          created_by_id: user_id,
          sequence_no: sequenceNo++,
          product_id: item.product_id || '',
          location_id: item.location_id || null,
          product_name: item.product_name || null,
          product_local_name: item.product_local_name || null,
          location_code: item.location_code || null,
          location_name: item.location_name || null,
          description: item.description || null,
          qty: item.qty || 0,
          cost_per_unit: item.cost_per_unit || 0,
          total_cost: item.total_cost || 0,
          note: item.note || null,
          info: item.info || null,
          dimension: item.dimension || null,
        }));

        await prisma.tb_stock_in_detail.createMany({
          data: stockInDetailObj,
        });
      }

      return { id: createStockIn.id, si_no: createStockIn.si_no };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async update(data: IStockInUpdate, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'update', data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: data.id, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    // Validate workflow if provided
    // if (data.workflow_id) {
    //   const workflow = await prisma.tb_workflow.findFirst({
    //     where: { id: data.workflow_id },
    //   });
    //   if (!workflow) {
    //     return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
    //   }
    // }

    // Validate detail items
    if (data.stock_in_detail) {
      if (data.stock_in_detail.add) {
        const productNotFound: string[] = [];
        const locationNotFound: string[] = [];

        await Promise.all(
          data.stock_in_detail.add.map(async (item) => {
            if (item.product_id) {
              const product = await prisma.tb_product.findFirst({
                where: { id: item.product_id },
              });
              if (!product) {
                productNotFound.push(item.product_id);
              } else {
                item.product_name = product.name;
                item.product_local_name = product.local_name;
              }
            }

            if (item.location_id) {
              const location = await prisma.tb_location.findFirst({
                where: { id: item.location_id },
              });
              if (!location) {
                locationNotFound.push(item.location_id);
              } else {
                item.location_code = location.code;
                item.location_name = location.name;
              }
            }
          }),
        );

        if (productNotFound.length > 0) {
          return Result.error(`Product not found: ${productNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        if (locationNotFound.length > 0) {
          return Result.error(`Location not found: ${locationNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }

      if (data.stock_in_detail.update) {
        const detailNotFound: string[] = [];

        await Promise.all(
          data.stock_in_detail.update.map(async (item) => {
            const detail = await prisma.tb_stock_in_detail.findFirst({
              where: { id: item.id, deleted_at: null },
            });
            if (!detail) {
              detailNotFound.push(item.id);
            }
          }),
        );

        if (detailNotFound.length > 0) {
          return Result.error(`Stock In Detail not found: ${detailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }

      if (data.stock_in_detail.remove) {
        const detailNotFound: string[] = [];

        await Promise.all(
          data.stock_in_detail.remove.map(async (item) => {
            const detail = await prisma.tb_stock_in_detail.findFirst({
              where: { id: item.id, deleted_at: null },
            });
            if (!detail) {
              detailNotFound.push(item.id);
            }
          }),
        );

        if (detailNotFound.length > 0) {
          return Result.error(`Stock In Detail not found: ${detailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }
    }

    const tx = await prisma.$transaction(async (prisma) => {
      const { stock_in_detail: _, id: __, ...stockInUpdateData } = data;

      if (Object.keys(stockInUpdateData).length > 0) {
        const updatePayload: any = {
          ...stockInUpdateData,
          updated_by_id: user_id,
          updated_at: new Date(),
        };
        // Cast doc_status to enum if present
        if (stockInUpdateData.doc_status) {
          updatePayload.doc_status = stockInUpdateData.doc_status as enum_doc_status;
        }
        await prisma.tb_stock_in.update({
          where: { id: data.id },
          data: updatePayload,
        });
      }

      if (data.stock_in_detail) {
        if (data.stock_in_detail.add && data.stock_in_detail.add.length > 0) {
          const maxSequence = await prisma.tb_stock_in_detail.aggregate({
            where: { stock_in_id: data.id, deleted_at: null },
            _max: { sequence_no: true },
          });
          let sequenceNo = (maxSequence._max.sequence_no || 0) + 1;

          const detailCreateObj = data.stock_in_detail.add.map((item) => ({
            stock_in_id: data.id,
            created_by_id: user_id,
            sequence_no: sequenceNo++,
            product_id: item.product_id || '',
            location_id: item.location_id || null,
            product_name: item.product_name || null,
            product_local_name: item.product_local_name || null,
            location_code: item.location_code || null,
            location_name: item.location_name || null,
            description: item.description || null,
            qty: item.qty || 0,
            cost_per_unit: item.cost_per_unit || 0,
            total_cost: item.total_cost || 0,
            note: item.note || null,
            info: item.info || null,
            dimension: item.dimension || null,
          }));

          await prisma.tb_stock_in_detail.createMany({
            data: detailCreateObj,
          });
        }

        if (data.stock_in_detail.update && data.stock_in_detail.update.length > 0) {
          await Promise.all(
            data.stock_in_detail.update.map(async (item) => {
              const { id, ...updateData } = item;
              await prisma.tb_stock_in_detail.update({
                where: { id },
                data: {
                  ...updateData,
                  updated_by_id: user_id,
                  updated_at: new Date(),
                },
              });
            }),
          );
        }

        if (data.stock_in_detail.remove && data.stock_in_detail.remove.length > 0) {
          const detailIds = data.stock_in_detail.remove.map((item) => item.id);
          await prisma.tb_stock_in_detail.updateMany({
            where: { id: { in: detailIds } },
            data: {
              deleted_at: new Date(),
              deleted_by_id: user_id,
            },
          });
        }
      }

      return { id: data.id };
    });

    return Result.ok(tx);
  }

  @TryCatch
  async delete(id: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'delete', id, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    await prisma.$transaction(async (prisma) => {
      // Soft delete details
      await prisma.tb_stock_in_detail.updateMany({
        where: { stock_in_id: id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });

      // Soft delete comments
      await prisma.tb_stock_in_comment.updateMany({
        where: { stock_in_id: id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });

      // Soft delete stock in
      await prisma.tb_stock_in.update({
        where: { id },
        data: {
          deleted_at: new Date(),
          deleted_by_id: user_id,
        },
      });
    });

    return Result.ok({ id });
  }

  async findLatestSIByPattern(pattern: string, tenant_id: string, user_id: string): Promise<any> {
    this.logger.debug({ function: 'findLatestSIByPattern', pattern, tenant_id, user_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: {
        si_no: { contains: pattern },
      },
      orderBy: { created_at: 'desc' },
    });

    return stockIn;
  }

  private async generateSINo(siDate: string, tenant_id: string, user_id: string): Promise<string> {
    this.logger.debug({ function: 'generateSINo', siDate, tenant_id, user_id }, StockInService.name);

    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
      { type: 'SI', user_id, tenant_id },
    );
    const response = await firstValueFrom(res);
    const patterns = response.data;

    let datePattern;
    let runningPattern;
    patterns.forEach((pattern) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    const getDate = new Date(siDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    const latestSI = await this.findLatestSIByPattern(datePatternValue, tenant_id, user_id);
    const latestSINumber = latestSI
      ? Number(latestSI.si_no.slice(-Number(runningPattern.pattern)))
      : 0;

    const generateCodeRes: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'SI',
        issueDate: getDate,
        last_no: latestSINumber,
        user_id,
        tenant_id,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);
    const siNo = generateCodeResponse.data.code;

    return siNo;
  }

  // ==================== Stock In Detail CRUD ====================

  @TryCatch
  async findDetailById(detailId: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'findDetailById', detailId, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const detail = await prisma.tb_stock_in_detail.findFirst({
      where: { id: detailId, deleted_at: null },
      include: {
        tb_stock_in: {
          select: { id: true, si_no: true, doc_status: true },
        },
        tb_product: {
          select: { id: true, name: true, local_name: true },
        },
        tb_location: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!detail) {
      return Result.error('Stock In Detail not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(detail);
  }

  @TryCatch
  async findDetailsByStockInId(stockInId: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'findDetailsByStockInId', stockInId, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: stockInId, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    const details = await prisma.tb_stock_in_detail.findMany({
      where: { stock_in_id: stockInId, deleted_at: null },
      include: {
        tb_product: {
          select: { id: true, name: true, local_name: true },
        },
        tb_location: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { sequence_no: 'asc' },
    });

    return Result.ok(details);
  }

  @TryCatch
  async createDetail(
    stockInId: string,
    data: IStockInDetailCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug({ function: 'createDetail', stockInId, data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: stockInId, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    if (stockIn.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot add detail to non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    // Validate product
    if (data.product_id) {
      const product = await prisma.tb_product.findFirst({
        where: { id: data.product_id },
      });
      if (!product) {
        return Result.error('Product not found', ErrorCode.NOT_FOUND);
      }
      data.product_name = product.name;
      data.product_local_name = product.local_name;
    }

    // Validate location
    if (data.location_id) {
      const location = await prisma.tb_location.findFirst({
        where: { id: data.location_id },
      });
      if (!location) {
        return Result.error('Location not found', ErrorCode.NOT_FOUND);
      }
      data.location_code = location.code;
      data.location_name = location.name;
    }

    const maxSequence = await prisma.tb_stock_in_detail.aggregate({
      where: { stock_in_id: stockInId, deleted_at: null },
      _max: { sequence_no: true },
    });
    const nextSequence = (maxSequence._max.sequence_no || 0) + 1;

    const detail = await prisma.tb_stock_in_detail.create({
      data: {
        stock_in_id: stockInId,
        sequence_no: nextSequence,
        created_by_id: user_id,
        product_id: data.product_id || '',
        location_id: data.location_id || null,
        product_name: data.product_name || null,
        product_local_name: data.product_local_name || null,
        location_code: data.location_code || null,
        location_name: data.location_name || null,
        description: data.description || null,
        qty: data.qty || 0,
        cost_per_unit: data.cost_per_unit || 0,
        total_cost: data.total_cost || 0,
        note: data.note || null,
        info: data.info || null,
        dimension: data.dimension || null,
      },
    });

    return Result.ok(detail);
  }

  @TryCatch
  async updateDetail(
    detailId: string,
    data: IStockInDetailUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug({ function: 'updateDetail', detailId, data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingDetail = await prisma.tb_stock_in_detail.findFirst({
      where: { id: detailId, deleted_at: null },
      include: { tb_stock_in: true },
    });

    if (!existingDetail) {
      return Result.error('Stock In Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_stock_in?.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot update detail of non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    const { id, ...updateData } = data;

    const updatedDetail = await prisma.tb_stock_in_detail.update({
      where: { id: detailId },
      data: {
        ...updateData,
        updated_by_id: user_id,
        updated_at: new Date(),
      },
    });

    return Result.ok(updatedDetail);
  }

  @TryCatch
  async deleteDetail(detailId: string, user_id: string, tenant_id: string): Promise<Result<any>> {
    this.logger.debug({ function: 'deleteDetail', detailId, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const existingDetail = await prisma.tb_stock_in_detail.findFirst({
      where: { id: detailId, deleted_at: null },
      include: { tb_stock_in: true },
    });

    if (!existingDetail) {
      return Result.error('Stock In Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_stock_in?.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot delete detail of non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    await prisma.tb_stock_in_detail.update({
      where: { id: detailId },
      data: {
        deleted_at: new Date(),
        deleted_by_id: user_id,
      },
    });

    return Result.ok({ id: detailId });
  }

  // ==================== Standalone Stock In Detail API ====================

  @TryCatch
  async findAllDetails(user_id: string, tenant_id: string, paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug({ function: 'findAllDetails', user_id, tenant_id, paginate }, StockInService.name);

    const defaultSearchFields = ['product_name', 'product_local_name', 'location_name', 'description'];

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

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const detailList = await prisma.tb_stock_in_detail.findMany({
      ...q.findMany(),
      where: {
        ...q.where(),
        deleted_at: null,
      },
      select: {
        id: true,
        stock_in_id: true,
        sequence_no: true,
        product_id: true,
        product_name: true,
        product_local_name: true,
        location_id: true,
        location_code: true,
        location_name: true,
        description: true,
        qty: true,
        cost_per_unit: true,
        total_cost: true,
        note: true,
        info: true,
        dimension: true,
        created_at: true,
        updated_at: true,
        tb_stock_in: {
          select: {
            id: true,
            si_no: true,
            doc_status: true,
          },
        },
      },
    });

    const total = await prisma.tb_stock_in_detail.count({
      where: {
        ...q.where(),
        deleted_at: null,
      },
    });

    return Result.ok({
      data: detailList,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  @TryCatch
  async createStandaloneDetail(
    data: IStockInDetailCreate & { stock_in_id: string },
    user_id: string,
    tenant_id: string,
  ): Promise<Result<any>> {
    this.logger.debug({ function: 'createStandaloneDetail', data, user_id, tenant_id }, StockInService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Validate stock_in exists
    const stockIn = await prisma.tb_stock_in.findFirst({
      where: { id: data.stock_in_id, deleted_at: null },
    });

    if (!stockIn) {
      return Result.error('Stock In not found', ErrorCode.NOT_FOUND);
    }

    if (stockIn.doc_status !== enum_doc_status.draft) {
      return Result.error('Cannot add detail to non-draft Stock In', ErrorCode.INVALID_ARGUMENT);
    }

    // Validate product
    if (data.product_id) {
      const product = await prisma.tb_product.findFirst({
        where: { id: data.product_id },
      });
      if (!product) {
        return Result.error('Product not found', ErrorCode.NOT_FOUND);
      }
      data.product_name = product.name;
      data.product_local_name = product.local_name;
    }

    // Validate location
    if (data.location_id) {
      const location = await prisma.tb_location.findFirst({
        where: { id: data.location_id },
      });
      if (!location) {
        return Result.error('Location not found', ErrorCode.NOT_FOUND);
      }
      data.location_code = location.code;
      data.location_name = location.name;
    }

    const maxSequence = await prisma.tb_stock_in_detail.aggregate({
      where: { stock_in_id: data.stock_in_id, deleted_at: null },
      _max: { sequence_no: true },
    });
    const nextSequence = (maxSequence._max.sequence_no || 0) + 1;

    const detail = await prisma.tb_stock_in_detail.create({
      data: {
        stock_in_id: data.stock_in_id,
        sequence_no: nextSequence,
        created_by_id: user_id,
        product_id: data.product_id || '',
        location_id: data.location_id || null,
        product_name: data.product_name || null,
        product_local_name: data.product_local_name || null,
        location_code: data.location_code || null,
        location_name: data.location_name || null,
        description: data.description || null,
        qty: data.qty || 0,
        cost_per_unit: data.cost_per_unit || 0,
        total_cost: data.total_cost || 0,
        note: data.note || null,
        info: data.info || null,
        dimension: data.dimension || null,
      },
    });

    return Result.ok(detail);
  }
}
