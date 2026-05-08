import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UnitConversionService } from './unit-conversion.service';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';


@Controller()
export class UnitConversionController extends BaseMicroserviceController {
  constructor(private readonly unitConversionService: UnitConversionService) {
    super();
  }

  private createAuditContext(data: MicroservicePayload): AuditContext {
    return {
      tenant_id: data.bu_code,
      user_id: data.user_id,
      request_id: data.request_id,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
    };
  }

  /**
   * Get order units by product ID
   * ดึงหน่วยสั่งซื้อตาม ID ของสินค้า
   * @param data - Payload containing product ID / ข้อมูล payload ที่มี ID ของสินค้า
   * @returns List of order units for the product / รายการหน่วยสั่งซื้อของสินค้า
   */
  @MessagePattern({ cmd: 'unit.get-order-unit-by-product-id', service: 'unit-conversion' })
  async getUnitByProductId(@Payload() data: { productId: string, bu_code: string, user_id: string, version?: string }): Promise<MicroserviceResponse> {
    this.unitConversionService.userId = data.user_id;
    this.unitConversionService.bu_code = data.bu_code;
    await this.unitConversionService.initializePrismaService(data.bu_code, data.user_id);

    const auditContext = this.createAuditContext(data);
    const result = await runWithAuditContext(auditContext, () => this.unitConversionService.getOrderUnitByProductId(data.productId));
    return this.handleResult(result);
  }

  /**
   * Get ingredient units by product ID
   * ดึงหน่วยส่วนผสมตาม ID ของสินค้า
   * @param data - Payload containing product ID / ข้อมูล payload ที่มี ID ของสินค้า
   * @returns List of ingredient units for the product / รายการหน่วยส่วนผสมของสินค้า
   */
  @MessagePattern({ cmd: 'unit.get-ingredient-unit-by-product-id', service: 'unit-conversion' })
  async getIngredientUnitByProductId(@Payload() data: { productId: string, bu_code: string, user_id: string, version?: string }): Promise<MicroserviceResponse> {
    this.unitConversionService.userId = data.user_id;
    this.unitConversionService.bu_code = data.bu_code;
    await this.unitConversionService.initializePrismaService(data.bu_code, data.user_id);

    const auditContext = this.createAuditContext(data);
    const result = await runWithAuditContext(auditContext, () => this.unitConversionService.getIngredientUnitByProductId(data.productId));
    return this.handleResult(result);
  }

  /**
   * Get available units by product ID
   * ดึงหน่วยที่ใช้ได้ตาม ID ของสินค้า
   * @param data - Payload containing product ID / ข้อมูล payload ที่มี ID ของสินค้า
   * @returns List of available units for the product / รายการหน่วยที่ใช้ได้ของสินค้า
   */
  @MessagePattern({ cmd: 'unit.get-available-unit-by-product-id', service: 'unit-conversion' })
  async getAvailableUnitByProductId(@Payload() data: { productId: string, bu_code: string, user_id: string, version?: string }): Promise<MicroserviceResponse> {
    this.unitConversionService.userId = data.user_id;
    this.unitConversionService.bu_code = data.bu_code;
    await this.unitConversionService.initializePrismaService(data.bu_code, data.user_id);

    const auditContext = this.createAuditContext(data);
    const result = await runWithAuditContext(auditContext, () => this.unitConversionService.getAvailableUnitByProductId(data.productId));
    return this.handleResult(result);
  }
}
