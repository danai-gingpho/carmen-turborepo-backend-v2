import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StockInService } from './stock-in.service';
import { IStockInCreate, IStockInUpdate } from './interface/stock-in.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class StockInController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(StockInController.name);

  constructor(private readonly stockInService: StockInService) {
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

  @MessagePattern({ cmd: 'stock-in.findOne', service: 'stock-in' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, StockInController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findOne(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in.findAll', service: 'stock-in' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, StockInController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findAll(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'stock-in.create', service: 'stock-in' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, StockInController.name);
    const data: IStockInCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.create(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'stock-in.update', service: 'stock-in' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, StockInController.name);
    const data: IStockInUpdate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.update(data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in.delete', service: 'stock-in' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, StockInController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.delete(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Stock In Detail CRUD ====================

  @MessagePattern({ cmd: 'stock-in-detail.find-by-id', service: 'stock-in' })
  async getDetailById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailById', payload }, StockInController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in-detail.find-all', service: 'stock-in' })
  async getDetailsByStockInId(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailsByStockInId', payload }, StockInController.name);
    const stockInId = payload.stock_in_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findDetailsByStockInId(stockInId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in-detail.create', service: 'stock-in' })
  async createDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createDetail', payload }, StockInController.name);
    const stockInId = payload.stock_in_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.createDetail(stockInId, data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'stock-in-detail.update', service: 'stock-in' })
  async updateDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateDetail', payload }, StockInController.name);
    const detailId = payload.detail_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.updateDetail(detailId, data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in-detail.delete', service: 'stock-in' })
  async deleteDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteDetail', payload }, StockInController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Standalone Stock In Detail API ====================

  @MessagePattern({ cmd: 'stock-in-detail.findAll', service: 'stock-in-detail' })
  async findAllDetails(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllDetails', payload }, StockInController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findAllDetails(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'stock-in-detail.findOne', service: 'stock-in-detail' })
  async findOneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOneDetail', payload }, StockInController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in-detail.createStandalone', service: 'stock-in-detail' })
  async createStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createStandaloneDetail', payload }, StockInController.name);
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.createStandaloneDetail(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'stock-in-detail.updateStandalone', service: 'stock-in-detail' })
  async updateStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateStandaloneDetail', payload }, StockInController.name);
    const detailId = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.updateDetail(detailId, { id: detailId, ...data }, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-in-detail.deleteStandalone', service: 'stock-in-detail' })
  async deleteStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteStandaloneDetail', payload }, StockInController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockInService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }
}
