import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StockOutService } from './stock-out.service';
import { IStockOutCreate, IStockOutUpdate } from './interface/stock-out.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class StockOutController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(StockOutController.name);

  constructor(private readonly stockOutService: StockOutService) {
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

  @MessagePattern({ cmd: 'stock-out.findOne', service: 'stock-out' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, StockOutController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findOne(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out.findAll', service: 'stock-out' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, StockOutController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findAll(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'stock-out.create', service: 'stock-out' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, StockOutController.name);
    const data: IStockOutCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.create(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'stock-out.update', service: 'stock-out' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, StockOutController.name);
    const data: IStockOutUpdate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.update(data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out.delete', service: 'stock-out' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, StockOutController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.delete(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Stock Out Detail CRUD ====================

  @MessagePattern({ cmd: 'stock-out-detail.find-by-id', service: 'stock-out' })
  async getDetailById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailById', payload }, StockOutController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out-detail.find-all', service: 'stock-out' })
  async getDetailsByStockOutId(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailsByStockOutId', payload }, StockOutController.name);
    const stockOutId = payload.stock_out_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findDetailsByStockOutId(stockOutId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out-detail.create', service: 'stock-out' })
  async createDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createDetail', payload }, StockOutController.name);
    const stockOutId = payload.stock_out_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.createDetail(stockOutId, data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'stock-out-detail.update', service: 'stock-out' })
  async updateDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateDetail', payload }, StockOutController.name);
    const detailId = payload.detail_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.updateDetail(detailId, data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out-detail.delete', service: 'stock-out' })
  async deleteDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteDetail', payload }, StockOutController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Standalone Stock Out Detail API ====================

  @MessagePattern({ cmd: 'stock-out-detail.findAll', service: 'stock-out-detail' })
  async findAllDetails(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAllDetails', payload }, StockOutController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findAllDetails(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'stock-out-detail.findOne', service: 'stock-out-detail' })
  async findOneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOneDetail', payload }, StockOutController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out-detail.createStandalone', service: 'stock-out-detail' })
  async createStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createStandaloneDetail', payload }, StockOutController.name);
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.createStandaloneDetail(data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'stock-out-detail.updateStandalone', service: 'stock-out-detail' })
  async updateStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateStandaloneDetail', payload }, StockOutController.name);
    const detailId = payload.id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.updateDetail(detailId, { id: detailId, ...data }, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'stock-out-detail.deleteStandalone', service: 'stock-out-detail' })
  async deleteStandaloneDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteStandaloneDetail', payload }, StockOutController.name);
    const detailId = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.stockOutService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }
}
