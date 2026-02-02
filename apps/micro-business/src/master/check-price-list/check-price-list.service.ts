import {
  HttpStatus,
  Injectable,
  HttpException
} from '@nestjs/common';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { TenantService } from '@/tenant/tenant.service';
import { getPattern, GenerateCode } from '@/common/helpers/running-code.helper';
import { RUNNING_CODE_PRESET } from '@/master/running-code/const/running-code.const';
import { format } from 'date-fns';
import { TryCatch, Result, ErrorCode } from '@/common';

@Injectable()
export class CheckPriceListService {
  private readonly logger: BackendLogger = new BackendLogger(
    CheckPriceListService.name,
  );

  async initializePrismaService(bu_code: string, application: string): Promise<void> {
    this._prismaService = await this.tenantService.getdb_connection_for_external(bu_code, application);
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
  async checkPriceList(urlToken: string, decodedToken: any): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'checkPriceList',
        url_token: urlToken,
        decodedToken,
      },
      CheckPriceListService.name,
    );

    if (!decodedToken) {
      this.logger.warn({ url_token: urlToken }, 'decodedToken not provided');
      return Result.error('Invalid token', ErrorCode.UNAUTHENTICATED);
    }

    await this.initializePrismaService(decodedToken.bu, 'Vendor update price list')
    const pricing = await this.prismaService.tb_request_for_pricing_detail.findFirst({
      where: {
        id: decodedToken.rfp_detail_id,
        // pricelist_id: { not: null }
      },
      select: {
        id: true,
        pricelist_id: true,
        tb_request_for_pricing: {
          select: {
            id: true,
            pricelist_template_id: true,
            start_date: true,
            end_date: true
          }
        }
      }
    })

    if (pricing.pricelist_id === null) {
      const pricelistTemplateId = pricing.tb_request_for_pricing?.pricelist_template_id;

      if (!pricelistTemplateId) {
        return Result.error('Pricelist template not found', ErrorCode.NOT_FOUND);
      }

      const pricelistTemplate = await this.prismaService.tb_pricelist_template.findFirst({
        where: {
          id: pricelistTemplateId,
        },
        select: {
          id: true,
          name: true,
          currency_id: true,
          currency_name: true,
          validity_period: true,
          tb_pricelist_template_detail: {
            where: {},
            select: {
              id: true,
              sequence_no: true,
              product_id: true,
              product_name: true,
              inventory_unit_id: true,
              inventory_unit_name: true,
            },
          },
        },
      });

      if (!pricelistTemplate) {
        return Result.error('Pricelist template not found', ErrorCode.NOT_FOUND);
      }

      const pricelistNo = await this.generatePLNo(new Date().toISOString(), decodedToken.bu);
      const effectiveFromDate = new Date();
      const effectiveToDate = new Date();
      if (pricelistTemplate.validity_period) {
        effectiveToDate.setDate(effectiveToDate.getDate() + pricelistTemplate.validity_period);
      } else {
        effectiveToDate.setFullYear(effectiveToDate.getFullYear() + 1);
      }

      const pricelistDetails = await Promise.all(
        pricelistTemplate.tb_pricelist_template_detail.map(async (detail, index) => ({
          sequence_no: detail.sequence_no ?? index + 1,
          product_id: detail.product_id,
          product_name: detail.product_name,
          unit_id: detail.inventory_unit_id,
          unit_name: detail.inventory_unit_name,
          moq_qty: 0,
          price_without_tax: 0,
          tax_amt: 0,
          price: 0,
          is_active: true,
          tax_profile_id: await this.get_tax_profile(detail.product_id),
        }))
      );

      const newPricelist = await this.prismaService.tb_pricelist.create({
        data: {
          pricelist_no: pricelistNo,
          name: pricelistTemplate.name,
          status: 'draft',
          url_token: urlToken,
          currency_id: pricelistTemplate.currency_id,
          currency_name: pricelistTemplate.currency_name,
          effective_from_date: pricing.tb_request_for_pricing.start_date,
          effective_to_date: pricing.tb_request_for_pricing.end_date,
          tb_pricelist_detail: {
            create: pricelistDetails,
          },
        },
      });

      await this.prismaService.tb_request_for_pricing_detail.update({
        where: {
          id: decodedToken.rfp_detail_id,
        },
        data: {
          pricelist_id: newPricelist.id,
          pricelist_no: newPricelist.pricelist_no,
          pricelist_url_token: urlToken,
        },
      });

      const createdPricelist = await this.prismaService.tb_pricelist.findFirst({
        where: {
          id: newPricelist.id,
        },
        select: {
          id: true,
          pricelist_no: true,
          name: true,
          status: true,
          vendor_id: true,
          vendor_name: true,
          currency_id: true,
          currency_name: true,
          effective_from_date: true,
          effective_to_date: true,
          description: true,
          note: true,
          tb_pricelist_detail: {
            where: {},
            select: {
              id: true,
              sequence_no: true,
              product_id: true,
              product_name: true,
              unit_id: true,
              unit_name: true,
              moq_qty: true,
              price_without_tax: true,
              tax_amt: true,
              price: true,
              tax_profile_id: true,
              tax_profile_name: true,
              tax_rate: true,
              lead_time_days: true,
              is_active: true,
              note: true,
            },
          },
        },
      });

      return Result.ok(createdPricelist);
    }

    // else - pricelist_id is not null, get existing pricelist with details
    const existingPricelist = await this.prismaService.tb_pricelist.findFirst({
      where: {
        id: pricing.pricelist_id,
      },
      select: {
        id: true,
        pricelist_no: true,
        name: true,
        status: true,
        vendor_id: true,
        vendor_name: true,
        currency_id: true,
        currency_name: true,
        effective_from_date: true,
        effective_to_date: true,
        description: true,
        note: true,
        tb_pricelist_detail: {
          where: {},
          select: {
            id: true,
            sequence_no: true,
            product_id: true,
            product_name: true,
            unit_id: true,
            unit_name: true,
            moq_qty: true,
            price_without_tax: true,
            tax_amt: true,
            price: true,
            tax_profile_id: true,
            tax_profile_name: true,
            tax_rate: true,
            lead_time_days: true,
            is_active: true,
            note: true,
          },
        },
      },
    });

    return Result.ok(existingPricelist);
  }

  private async generatePLNo(PLDate: string, bu_code: string): Promise<string> {
    this.logger.debug(
      { function: 'generatePLNo', PLDate, bu_code },
      CheckPriceListService.name,
    );

    const pattern = await this.getRunningPattern('PL');
    const prPatterns = getPattern(pattern);

    let datePattern: any;
    let runningPattern: any;
    prPatterns.forEach((p) => {
      if (p.type === 'date') {
        datePattern = p;
      } else if (p.type === 'running') {
        runningPattern = p;
      }
    });

    const getDate = new Date(PLDate);
    const datePatternValue = format(getDate, datePattern.pattern);

    const latestPL = await this.prismaService.tb_pricelist.findFirst({
      where: {
        pricelist_no: {
          contains: datePatternValue,
        },
      },
      orderBy: {
        pricelist_no: 'desc',
      },
    });

    const latestPLNumber = latestPL
      ? Number((latestPL.pricelist_no as string).slice(-Number(runningPattern.pattern)))
      : 0;

    const runningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: { type: { contains: 'PL', mode: 'insensitive' } },
    });

    const PLNo = GenerateCode(runningCode.config, getDate, latestPLNumber);

    return PLNo;
  }

  private async getRunningPattern(type: string): Promise<any> {
    this.logger.debug(
      { function: 'getRunningPattern', type },
      CheckPriceListService.name,
    );

    let runningCode = await this.prismaService.tb_config_running_code.findFirst({
      where: { type },
    });

    if (!runningCode) {
      const defaultConfig = RUNNING_CODE_PRESET[type]?.config || {
        A: type,
        B: `date('yyyyMM')`,
        C: `running(5, '0')`,
        format: '{A}{B}{C}',
      };

      runningCode = await this.prismaService.tb_config_running_code.create({
        data: {
          type,
          config: defaultConfig,
          note: 'initialized by system default.',
        },
      });
    }

    return runningCode.config;
  }

  async get_tax_profile(product_id: string) {
    const product = await this.prismaService.tb_product.findFirst({ where: { id: product_id } })
    return product.tax_profile_id ? product.tax_profile_id : null
  }
}
