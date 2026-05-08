import { HttpStatus, Injectable, HttpException, Inject } from "@nestjs/common";
import { TenantService } from "@/tenant/tenant.service";
import { ICreateExchangeRate, IUpdateExchangeRate } from "./interface/exchange-rate.interface";
import { IPaginate } from "@/common/shared-interface/paginate.interface";
import QueryParams from "@/common/libs/paginate.query";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { isUUID } from "class-validator";
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from "@/common/constant";
import order from "@/common/helpers/order_by";
import getPaginationParams from "@/common/helpers/pagination.params";
import { PrismaClient } from "@repo/prisma-shared-schema-tenant";
import { PrismaClient_SYSTEM } from "@repo/prisma-shared-schema-platform";
import {
  TryCatch,
  Result,
  ErrorCode,
  createExchangeRateCreateValidation,
  createExchangeRateUpdateValidation,
  ExchangeRateDetailResponseSchema,
  ExchangeRateListItemResponseSchema,
} from "@/common";

@Injectable()
export class ExchangeRateService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(ERROR_MISSING_BU_CODE, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(ERROR_MISSING_USER_ID, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;
  private readonly logger: BackendLogger = new BackendLogger(ExchangeRateService.name);

  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException("Prisma service is not initialized", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return this._prismaService;
  }

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Find a single exchange rate by ID
   * ค้นหารายการอัตราแลกเปลี่ยนเดียวตาม ID
   * @param id - Exchange rate ID / ID ของอัตราแลกเปลี่ยน
   * @returns Exchange rate detail or error if not found / รายละเอียดอัตราแลกเปลี่ยน หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async findOne(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: "findOne",
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const exchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        id: id,
      },
    });

    if (!exchangeRate) {
      return Result.error("Exchange rate not found", ErrorCode.NOT_FOUND);
    }

    const serializedExchangeRate = ExchangeRateDetailResponseSchema.parse(exchangeRate);
    return Result.ok(serializedExchangeRate);
  }

  /**
   * Find all exchange rates with pagination
   * ค้นหารายการอัตราแลกเปลี่ยนทั้งหมดพร้อมการแบ่งหน้า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of exchange rates / รายการอัตราแลกเปลี่ยนพร้อมการแบ่งหน้า
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: "findAll",
        user_id: this.userId,
        tenant_id: this.bu_code,
        paginate,
      },
      ExchangeRateService.name,
    );
    const defaultSearchFields = ["note"];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === "object" && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const pagination = getPaginationParams(q.page, q.perpage);
    const exchangeRates = await this.prismaService.tb_exchange_rate.findMany({
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination,
    });

    const total = await this.prismaService.tb_exchange_rate.count({
      where: q.where(),
    });

    const serializedExchangeRates = exchangeRates.map((item) => ExchangeRateListItemResponseSchema.parse(item));
    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedExchangeRates,
    });
  }

  /**
   * Find exchange rate by date and currency code
   * ค้นหาอัตราแลกเปลี่ยนตามวันที่และรหัสสกุลเงิน
   * @param date - Exchange rate date / วันที่ของอัตราแลกเปลี่ยน
   * @param currencyCode - Currency code (e.g. USD, THB) / รหัสสกุลเงิน
   * @returns Exchange rate detail or error if not found / รายละเอียดอัตราแลกเปลี่ยน หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async findByDateAndCurrency(date: string, currencyCode: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: "findByDateAndCurrency",
        date,
        currencyCode,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );

    // ตรวจสอบว่า currency_code ตรงกับ default currency ของ BU หรือไม่
    // ถ้าตรงกันให้คืนค่า exchange_rate = 1
    const businessUnit = await this.prismaSystem.tb_business_unit.findFirst({
      where: {
        code: this.bu_code,
      },
    });

    if (businessUnit?.default_currency_id) {
      const defaultCurrency = await this.prismaService.tb_currency.findFirst({
        where: {
          id: businessUnit.default_currency_id,
        },
      });

      if (defaultCurrency && defaultCurrency.code === currencyCode) {
        return Result.ok({
          at_date: date,
          currency_id: defaultCurrency.id,
          currency_code: defaultCurrency.code,
          currency_name: defaultCurrency.name,
          exchange_rate: 1,
        });
      }
    }

    // ค้นหาอัตราแลกเปลี่ยนที่ตรงวันที่ หรือล่าสุดที่เก่ากว่าวันที่ที่ระบุ
    const targetDate = new Date(date);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const exchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        currency_code: currencyCode,
        at_date: {
          lte: endOfDay,
        },
        deleted_at: null,
      },
      orderBy: {
        at_date: "desc",
      },
    });

    if (!exchangeRate) {
      return Result.error("Exchange rate not found for the given date and currency code", ErrorCode.NOT_FOUND);
    }

    return Result.ok({
      at_date: exchangeRate.at_date,
      currency_id: exchangeRate.currency_id,
      currency_code: exchangeRate.currency_code,
      currency_name: exchangeRate.currency_name,
      exchange_rate: exchangeRate.exchange_rate,
    });
  }

  /**
   * Create a new exchange rate
   * สร้างอัตราแลกเปลี่ยนใหม่
   * @param data - Exchange rate creation data / ข้อมูลการสร้างอัตราแลกเปลี่ยน
   * @returns Created exchange rate ID or error if duplicate / ID ของอัตราแลกเปลี่ยนที่สร้างขึ้น หรือข้อผิดพลาดหากซ้ำ
   */
  @TryCatch
  async create(data: ICreateExchangeRate): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: "create",
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );

    // Validate using factory function
    const validationSchema = createExchangeRateCreateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    // Business validation: check for duplicate
    const foundExchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        currency_id: data.currency_id,
        at_date: data.at_date,
      },
    });

    if (foundExchangeRate) {
      return Result.error("Exchange rate already exists", ErrorCode.ALREADY_EXISTS);
    }

    // ดึง currency_code และ currency_name จาก tb_currency ตาม currency_id
    const currency = await this.prismaService.tb_currency.findFirst({
      where: { id: data.currency_id },
    });

    if (!currency) {
      return Result.error("Currency not found", ErrorCode.NOT_FOUND);
    }

    const createExchangeRate = await this.prismaService.tb_exchange_rate.create({
      data: {
        ...data,
        currency_code: currency.code,
        currency_name: currency.name,
        created_by_id: this.userId,
      },
    });

    return Result.ok({ id: createExchangeRate.id });
  }

  /**
   * Create multiple exchange rates in bulk
   * สร้างอัตราแลกเปลี่ยนหลายรายการพร้อมกัน
   * @param items - Array of exchange rate creation data / อาร์เรย์ของข้อมูลสร้างอัตราแลกเปลี่ยน
   * @returns Array of created exchange rate IDs / อาร์เรย์ของ ID ที่สร้าง
   */
  @TryCatch
  async createBulk(items: ICreateExchangeRate[]): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: "createBulk",
        count: items.length,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );

    const validationSchema = createExchangeRateCreateValidation(this.prismaService);
    const createdIds: { id: string }[] = [];
    const skippedItems: { currency_id: string; at_date: string | Date; reason: string }[] = [];

    for (const data of items) {
      const validationResult = await validationSchema.safeParseAsync(data);
      if (!validationResult.success) {
        const errorMessages = validationResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
      }

      const foundExchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
        where: {
          currency_id: data.currency_id,
          at_date: data.at_date,
        },
      });

      if (foundExchangeRate) {
        skippedItems.push({ currency_id: data.currency_id, at_date: data.at_date, reason: "Already exists" });
        continue;
      }

      // ดึง currency_code และ currency_name จาก tb_currency ตาม currency_id
      const currency = await this.prismaService.tb_currency.findFirst({
        where: { id: data.currency_id },
      });

      if (!currency) {
        return Result.error(`Currency not found for currency_id: ${data.currency_id}`, ErrorCode.NOT_FOUND);
      }

      const created = await this.prismaService.tb_exchange_rate.create({
        data: {
          ...data,
          currency_code: currency.code,
          currency_name: currency.name,
          created_by_id: this.userId,
        },
      });

      createdIds.push({ id: created.id });
    }

    return Result.ok({ created: createdIds, skipped: skippedItems });
  }

  /**
   * Update an existing exchange rate
   * อัปเดตอัตราแลกเปลี่ยนที่มีอยู่
   * @param data - Exchange rate update data / ข้อมูลการอัปเดตอัตราแลกเปลี่ยน
   * @returns Updated exchange rate ID or error if not found / ID ของอัตราแลกเปลี่ยนที่อัปเดต หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async update(data: IUpdateExchangeRate): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: "update",
        data,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      ExchangeRateService.name,
    );

    // Validate using factory function
    const validationSchema = createExchangeRateUpdateValidation(this.prismaService);
    const validationResult = await validationSchema.safeParseAsync(data);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return Result.error(`Validation failed: ${errorMessages}`, ErrorCode.VALIDATION_FAILURE);
    }

    const exchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!exchangeRate) {
      return Result.error("Exchange rate not found", ErrorCode.NOT_FOUND);
    }

    const updateExchangeRate = await this.prismaService.tb_exchange_rate.update({
      where: {
        id: data.id,
      },
      data: {
        ...data,
        updated_by_id: this.userId,
        updated_at: new Date().toISOString(),
      },
    });

    return Result.ok({ id: updateExchangeRate.id });
  }

  /**
   * Delete an exchange rate (soft delete)
   * ลบอัตราแลกเปลี่ยน (ลบแบบซอฟต์)
   * @param id - Exchange rate ID / ID ของอัตราแลกเปลี่ยน
   * @returns Empty object on success or error if not found / อ็อบเจกต์ว่างเมื่อสำเร็จ หรือข้อผิดพลาดหากไม่พบ
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: "delete", id, user_id: this.userId, tenant_id: this.bu_code },
      ExchangeRateService.name,
    );
    // const prisma = await this.tenantService.prismaTenantInstance(this.bu_code, this.userId);

    const exchangeRate = await this.prismaService.tb_exchange_rate.findFirst({
      where: {
        id: id,
      },
    });

    if (!exchangeRate) {
      return Result.error("Exchange rate not found", ErrorCode.NOT_FOUND);
    }

    await this.prismaService.tb_exchange_rate.update({
      where: { id: id },
      data: {
        deleted_at: new Date().toISOString(),
        deleted_by_id: this.userId,
      },
    });

    // await prisma.tb_exchange_rate.update({
    //   where: { id: id },
    //   data: {
    //     // is_active: false,
    //     updated_by_id: this.userId,
    //   },
    // });

    return Result.ok({ id: id });
  }
}
