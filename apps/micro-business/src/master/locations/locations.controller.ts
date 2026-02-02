import { Controller, HttpStatus } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class LocationsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    LocationsController.name,
  );
  constructor(private readonly locationsService: LocationsService) {
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

  @MessagePattern({ cmd: 'locations.findOne', service: 'locations' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, LocationsController.name);
    const id = payload.id;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    const withUser = payload?.withUser || false;
    const withProducts = payload?.withProducts || false;
    const version = payload?.version || 'latest';
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findOne(id, withUser, withProducts, version),
    );

    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'locations.find-many-by-id', service: 'locations' })
  async findManyById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findManyById', payload }, LocationsController.name);
    const ids = payload.ids;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findManyById(ids, version),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'locations.findAll', service: 'locations' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, LocationsController.name);
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findAll(payload.bu_code, paginate, version),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'locations.findAllByUser', service: 'locations' })
  async findAllByUser(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllByUser', payload }, LocationsController.name);
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findAllByUser(version),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'locations-product.getProductInventory', service: 'locations-product-inventory' })
  async getProductInventory(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getProductInventory', payload }, LocationsController.name);
    const location_id = payload.location_id;
    const product_id = payload.product_id;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.getProductInventory(location_id, product_id, version),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'locations.create', service: 'locations' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, LocationsController.name);
    const data = payload.data;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.create(data, version),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'locations.update', service: 'locations' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, LocationsController.name);
    const data = payload.data;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.update(data, version),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'locations.delete', service: 'locations' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, LocationsController.name);
    const id = payload.id;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.delete(id, version),
    );
    return this.handleResult(result);
  }
}
