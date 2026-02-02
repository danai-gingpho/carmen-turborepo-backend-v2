import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/common/libs/paginate.query';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import {
  Result,
  ErrorCode,
  createPriceListTemplateCreateValidation,
  createPriceListTemplateUpdateValidation,
  createPriceListTemplateDetailCreateValidation,
  PriceListTemplateDetailResponseSchema,
  PriceListTemplateListItemResponseSchema,
} from '@/common';

@Injectable()
export class PriceListTemplateService {
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
    PriceListTemplateService.name,
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

  async findOne(id: string): Promise<any> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      PriceListTemplateService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const priceListTemplate = await this.prismaService.tb_pricelist_template
      .findFirst({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
          validity_period: true,
          created_at: true,
          updated_at: true,
          vendor_instructions: true,
          tb_currency: {
            select: {
              id: true,
              code: true,
            },
          },
          tb_pricelist_template_detail: {
            select: {
              id: true,
              product_id: true,
              product_name: true,
              doc_version: true,
              order_unit_obj: true,
              tb_product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  tb_unit_conversion: {
                    select: {
                      id: true,
                      from_unit_id: true,
                      to_unit_id: true,
                      to_unit_name: true,
                      from_unit_name: true,
                      info: true,
                      dimension: true,
                    },
                    where: {
                      is_active: true,
                      is_default: true,
                      unit_type: 'order_unit',
                    },
                  }
                },
              },
            },
          },
        },
      })
      .then((res) => {
        if (!res) return null;
        return {
          id: res.id,
          name: res.name,
          description: res.description,
          status: res.status,
          validity_period: res.validity_period,
          vendor_instructions: res.vendor_instructions,
          created_at: res.created_at,
          updated_at: res.updated_at,
          currency: res.tb_currency,
          products: res.tb_pricelist_template_detail.map((item) => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.tb_product.code,
            doc_version: item.doc_version,
            default_order: {
              unit_id: res.tb_pricelist_template_detail[0].tb_product.tb_unit_conversion[0]?.from_unit_id || null,
              unit_name: res.tb_pricelist_template_detail[0].tb_product.tb_unit_conversion[0]?.from_unit_name || null,
            },
            moq: item.order_unit_obj,
          })),
        };
      });

    if (!priceListTemplate) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Price list template not found',
        },
      };
    }

    const serializedPriceListTemplate = PriceListTemplateDetailResponseSchema.parse(priceListTemplate);
    return {
      data: serializedPriceListTemplate,
      response: {
        status: HttpStatus.OK,
        message: 'Price list template retrieved successfully',
      },
    };
  }

  async findAll(paginate: IPaginate): Promise<any> {
    try {
      this.logger.debug(
        { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
        PriceListTemplateService.name,
      );
      const defaultSearchFields = ['name', 'description'];

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

      // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);
      const pagination = getPaginationParams(q.page, q.perpage);
      const selectClause = {
        id: true,
        name: true,
        description: true,
        note: true,
        status: true,
        validity_period: true,
        vendor_instructions: true,
        created_at: true,
        updated_at: true,
        tb_currency: {
          select: {
            id: true,
            code: true,
          },
        },
        tb_pricelist_template_detail: {
          select: {
            id: true,
            product_id: true,
            product_name: true,
            order_unit_obj: true,
            tb_product: {
              select: {
                id: true,
                name: true,
                code: true,
                tb_unit_conversion: {
                  select: {
                    id: true,
                    from_unit_id: true,
                    to_unit_id: true,
                    to_unit_name: true,
                    from_unit_name: true,
                    info: true,
                    dimension: true,
                  },
                  where: {
                    is_active: true,
                    is_default: true,
                    unit_type: { equals: 'order_unit' as any },
                  },
                },
              },
            },
          },
        },
      };

      const data = await this.prismaService.tb_pricelist_template.findMany({
        select: selectClause,
        where: q.where(),
        orderBy: q.orderBy(),
        ...pagination,
      });

      const total = await this.prismaService.tb_pricelist_template.count({ where: q.where() });

      const priceListTemplates = data.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        note: item.note,
        status: item.status,
        currency: item.tb_currency,
        validity_period: item.validity_period,
        vendor_instructions: item.vendor_instructions,
        created_at: item.created_at,
        updated_at: item.updated_at,
        products: item.tb_pricelist_template_detail.map((detail) => ({
          id: detail.id,
          product_id: detail.product_id,
          product_name: detail.tb_product.name,
          code: detail.tb_product.code,
          default_order: {
            unit_id: detail.tb_product.tb_unit_conversion[0]?.from_unit_id || null,
            unit_name: detail.tb_product.tb_unit_conversion[0]?.from_unit_name || null,
          },
          moq: detail.order_unit_obj,
        })),
      }));

      const serializedPriceListTemplates = priceListTemplates.map((item) => PriceListTemplateListItemResponseSchema.parse(item));
      return {
        paginate: {
          total: total,
          page: q.perpage < 0 ? 1 : q.page,
          perpage: q.perpage < 0 ? 1 : q.perpage,
          pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
        },
        data: serializedPriceListTemplates,
        response: {
          status: HttpStatus.OK,
          message: 'Price list templates retrieved successfully',
        },
      };
    } catch (error) {
      console.error('Error in findAll:', error);
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An error occurred while retrieving price list templates',
        },
      };
    }
  }

  async create(data: any): Promise<any> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      PriceListTemplateService.name,
    );

    this.logger.log(
      `create price-list-template ${JSON.stringify(data)} ${this.userId} ${this.bu_code}`,
    );

    // Validate using factory function
    const validationSchema = createPriceListTemplateCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return {
        response: {
          status: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors,
        },
      };
    }

    // Get currency name for denormalization
    if (data.currency_id) {
      const currency = await this.prismaService.tb_currency.findFirst({
        where: { id: data.currency_id },
        select: { name: true },
      });
      data.currency_name = currency?.name;
    }

    // Validate and get product names for template details
    if (data.products?.add && Array.isArray(data.products.add)) {
      for (const detail of data.products.add) {
        if (detail.product_id) {
          const detailValidation = createPriceListTemplateDetailCreateValidation(this.prismaService);
          const detailResult = await detailValidation.safeParseAsync(detail);
          if (!detailResult.success) {
            return {
              response: {
                status: HttpStatus.BAD_REQUEST,
                message: `Validation failed for product: ${detail.product_id}`,
                errors: detailResult.error.issues,
              },
            };
          }
          const product = await this.prismaService.tb_product.findFirst({
            where: { id: detail.product_id },
            select: { name: true },
          });
          detail.product_name = product?.name;
        }
      }
    }

    const priceListTemplate = await this.prismaService.tb_pricelist_template.create({
      data: {
        name: data.name,
        description: data.description,
        note: data.note,
        status: data.status || 'draft',
        currency_id: data.currency_id,
        currency_name: data.currency_name,
        validity_period: data.validity_period,
        vendor_instructions: data.vendor_instructions,
        send_reminders: data.send_reminders,
        reminder_days: data.reminder_days,
        escalation_after_days: data.escalation_after_days,
        info: data.info,
        dimension: data.dimension,
        created_by_id: this.userId,
        tb_pricelist_template_detail: data.products
          ? {
            create: data.products.add.map((detail: any, index: number) => ({
              product_id: detail.product_id,
              product_name: detail.product_name,
              sequence_no: detail.sequence_no || index + 1,
              order_unit_obj: detail.moq || [],
              info: detail.info,
              dimension: detail.dimension,
              created_by_id: this.userId,
            })),
          }
          : undefined,
      },
    });
    return {
      data: { id: priceListTemplate.id },
      response: {
        status: HttpStatus.CREATED,
        message: 'Price list template created successfully',
      },
    };
  }

  async update(data: any): Promise<any> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      PriceListTemplateService.name,
    );

    // Validate using factory function
    const validationSchema = createPriceListTemplateUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return {
        response: {
          status: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors,
        },
      };
    }

    const templateId = typeof data.id === 'object' ? data.id.id : data.id;

    const currentTemplate = await this.prismaService.tb_pricelist_template.findFirst({
      where: { id: templateId },
    });

    if (!currentTemplate) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Price list template not found',
        },
      };
    }

    // Get currency name for denormalization
    if (data.currency_id) {
      const currency = await this.prismaService.tb_currency.findFirst({
        where: { id: data.currency_id },
        select: { name: true },
      });
      data.currency_name = currency?.name;
    }

    const updatedTemplate = await this.prismaService.tb_pricelist_template.update({
      where: { id: templateId },
      data: {
        name: data.name,
        description: data.description,
        note: data.note,
        status: data.status,
        currency_id: data.currency_id,
        currency_name: data.currency_name,
        validity_period: data.validity_period,
        vendor_instructions: data.vendor_instructions,
        send_reminders: data.send_reminders,
        reminder_days: data.reminder_days,
        escalation_after_days: data.escalation_after_days,
        info: data.info,
        dimension: data.dimension,
        updated_by_id: this.userId,
      },
    });

    if ('add' in data.products) {
      for (const detail of data.products.add) {
        if (detail.product_id) {
          // Validate detail using factory function
          const detailValidation = createPriceListTemplateDetailCreateValidation(this.prismaService);
          const detailResult = await detailValidation.safeParseAsync(detail);
          if (!detailResult.success) {
            return {
              response: {
                status: HttpStatus.BAD_REQUEST,
                message: `Validation failed for product: ${detail.product_id}`,
                errors: detailResult.error.issues,
              },
            };
          }
          const product = await this.prismaService.tb_product.findFirst({
            where: { id: detail.product_id },
            select: { name: true },
          });
          detail.product_name = product?.name;
        }

        await this.prismaService.tb_pricelist_template_detail.create({
          data: {
            pricelist_template_id: updatedTemplate.id,
            product_id: detail.product_id,
            product_name: detail.product_name,
            sequence_no: detail.sequence_no,
            order_unit_obj: detail.moq || [],
            info: detail.info,
            dimension: detail.dimension,
            created_by_id: this.userId,
          }
        })
      }
    }
    if ('remove' in data.products) {
      for (const detailId of data.products.remove) {
        const id = typeof detailId === 'object' ? detailId.id : detailId;
        // console.log('delete detail id', id);
        const detail = await this.prismaService.tb_pricelist_template_detail.findFirst({
          where: { id: id },
        });
        if (detail) await this.prismaService.tb_pricelist_template_detail.delete({ where: { id: detail.id } })
      }
    }

    if ('update' in data.products) {
      for (const detail of data.products.update) {
        const detailId = typeof detail.id === 'object' ? detail.id.id : detail.id;
        await this.prismaService.tb_pricelist_template_detail.update({
          where: { id: detailId },
          data: {
            product_id: detail.product_id,
            product_name: detail.product_name,
            sequence_no: detail.sequence_no,
            order_unit_obj: detail.moq || [],
            info: detail.info,
            dimension: detail.dimension,
            updated_by_id: this.userId,
            updated_at: new Date().toISOString(),
          }
        })
      }
    }

    return {
      data: { id: updatedTemplate.id },
      response: {
        status: HttpStatus.OK,
        message: 'Price list template updated successfully',
      },
    };
  }

  async remove(id: string): Promise<any> {
    this.logger.debug(
      { function: 'remove', id, user_id: this.userId, tenant_id: this.bu_code },
      PriceListTemplateService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const currentTemplate = await this.prismaService.tb_pricelist_template.findFirst({
      where: { id: id },
    });

    if (!currentTemplate) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Price list template not found',
        },
      };
    }

    await this.prismaService.tb_pricelist_template_detail.updateMany({
      where: { pricelist_template_id: id },
      data: {
        deleted_by_id: this.userId,
      },
    });

    const priceListTemplate = await this.prismaService.tb_pricelist_template.update({
      where: { id: id },
      data: {
        status: 'inactive',
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return {
      data: { id: priceListTemplate.id },
      response: {
        status: HttpStatus.OK,
        message: 'Price list template deleted successfully',
      },
    };
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<any> {
    this.logger.debug(
      { function: 'updateStatus', id, status, user_id: this.userId, tenant_id: this.bu_code },
      PriceListTemplateService.name,
    );

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);
    const updatedTemplate = await this.prismaService.tb_pricelist_template.update({
      where: { id: id },
      data: {
        status: status as any,
        updated_by_id: this.userId,
      },
    });

    return {
      data: { id: updatedTemplate.id, status: updatedTemplate.status },
      response: {
        status: HttpStatus.OK,
        message: 'Price list template status updated successfully',
      },
    };
  }
}