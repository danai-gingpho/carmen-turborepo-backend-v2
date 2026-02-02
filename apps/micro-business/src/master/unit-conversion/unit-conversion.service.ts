import { BackendLogger } from '@/common/helpers/backend.logger';
import { TenantService } from '@/tenant/tenant.service';
import { HttpStatus, Injectable, HttpException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ERROR_MISSING_BU_CODE, ERROR_MISSING_TENANT_ID, ERROR_MISSING_USER_ID } from '@/common/constant';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import {
  TryCatch,
  Result,
  ErrorCode,
  UnitConversionListResponseSchema,
  UnitConversionItemResponseSchema,
} from '@/common';

@Injectable()
export class UnitConversionService {
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

  private readonly logger: BackendLogger = new BackendLogger(
    UnitConversionService.name,
  );

  constructor(
    private readonly tenantService: TenantService,
  ) { }

  @TryCatch
  async getOrderUnitByProductId(productId: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, productId },
      'getOrderUnitByProductId',
    );

    const units = await this.prismaService.tb_unit_conversion.findMany({
      include: {
        tb_product: {
          where: {
            id: productId,
          }
        }
      },
      where: {
        product_id: productId,
        unit_type: 'order_unit',
        is_active: true,
      },
    }).then(async (res) => {
      if (res?.length === 0) {
        const product = await this.prismaService.tb_product.findFirst({
          where: {
            id: productId,
          },
          select: {
            inventory_unit_id: true,
            inventory_unit_name: true,
          }
        })

        return [
          {
            id: product.inventory_unit_id,
            name: product.inventory_unit_name,
            conversion: 1
          }
        ]
      }
      const newData = []

      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.inventory_unit_name,
        conversion: 1
      })

      res.forEach((item) => {
        newData.push({
          id: item.from_unit_id,
          name: item.from_unit_name,
          conversion: Number(item.to_unit_qty)
        });
      });

      return newData.sort((a, b) => a.name.localeCompare(b.name))
    })

    console.log('what is be', units)

    const serializedUnits = units.map((item) => UnitConversionItemResponseSchema.parse(item));
    return Result.ok(serializedUnits);
  }

  @TryCatch
  async getIngredientUnitByProductId(productId: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, productId },
      'getIngredientUnitByProductId',
    );

    const units = await this.prismaService.tb_unit_conversion.findMany({
      include: {
        tb_product: {
          where: {
            id: productId,
          }
        }
      },
      where: {
        product_id: productId,
        unit_type: 'ingredient_unit',
        is_active: true,
      },
    }).then(async (res) => {
      if (res?.length === 0) {
        const product = await this.prismaService.tb_product.findFirst({
          where: {
            id: productId,
          },
          select: {
            inventory_unit_id: true,
            inventory_unit_name: true,
          }
        })

        return [
          {
            id: product.inventory_unit_id,
            name: product.inventory_unit_name,
            conversion: 1
          }
        ]
      }
      const newData = []

      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.inventory_unit_name,
        conversion: 1
      })

      res.forEach((item) => {
        newData.push({
          id: item.to_unit_id,
          name: item.to_unit_name,
          conversion: Number(item.to_unit_qty)
        });
      });

      return newData.sort((a, b) => a.name.localeCompare(b.name))
    })

    const serializedUnits = units.map((item) => UnitConversionListResponseSchema.parse(item));
    return Result.ok(serializedUnits);
  }

  @TryCatch
  async getAvailableUnitByProductId(productId: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, productId },
      'getAvailableUnitByProductId',
    );

    const units = await this.prismaService.tb_unit_conversion.findMany({
      include: {
        tb_product: {
          where: {
            id: productId,
          }
        }
      },
      where: {
        product_id: productId,
        unit_type: {
          in: ['order_unit', 'ingredient_unit']
        },
        is_active: true,
      },
    }).then(async (res) => {
      if (res?.length === 0) {
        const product = await this.prismaService.tb_product.findFirst({
          where: {
            id: productId,
          },
          select: {
            inventory_unit_id: true,
            inventory_unit_name: true,
          }
        })

        return [
          {
            id: product?.inventory_unit_id,
            name: product?.inventory_unit_name,
            conversion: 1
          }
        ]
      }
      const newData = []

      newData.push({
        id: res[0].tb_product.inventory_unit_id,
        name: res[0].tb_product.inventory_unit_name,
        conversion: 1
      })

      res.forEach((item) => {
        if (item.unit_type === 'ingredient_unit') {
          newData.push({
            id: item.to_unit_id,
            name: item.to_unit_name,
            conversion: 1 / Number(item.to_unit_qty)
          });
        } else if (item.unit_type === 'order_unit') {
          newData.push({
            id: item.to_unit_id,
            name: item.to_unit_name,
            conversion: Number(item.from_unit_qty)
          });
        }
      })

      return newData.sort((a, b) => a.name.localeCompare(b.name))
    })

    const serializedUnits = units.map((item) => UnitConversionListResponseSchema.parse(item));
    return Result.ok(serializedUnits);
  }
}
