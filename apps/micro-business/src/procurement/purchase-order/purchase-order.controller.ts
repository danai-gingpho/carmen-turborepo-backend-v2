import { Controller, HttpStatus } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class PurchaseOrderController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderController.name,
  );

  constructor(private readonly purchaseOrderService: PurchaseOrderService) {
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

  @MessagePattern({
    cmd: 'purchase-order.find-by-id',
    service: 'purchase-order',
  })
  async getById(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getById', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findById(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.find-all',
    service: 'purchase-order',
  })
  async getAll(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getAll', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.create',
    service: 'purchase-order',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const data = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'purchase-order.update',
    service: 'purchase-order',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const data = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.delete',
    service: 'purchase-order',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.delete(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.group-pr',
    service: 'purchase-order',
  })
  async groupPrForPo(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'groupPrForPo', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const pr_ids = payload.data?.pr_ids || payload.pr_ids;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.groupPrForPo(pr_ids));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.confirm-pr',
    service: 'purchase-order',
  })
  async confirmPrToPo(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'confirmPrToPo', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const pr_ids = payload.data?.pr_ids || payload.pr_ids;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.confirmPrToPo(pr_ids));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.cancel',
    service: 'purchase-order',
  })
  async cancel(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'cancel', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.cancel(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.close',
    service: 'purchase-order',
  })
  async closePO(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'closePO', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.closePO(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.export',
    service: 'purchase-order',
  })
  async exportToExcel(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'exportToExcel', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.exportToExcel(id));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order.print',
    service: 'purchase-order',
  })
  async printToPdf(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'printToPdf', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const id = payload.id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.printToPdf(id));
    return this.handleResult(result);
  }

  // ==================== Purchase Order Detail CRUD ====================

  @MessagePattern({
    cmd: 'purchase-order-detail.find-by-id',
    service: 'purchase-order',
  })
  async getDetailById(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getDetailById', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const detailId = payload.detail_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findDetailById(detailId));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order-detail.find-all',
    service: 'purchase-order',
  })
  async getDetailsByPurchaseOrderId(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getDetailsByPurchaseOrderId', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const purchaseOrderId = payload.purchase_order_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.findDetailsByPurchaseOrderId(purchaseOrderId));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order-detail.create',
    service: 'purchase-order',
  })
  async createDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'createDetail', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const purchaseOrderId = payload.purchase_order_id;
    const detailData = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.createDetail(purchaseOrderId, detailData));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'purchase-order-detail.update',
    service: 'purchase-order',
  })
  async updateDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'updateDetail', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const detailId = payload.detail_id;
    const detailData = payload.data;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.updateDetail(detailId, detailData));
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-order-detail.delete',
    service: 'purchase-order',
  })
  async deleteDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'deleteDetail', payload },
      PurchaseOrderController.name,
    );
    this.purchaseOrderService.userId = payload.user_id;
    this.purchaseOrderService.bu_code = payload.tenant_id || payload.bu_code;
    await this.purchaseOrderService.initializePrismaService(
      payload.tenant_id || payload.bu_code,
      payload.user_id,
    );
    const detailId = payload.detail_id;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.purchaseOrderService.deleteDetail(detailId));
    return this.handleResult(result);
  }
}
