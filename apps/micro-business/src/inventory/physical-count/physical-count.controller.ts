import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PhysicalCountService } from './physical-count.service';
import {
  IPhysicalCountCreate,
  IPhysicalCountSave,
  IPhysicalCountSubmit,
  IPhysicalCountDetailCommentCreate,
  IPhysicalCountDetailCommentUpdate,
} from './interface/physical-count.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class PhysicalCountController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PhysicalCountController.name);

  constructor(private readonly physicalCountService: PhysicalCountService) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'physical-count.findOne', service: 'physical-count' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count.findAll', service: 'physical-count' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, PhysicalCountController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const location_ids: string[] = payload.location_ids || [];
    const period_id: string | undefined = payload.period_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findAll(user_id, tenant_id, paginate, location_ids, period_id),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'physical-count.create', service: 'physical-count' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, PhysicalCountController.name);
    const data: IPhysicalCountCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'physical-count.save', service: 'physical-count' })
  async save(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'save', payload }, PhysicalCountController.name);
    const data: IPhysicalCountSave = { id: payload.id, ...payload.data };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.save(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count.submit', service: 'physical-count' })
  async submit(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'submit', payload }, PhysicalCountController.name);
    const data: IPhysicalCountSubmit = { id: payload.id };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.submit(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count.delete', service: 'physical-count' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  // ==================== Detail Comment Endpoints ====================

  @MessagePattern({ cmd: 'physical-count-detail-comment.findAll', service: 'physical-count' })
  async findDetailComments(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findDetailComments', payload }, PhysicalCountController.name);
    const physical_count_detail_id = payload.physical_count_detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.findDetailComments(physical_count_detail_id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count-detail-comment.create', service: 'physical-count' })
  async createDetailComment(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createDetailComment', payload }, PhysicalCountController.name);
    const data: IPhysicalCountDetailCommentCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.createDetailComment(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'physical-count-detail-comment.update', service: 'physical-count' })
  async updateDetailComment(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateDetailComment', payload }, PhysicalCountController.name);
    const data: IPhysicalCountDetailCommentUpdate = { id: payload.id, ...payload.data };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.updateDetailComment(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'physical-count-detail-comment.delete', service: 'physical-count' })
  async deleteDetailComment(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteDetailComment', payload }, PhysicalCountController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountService.deleteDetailComment(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
