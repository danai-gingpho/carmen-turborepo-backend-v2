import { Controller, HttpStatus } from '@nestjs/common';
import { VendorBusinessTypeService } from './vendor_business_type.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class VendorBusinessTypeController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorBusinessTypeController.name,
  );
  constructor(
    private readonly vendorBusinessTypeService: VendorBusinessTypeService,
  ) {
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

  @MessagePattern({
    cmd: 'vendor-business-type.findOne',
    service: 'vendor-business-type',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findOne', payload },
      VendorBusinessTypeController.name,
    );
    const id = payload.id;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'vendor-business-type.findAll',
    service: 'vendor-business-type',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAll', payload },
      VendorBusinessTypeController.name,
    );
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'vendor-business-type.create',
    service: 'vendor-business-type',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      VendorBusinessTypeController.name,
    );
    const data = payload.data;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'vendor-business-type.update',
    service: 'vendor-business-type',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload },
      VendorBusinessTypeController.name,
    );
    const data = payload.data;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'vendor-business-type.delete',
    service: 'vendor-business-type',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      VendorBusinessTypeController.name,
    );
    const id = payload.id;
    this.vendorBusinessTypeService.userId = payload.user_id;
    this.vendorBusinessTypeService.bu_code = payload.bu_code;
    await this.vendorBusinessTypeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.vendorBusinessTypeService.delete(id));
    return this.handleResult(result);
  }
}
