import { BackendLogger } from "@/common/helpers/backend.logger";
import { resolveConversionDecimalPlace, resolveUnitDecimalPlace } from "./utils/decimal-place.util";
import { TenantService } from "@/tenant/tenant.service";
import { HttpStatus, Injectable, HttpException } from "@nestjs/common";
import { isUUID } from "class-validator";
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from "@/common/constant";
import { PrismaClient } from "@repo/prisma-shared-schema-tenant";
import {
  TryCatch,
  Result,
  ErrorCode,
  UnitConversionListResponseSchema,
  UnitConversionItemResponseSchema,
} from "@/common";

@Injectable()
export class UnitConversionService {
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

  /**
   * Initialize the Prisma service for the tenant
   * เริ่มต้นบริการ Prisma สำหรับผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / รหัสผู้ใช้
   */
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

  private readonly logger: BackendLogger = new BackendLogger(UnitConversionService.name);

  constructor(private readonly tenantService: TenantService) {}

  /**
   * Get order unit conversions for a product by its ID
   * ค้นหาหน่วยแปลงสำหรับการสั่งซื้อตามรหัสสินค้า
   * @param productId - Product ID / รหัสสินค้า
   * @returns List of order unit conversions / รายการหน่วยแปลงสำหรับการสั่งซื้อ
   */
  @TryCatch
  async getOrderUnitByProductId(productId: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: "findAll", user_id: this.userId, tenant_id: this.bu_code, productId },
      "getOrderUnitByProductId",
    );

    const units = await this.prismaService.tb_unit_conversion
      .findMany({
        include: {
          tb_product: {
            include: {
              tb_unit: true,
            },
          },
          tb_unit_tb_unit_conversion_from_unit_idTotb_unit: true,
          tb_unit_tb_unit_conversion_to_unit_idTotb_unit: true,
        },
        where: {
          product_id: productId,
          unit_type: "order_unit",
          is_active: true,
        },
      })
      .then(async (res) => {
        if (res?.length === 0) {
          const product = await this.prismaService.tb_product.findFirst({
            where: {
              id: productId,
            },
            include: {
              tb_unit: true,
            },
          });

          return [
            {
              id: product.inventory_unit_id,
              name: product.tb_unit?.name ?? product.inventory_unit_name,
              conversion: 1,
              decimal_place: resolveUnitDecimalPlace({ unit: product.tb_unit }),
            },
          ];
        }
        const newData = [];

        newData.push({
          id: res[0].tb_product.inventory_unit_id,
          name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
          conversion: 1,
          decimal_place: resolveUnitDecimalPlace({ unit: res[0].tb_product.tb_unit }),
        });

        res.forEach((item) => {
          newData.push({
            id: item.from_unit_id,
            name: item.tb_unit_tb_unit_conversion_from_unit_idTotb_unit?.name ?? item.from_unit_name,
            conversion: Number(item.to_unit_qty),
            decimal_place: resolveConversionDecimalPlace({
              conversion: item,
              fallbackUnit: item.tb_unit_tb_unit_conversion_from_unit_idTotb_unit,
            }),
          });
        });

        const deduped = Array.from(
          new Map(newData.map((item) => [item.id, item])).values(),
        );

        return deduped.sort((a, b) => a.name.localeCompare(b.name));
      });

    const serializedUnits = units.map((item) => UnitConversionItemResponseSchema.parse(item));
    return Result.ok(serializedUnits);
  }

  /**
   * Get ingredient unit conversions for a product by its ID
   * ค้นหาหน่วยแปลงสำหรับส่วนผสมตามรหัสสินค้า
   * @param productId - Product ID / รหัสสินค้า
   * @returns List of ingredient unit conversions / รายการหน่วยแปลงสำหรับส่วนผสม
   */
  @TryCatch
  async getIngredientUnitByProductId(productId: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: "findAll", user_id: this.userId, tenant_id: this.bu_code, productId },
      "getIngredientUnitByProductId",
    );

    const units = await this.prismaService.tb_unit_conversion
      .findMany({
        include: {
          tb_product: {
            include: {
              tb_unit: true,
            },
          },
          tb_unit_tb_unit_conversion_from_unit_idTotb_unit: true,
          tb_unit_tb_unit_conversion_to_unit_idTotb_unit: true,
        },
        where: {
          product_id: productId,
          unit_type: "ingredient_unit",
          is_active: true,
        },
      })
      .then(async (res) => {
        if (res?.length === 0) {
          const product = await this.prismaService.tb_product.findFirst({
            where: {
              id: productId,
            },
            include: {
              tb_unit: true,
            },
          });

          return [
            {
              id: product.inventory_unit_id,
              name: product.tb_unit?.name ?? product.inventory_unit_name,
              conversion: 1,
              decimal_place: resolveUnitDecimalPlace({ unit: product.tb_unit }),
            },
          ];
        }
        const newData = [];

        newData.push({
          id: res[0].tb_product.inventory_unit_id,
          name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
          conversion: 1,
          decimal_place: resolveUnitDecimalPlace({ unit: res[0].tb_product.tb_unit }),
        });

        res.forEach((item) => {
          newData.push({
            id: item.to_unit_id,
            name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
            conversion: Number(item.to_unit_qty),
            decimal_place: resolveConversionDecimalPlace({
              conversion: item,
              fallbackUnit: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit,
            }),
          });
        });

        const deduped = Array.from(
          new Map(newData.map((item) => [item.id, item])).values(),
        );

        return deduped.sort((a, b) => a.name.localeCompare(b.name));
      });

    const serializedUnits = units.map((item) => UnitConversionItemResponseSchema.parse(item));
    return Result.ok(serializedUnits);
  }

  /**
   * Get all available unit conversions (order + ingredient) for a product by its ID
   * ค้นหาหน่วยแปลงทั้งหมดที่ใช้ได้ (สั่งซื้อ + ส่วนผสม) ตามรหัสสินค้า
   * @param productId - Product ID / รหัสสินค้า
   * @returns List of all available unit conversions / รายการหน่วยแปลงทั้งหมดที่ใช้ได้
   */
  @TryCatch
  async getAvailableUnitByProductId(productId: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: "findAll", user_id: this.userId, tenant_id: this.bu_code, productId },
      "getAvailableUnitByProductId",
    );

    const units = await this.prismaService.tb_unit_conversion
      .findMany({
        include: {
          tb_product: {
            include: {
              tb_unit: true,
            },
          },
          tb_unit_tb_unit_conversion_from_unit_idTotb_unit: true,
          tb_unit_tb_unit_conversion_to_unit_idTotb_unit: true,
        },
        where: {
          product_id: productId,
          unit_type: {
            in: ["order_unit", "ingredient_unit"],
          },
          is_active: true,
        },
      })
      .then(async (res) => {
        if (res?.length === 0) {
          /* case product no have unit conversion */
          const product = await this.prismaService.tb_product.findFirst({
            where: {
              id: productId,
            },
            include: {
              tb_unit: true,
            },
          });

          return [
            {
              id: product?.inventory_unit_id,
              name: product?.tb_unit?.name ?? product?.inventory_unit_name,
              conversion: 1,
              decimal_place: resolveUnitDecimalPlace({ unit: product?.tb_unit }),
            },
          ];
        }

        /* case product have unit conversion */
        const newData = [];

        /* push inventory unit */
        newData.push({
          id: res[0].tb_product.inventory_unit_id,
          name: res[0].tb_product.tb_unit?.name ?? res[0].tb_product.inventory_unit_name,
          conversion: 1,
          decimal_place: resolveUnitDecimalPlace({ unit: res[0].tb_product.tb_unit }),
        });

        /* push ingredient unit and order unit */

        this.logger.debug({ res }, "res");

        res.forEach((item) => {
          switch (item.unit_type) {
            case "ingredient_unit":
              newData.push({
                id: item.to_unit_id,
                name: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit?.name ?? item.to_unit_name,
                conversion: 1 / Number(item.to_unit_qty),
                decimal_place: resolveConversionDecimalPlace({
                  conversion: item,
                  fallbackUnit: item.tb_unit_tb_unit_conversion_to_unit_idTotb_unit,
                }),
              });
              break;

            case "order_unit":
              newData.push({
                id: item.from_unit_id,
                name: item.tb_unit_tb_unit_conversion_from_unit_idTotb_unit?.name ?? item.from_unit_name,
                conversion: Number(item.to_unit_qty),
                decimal_place: resolveConversionDecimalPlace({
                  conversion: item,
                  fallbackUnit: item.tb_unit_tb_unit_conversion_from_unit_idTotb_unit,
                }),
              });
              break;
          }
        });

        const deduped = Array.from(new Map(newData.map((item) => [item.id, item])).values());

        return deduped.sort((a, b) => a.name.localeCompare(b.name));
      });

    const serializedUnits = units.map((item) => UnitConversionItemResponseSchema.parse(item));
    return Result.ok(serializedUnits);
  }
}
