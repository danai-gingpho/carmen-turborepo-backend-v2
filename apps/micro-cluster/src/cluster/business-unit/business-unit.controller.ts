import { Controller, HttpStatus } from '@nestjs/common';
import { BusinessUnitService } from './business-unit.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IBusinessUnitCreate,
  IBusinessUnitUpdate,
} from './interface/business-unit.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class BusinessUnitController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    BusinessUnitController.name,
  );
  constructor(private readonly businessUnitService: BusinessUnitService) {
    super();
  }

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'business-unit.create', service: 'business-unit' })
  async createBusinessUnit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'createBusinessUnit', payload: payload },
      BusinessUnitController.name,
    );
    const createBusinessUnit: IBusinessUnitCreate = {
      ...payload.data,
    };
    const user_id = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.businessUnitService.createBusinessUnit(
        createBusinessUnit,
        user_id,
      )
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'business-unit.update', service: 'business-unit' })
  async updateBusinessUnit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'updateBusinessUnit', payload: payload },
      BusinessUnitController.name,
    );
    const updateBusinessUnit: IBusinessUnitUpdate = {
      ...payload.data,
    };
    const user_id = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.businessUnitService.updateBusinessUnit(
        updateBusinessUnit,
        user_id,
      )
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'business-unit.delete', service: 'business-unit' })
  async deleteBusinessUnit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'deleteBusinessUnit', payload: payload },
      BusinessUnitController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.deleteBusinessUnit(id, user_id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'business-unit.list', service: 'business-unit' })
  async listBusinessUnit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'listBusinessUnit', payload: payload },
      BusinessUnitController.name,
    );
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.listBusinessUnit(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'business-unit.get-by-id', service: 'business-unit' })
  async getBusinessUnitById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getBusinessUnitById', payload: payload },
      BusinessUnitController.name,
    );
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.getBusinessUnitById(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'business-unit.get-by-user-id',
    service: 'business-unit',
  })
  async getBusinessUnitByUserId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getBusinessUnitByUserId', payload: payload },
      BusinessUnitController.name,
    );
    const user_id = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.getBusinessUnitByUserId(user_id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'business-unit.set-default-tenant',
    service: 'business-unit',
  })
  async setDefaultTenant(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'setDefaultTenant', payload: payload },
      BusinessUnitController.name,
    );
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.setDefaultTenant(user_id, tenant_id));
    return this.handleResult(result);
  }

  // User Business Unit

  @MessagePattern({
    cmd: 'user-business-unit.findOne',
    service: 'business-unit',
  })
  async userBusinessUnitFindOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'userBusinessUnitFindOne', payload: payload },
      BusinessUnitController.name,
    );
    const { id } = payload;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.userBusinessUnitFindOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'user-business-unit.findAll',
    service: 'business-unit',
  })
  async userBusinessUnitFindAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'userBusinessUnitFindAll', payload: payload },
      BusinessUnitController.name,
    );
    const { paginate } = payload;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.userBusinessUnitFindAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'user-business-unit.create',
    service: 'business-unit',
  })
  async userBusinessUnitCreate(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'userBusinessUnitCreate', payload: payload },
      BusinessUnitController.name,
    );
    const { data, user_id } = payload;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.userBusinessUnitCreate(data, user_id));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'user-business-unit.update',
    service: 'business-unit',
  })
  async userBusinessUnitUpdate(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'userBusinessUnitUpdate', payload: payload },
      BusinessUnitController.name,
    );
    const { data, user_id } = payload;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.userBusinessUnitUpdate(data, user_id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'user-business-unit.delete',
    service: 'business-unit',
  })
  async userBusinessUnitDelete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'userBusinessUnitDelete', payload: payload },
      BusinessUnitController.name,
    );
    const { id, user_id } = payload;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.businessUnitService.userBusinessUnitDelete(id, user_id));
    return this.handleResult(result);
  }

}
