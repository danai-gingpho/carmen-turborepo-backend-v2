import { Controller, HttpStatus } from '@nestjs/common';
import { DeliveryPointService } from './delivery-point.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class DeliveryPointController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    DeliveryPointController.name,
  );
  constructor(private readonly deliveryPointService: DeliveryPointService) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'delivery-point.findOne', service: 'delivery-point' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, DeliveryPointController.name);
    const id = payload.id;
    this.deliveryPointService.userId = payload.user_id;
    this.deliveryPointService.bu_code = payload.bu_code;
    await this.deliveryPointService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.deliveryPointService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'delivery-point.findAll', service: 'delivery-point' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, DeliveryPointController.name);
    this.deliveryPointService.userId = payload.user_id;
    this.deliveryPointService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.deliveryPointService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.deliveryPointService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'delivery-point.find-all-by-id', service: 'delivery-point' })
  async findAllById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllById', payload }, DeliveryPointController.name);
    const ids = payload.ids;
    this.deliveryPointService.userId = payload.user_id;
    this.deliveryPointService.bu_code = payload.bu_code;
    await this.deliveryPointService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.deliveryPointService.findAllById(ids));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'delivery-point.create', service: 'delivery-point' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, DeliveryPointController.name);
    const data = payload.data;
    this.deliveryPointService.userId = payload.user_id;
    this.deliveryPointService.bu_code = payload.bu_code;
    await this.deliveryPointService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.deliveryPointService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'delivery-point.update', service: 'delivery-point' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, DeliveryPointController.name);
    const data = payload.data;
    this.deliveryPointService.userId = payload.user_id;
    this.deliveryPointService.bu_code = payload.bu_code;
    await this.deliveryPointService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.deliveryPointService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'delivery-point.delete', service: 'delivery-point' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      DeliveryPointController.name,
    );
    const id = payload.id;
    this.deliveryPointService.userId = payload.user_id;
    this.deliveryPointService.bu_code = payload.bu_code;
    await this.deliveryPointService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.deliveryPointService.delete(id));
    return this.handleResult(result);
  }
}
