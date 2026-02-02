import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UnitConversionService } from './unit-conversion.service';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';


@Controller()
export class UnitConversionController extends BaseMicroserviceController {
  constructor(private readonly unitConversionService: UnitConversionService) {
    super();
  }

  private createAuditContext(data: any): AuditContext {
    return {
      tenant_id: data.bu_code,
      user_id: data.user_id,
      request_id: data.request_id,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
    };
  }

  @MessagePattern({ cmd: 'unit.get-order-unit-by-product-id', service: 'unit-conversion' })
  async getUnitByProductId(@Payload() data: { productId: string, bu_code: string, user_id: string, version?: string }): Promise<any> {
    this.unitConversionService.userId = data.user_id;
    this.unitConversionService.bu_code = data.bu_code;
    await this.unitConversionService.initializePrismaService(data.bu_code, data.user_id);

    const auditContext = this.createAuditContext(data);
    const result = await runWithAuditContext(auditContext, () => this.unitConversionService.getOrderUnitByProductId(data.productId));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'unit.get-ingredient-unit-by-product-id', service: 'unit-conversion' })
  async getIngredientUnitByProductId(@Payload() data: { productId: string, bu_code: string, user_id: string, version?: string }): Promise<any> {
    this.unitConversionService.userId = data.user_id;
    this.unitConversionService.bu_code = data.bu_code;
    await this.unitConversionService.initializePrismaService(data.bu_code, data.user_id);

    const auditContext = this.createAuditContext(data);
    const result = await runWithAuditContext(auditContext, () => this.unitConversionService.getIngredientUnitByProductId(data.productId));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'unit.get-available-unit-by-product-id', service: 'unit-conversion' })
  async getAvailableUnitByProductId(@Payload() data: { productId: string, bu_code: string, user_id: string, version?: string }): Promise<any> {
    this.unitConversionService.userId = data.user_id;
    this.unitConversionService.bu_code = data.bu_code;
    await this.unitConversionService.initializePrismaService(data.bu_code, data.user_id);

    const auditContext = this.createAuditContext(data);
    const result = await runWithAuditContext(auditContext, () => this.unitConversionService.getAvailableUnitByProductId(data.productId));
    return this.handleResult(result);
  }
}
