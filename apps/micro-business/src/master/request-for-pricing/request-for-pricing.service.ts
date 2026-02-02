import { HttpStatus, Injectable, HttpException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TenantService } from '@/tenant/tenant.service';
import QueryParams from '@/common/libs/paginate.query';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_USER_ID } from '@/common/constant';
import order from '@/common/helpers/order_by';
import getPaginationParams from '@/common/helpers/pagination.params';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import * as crypto from 'crypto';
import {
  TryCatch,
  Result,
  ErrorCode,
  RequestForPricingDetailResponseSchema,
  RequestForPricingListItemResponseSchema,
} from '@/common';

@Injectable()
export class RequestForPricingService {
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
    RequestForPricingService.name,
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
    private readonly jwtService: JwtService,
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
  ) { }

  private generatePassword(length: number = 8): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  generateVendorToken(payload: {
    bu: string;
    vendor_id: string;
    rfp_detail_id: string;
    password: string;
  }): string {
    return this.jwtService.sign(payload);
  }

  async verifyVendorToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
    }
  }

  private generateUrlToken(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    return result;
  }

  async insertVendorPricelist(data: {
    token: string;
    expired_at: Date;
    receiver_email?: string;
    url_token: string,
  }): Promise<{ url_token: string; id: string }> {
    this.logger.debug(
      { function: 'insertVendorPricelist', receiver_email: data.receiver_email },
      RequestForPricingService.name,
    );
    // const url_token = this.generateUrlToken();
    const vendorPricelist = await this.prismaSystem.tb_shot_url.create({
      data: {
        app_method: 'rfp_create',
        url_token: data.url_token,
        token: data.token,
        expired_at: data.expired_at,
        receiver_email: data.receiver_email ? data.receiver_email : '',
      },
    });

    return {
      url_token: 'vendorPricelist.url_token',
      id: 'vendorPricelist.id',
    };
  }

  @TryCatch
  async findOne(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findOne', id, user_id: this.userId, tenant_id: this.bu_code },
      RequestForPricingService.name,
    );

    const requestForPricing = await this.prismaService.tb_request_for_pricing
      .findFirst({
        where: {
          id: id,
        },
        select: {
          id: true,
          name: true,
          pricelist_template_id: true,
          start_date: true,
          end_date: true,
          custom_message: true,
          email_template_id: true,
          info: true,
          dimension: true,
          doc_version: true,
          created_at: true,
          updated_at: true,
          tb_pricelist_template: {
            select: {
              id: true,
              name: true,
              status: true,
              currency_id: true,
              currency_name: true,
              validity_period: true,
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
                  order_unit_obj: true,
                  tb_product: {
                    select: {
                      id: true,
                      name: true,
                      code: true,
                    },
                  },
                },
              },
            },
          },
          tb_request_for_pricing_detail: {
            where: {},
            select: {
              id: true,
              sequence_no: true,
              vendor_id: true,
              vendor_name: true,
              contact_person: true,
              contact_phone: true,
              contact_email: true,
              pricelist_id: true,
              pricelist_no: true,
              info: true,
              dimension: true,
              doc_version: true,
              pricelist_url_token: true,
              tb_vendor: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              tb_pricelist: {
                select: {
                  id: true,
                  pricelist_no: true,
                  name: true,
                  status: true,
                },
              },
            },
            orderBy: {
              sequence_no: 'asc',
            },
          },
        },
      })
      .then((res) => {
        if (!res) return null;
        return {
          id: res.id,
          name: res.name,
          start_date: res.start_date,
          end_date: res.end_date,
          custom_message: res.custom_message,
          email_template_id: res.email_template_id,
          info: res.info,
          dimension: res.dimension,
          doc_version: res.doc_version,
          created_at: res.created_at,
          updated_at: res.updated_at,
          pricelist_template: res.tb_pricelist_template
            ? {
              id: res.tb_pricelist_template.id,
              name: res.tb_pricelist_template.name,
              status: res.tb_pricelist_template.status,
              validity_period: res.tb_pricelist_template.validity_period,
              vendor_instructions: res.tb_pricelist_template.vendor_instructions,
              currency: res.tb_pricelist_template.tb_currency,
              products: res.tb_pricelist_template.tb_pricelist_template_detail.map((item) => ({
                id: item.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.tb_product?.code,
                moq: item.order_unit_obj,
              })),
            }
            : null,
          vendors: res.tb_request_for_pricing_detail.map((detail) => ({
            id: detail.id,
            sequence_no: detail.sequence_no,
            vendor_id: detail.vendor_id,
            vendor_name: detail.vendor_name,
            vendor_code: detail.tb_vendor?.code,
            contact_person: detail.contact_person,
            contact_phone: detail.contact_phone,
            contact_email: detail.contact_email,
            url_token: detail.pricelist_url_token,
            pricelist: detail.tb_pricelist
              ? {
                id: detail.tb_pricelist.id,
                no: detail.tb_pricelist.pricelist_no,
                name: detail.tb_pricelist.name,
                status: detail.tb_pricelist.status,
              }
              : null,
            info: detail.info,
            dimension: detail.dimension,
            doc_version: detail.doc_version,
          })),
        };
      });

    if (!requestForPricing) {
      return Result.error('Request for pricing not found', ErrorCode.NOT_FOUND);
    }

    const serializedRequestForPricing = RequestForPricingDetailResponseSchema.parse(requestForPricing);
    return Result.ok(serializedRequestForPricing);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      RequestForPricingService.name,
    );
    const defaultSearchFields = ['name', 'custom_message'];

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
    const selectClause = {
      id: true,
      name: true,
      pricelist_template_id: true,
      start_date: true,
      end_date: true,
      custom_message: true,
      email_template_id: true,
      info: true,
      dimension: true,
      doc_version: true,
      created_at: true,
      updated_at: true,
      tb_pricelist_template: {
        select: {
          id: true,
          name: true,
          status: true,
          tb_currency: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
      tb_request_for_pricing_detail: {
        where: {},
        select: {
          id: true,
          vendor_id: true,
          vendor_name: true,
          pricelist_id: true,
          // pricelist_url_token: true,
          tb_vendor: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    };

    const data = await this.prismaService.tb_request_for_pricing.findMany({
      select: selectClause,
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_request_for_pricing.count({ where: q.where() });

    const requestForPricings = data.map((item) => ({
      id: item.id,
      name: item.name,
      start_date: item.start_date.toISOString(),
      end_date: item.end_date.toISOString(),
      custom_message: item.custom_message,
      email_template_id: item.email_template_id,
      info: item.info,
      dimension: item.dimension,
      doc_version: item.doc_version,
      created_at: item.created_at,
      updated_at: item.updated_at,
      pricelist_template: item.tb_pricelist_template
        ? {
          id: item.tb_pricelist_template.id,
          name: item.tb_pricelist_template.name,
          status: item.tb_pricelist_template.status,
          currency: item.tb_pricelist_template.tb_currency,
        }
        : null,
      vendor_count: item.tb_request_for_pricing_detail.length,
      vendors: item.tb_request_for_pricing_detail.map((detail) => ({
        id: detail.id,
        vendor_id: detail.vendor_id,
        vendor_name: detail.vendor_name,
        vendor_code: detail.tb_vendor?.code,
        has_submitted: !!detail.pricelist_id,
        // url_token: detail.pricelist_url_token
      })),
    }));

    const serializedRequestForPricings = requestForPricings.map((item) => RequestForPricingListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedRequestForPricings,
    });
  }

  @TryCatch
  async create(data: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      RequestForPricingService.name,
    );

    this.logger.log(
      `create request-for-pricing ${JSON.stringify(data)} ${this.userId} ${this.bu_code}`,
    );


    const startDate = typeof data.start_date === 'string' && data.start_date ? new Date(data.start_date) : null;
    const endDate = typeof data.end_date === 'string' && data.end_date ? new Date(data.end_date) : null;

    if (data.pricelist_template_id) {
      const template = await this.prismaService.tb_pricelist_template.findFirst({
        where: { id: data.pricelist_template_id },
      });

      if (!template) {
        return Result.error('Price list template not found', ErrorCode.INVALID_ARGUMENT);
      }
    } else {
      return Result.error('Price list template ID is required', ErrorCode.INVALID_ARGUMENT);
    }

    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      if (startDate > endDate) {
        return Result.error('Start date must be before end date', ErrorCode.INVALID_ARGUMENT);
      }
    }

    const requestForPricing = await this.prismaService.tb_request_for_pricing.create({
      data: {
        name: data.name,
        pricelist_template_id: data.pricelist_template_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        custom_message: data.custom_message,
        email_template_id: data.email_template_id || null,
        info: data.info || {},
        dimension: data.dimension || {},
        created_by_id: this.userId,
      },
    });

    const vendorTokens: Array<{
      vendor_id: string;
      rfp_detail_id: string;
      password: string;
      token: string;
      url_token: string;
    }> = [];

    if (data.vendors.add && Array.isArray(data.vendors.add)) {
      for (let index = 0; index < data.vendors.add.length; index++) {
        const vendor = data.vendors.add[index];
        const password = this.generatePassword(8);
        const url_token = this.generateUrlToken();
        const rfpDetail = await this.prismaService.tb_request_for_pricing_detail.create({
          data: {
            request_for_pricing_id: requestForPricing.id,
            vendor_id: vendor.vendor_id,
            vendor_name: vendor.vendor_name,
            sequence_no: vendor.sequence_no || index + 1,
            contact_person: vendor.contact_person,
            contact_phone: vendor.contact_phone,
            contact_email: vendor.contact_email,
            dimension: vendor.dimension,
            created_by_id: this.userId,
            pricelist_url_token: url_token
          },
        });

        const tokenPayload = {
          bu: this.bu_code,
          vendor_id: vendor.vendor_id,
          rfp_detail_id: rfpDetail.id,
          password: password,
        };

        const token = this.generateVendorToken(tokenPayload);
        const VP = await this.insertVendorPricelist({
          token: token,
          expired_at: endDate,
          receiver_email: vendor.receiver_email,
          url_token: url_token
        })
        vendorTokens.push({
          vendor_id: vendor.vendor_id,
          rfp_detail_id: rfpDetail.id,
          password: password,
          token: token,
          url_token: VP.url_token,
        });
      }
    }

    return Result.ok({
      id: requestForPricing.id,
      vendor_tokens: vendorTokens,
    });
  }

  @TryCatch
  async update(data: any): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      RequestForPricingService.name,
    );

    const requestId = typeof data.id === 'object' ? data.id.id : data.id;

    const currentRequest = await this.prismaService.tb_request_for_pricing.findFirst({
      where: { id: requestId },
    });

    if (!currentRequest) {
      return Result.error('Request for pricing not found', ErrorCode.NOT_FOUND);
    }

    // Validate pricelist template if being updated
    if (data.pricelist_template_id) {
      const template = await this.prismaService.tb_pricelist_template.findFirst({
        where: { id: data.pricelist_template_id },
      });

      if (!template) {
        return Result.error('Price list template not found', ErrorCode.INVALID_ARGUMENT);
      }
    }

    // Validate date range
    const startDate = data.start_date ? new Date(data.start_date) : currentRequest.start_date;
    const endDate = data.end_date ? new Date(data.end_date) : currentRequest.end_date;
    if (startDate && endDate && startDate >= endDate) {
      return Result.error('Start date must be before end date', ErrorCode.INVALID_ARGUMENT);
    }

    const updatedRequest = await this.prismaService.tb_request_for_pricing.update({
      where: { id: requestId },
      data: {
        name: data.name,
        pricelist_template_id: data.pricelist_template_id,
        start_date: new Date(data.start_date).toISOString(),
        end_date: new Date(data.end_date).toISOString(),
        custom_message: data.custom_message,
        email_template_id: data.email_template_id,
        info: data.info,
        dimension: data.dimension,
        updated_by_id: this.userId,
      },
    });

    // Handle vendor details updates
    if (data.vendors) {
      if (data.vendors.add && Array.isArray(data.vendors.add)) {
        for (const vendor of data.vendors.add) {
          // Validate vendor exists
          const vendorRecord = await this.prismaService.tb_vendor.findFirst({
            where: { id: vendor.vendor_id },
          });

          if (!vendorRecord) {
            continue; // Skip invalid vendors
          }

          await this.prismaService.tb_request_for_pricing_detail.create({
            data: {
              request_for_pricing_id: updatedRequest.id,
              vendor_id: vendor.vendor_id,
              vendor_name: vendorRecord.name,
              sequence_no: vendor.sequence_no,
              contact_person: vendor.contact_person,
              contact_phone: vendor.contact_phone,
              contact_email: vendor.contact_email,
              info: vendor.info,
              dimension: vendor.dimension,
              created_by_id: this.userId,
            },
          });
        }
      }

      if (data.vendors.remove && Array.isArray(data.vendors.remove)) {
        for (const detailId of data.vendors.remove) {
          const id = typeof detailId === 'object' ? detailId.id : detailId;
          const detail = await this.prismaService.tb_request_for_pricing_detail.findFirst({
            where: { id: id },
          });
          if (detail) {
            await this.prismaService.tb_request_for_pricing_detail.update({
              where: { id: detail.id },
              data: {
                deleted_at: new Date().toISOString(),
                deleted_by_id: this.userId,
              },
            });
          }
        }
      }

      if (data.vendors.update && Array.isArray(data.vendors.update)) {
        for (const vendor of data.vendors.update) {
          const detailId = typeof vendor.id === 'object' ? vendor.id.id : vendor.id;
          await this.prismaService.tb_request_for_pricing_detail.update({
            where: { id: detailId },
            data: {
              vendor_id: vendor.vendor_id,
              vendor_name: vendor.vendor_name,
              sequence_no: vendor.sequence_no,
              contact_person: vendor.contact_person,
              contact_phone: vendor.contact_phone,
              contact_email: vendor.contact_email,
              info: vendor.info,
              dimension: vendor.dimension,
              updated_by_id: this.userId,
              updated_at: new Date().toISOString(),
            },
          });
        }
      }
    }

    return Result.ok({ id: updatedRequest.id });
  }

  @TryCatch
  async remove(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'remove', id, user_id: this.userId, tenant_id: this.bu_code },
      RequestForPricingService.name,
    );

    const currentRequest = await this.prismaService.tb_request_for_pricing.findFirst({
      where: { id: id },
    });

    if (!currentRequest) {
      return Result.error('Request for pricing not found', ErrorCode.NOT_FOUND);
    }

    // Soft delete all details
    await this.prismaService.tb_request_for_pricing_detail.updateMany({
      where: { request_for_pricing_id: id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    // Soft delete the main record
    const requestForPricing = await this.prismaService.tb_request_for_pricing.update({
      where: { id: id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: requestForPricing.id });
  }
}
