import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TransferService } from './transfer.service';
import { ITransferCreate, ITransferUpdate } from './interface/transfer.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class TransferController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(TransferController.name);

  constructor(private readonly transferService: TransferService) {
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

  @MessagePattern({ cmd: 'transfer.findOne', service: 'transfer' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, TransferController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.findOne(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'transfer.findAll', service: 'transfer' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, TransferController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.findAll(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'transfer.create', service: 'transfer' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, TransferController.name);
    const data: ITransferCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.create(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'transfer.update', service: 'transfer' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, TransferController.name);
    const data: ITransferUpdate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.update(data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'transfer.delete', service: 'transfer' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, TransferController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.delete(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Transfer Detail CRUD ====================

  @MessagePattern({ cmd: 'transfer-detail.find-by-id', service: 'transfer' })
  async getDetailById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailById', payload }, TransferController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'transfer-detail.find-all', service: 'transfer' })
  async getDetailsByTransferId(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailsByTransferId', payload }, TransferController.name);
    const transferId = payload.transfer_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.findDetailsByTransferId(transferId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'transfer-detail.create', service: 'transfer' })
  async createDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createDetail', payload }, TransferController.name);
    const transferId = payload.transfer_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.createDetail(transferId, data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'transfer-detail.update', service: 'transfer' })
  async updateDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateDetail', payload }, TransferController.name);
    const detailId = payload.detail_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.updateDetail(detailId, data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'transfer-detail.delete', service: 'transfer' })
  async deleteDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteDetail', payload }, TransferController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Standalone Transfer Detail API ====================

  @MessagePattern({ cmd: 'transfer-detail.findAll', service: 'transfer-detail' })
  async findAllDetails(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllDetails', payload }, TransferController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.findAllDetails(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'transfer-detail.findOne', service: 'transfer-detail' })
  async findOneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOneDetail', payload }, TransferController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'transfer-detail.createStandalone', service: 'transfer-detail' })
  async createStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createStandaloneDetail', payload }, TransferController.name);
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.createStandaloneDetail(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'transfer-detail.updateStandalone', service: 'transfer-detail' })
  async updateStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateStandaloneDetail', payload }, TransferController.name);
    const detailId = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.updateDetail(detailId, { id: detailId, ...data }, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'transfer-detail.deleteStandalone', service: 'transfer-detail' })
  async deleteStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteStandaloneDetail', payload }, TransferController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.transferService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }
}
