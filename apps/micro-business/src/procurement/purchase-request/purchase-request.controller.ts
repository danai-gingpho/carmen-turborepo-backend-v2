import { Body, Controller, HttpStatus, UseFilters } from '@nestjs/common';
import { PurchaseRequestService } from './purchase-request.service';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  RejectPurchaseRequestDto,
  ReviewPurchaseRequestDto,
  BaseMicroserviceController,
} from '@/common';
import { PurchaseRequestLogic } from './logic/purchase-request.logic';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { CalculatePurchaseRequestDetail } from './interface/CalculatePurchaseRequestDetail.dto';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class PurchaseRequestController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestController.name,
  );
  constructor(
    private readonly purchaseRequestService: PurchaseRequestService,
    private readonly purchaseRequestLogic: PurchaseRequestLogic,
  ) {
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
    cmd: 'purchase-request.find-by-id',
    service: 'purchase-request',
  })
  async getById(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getById', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;
    const userData = payload.userData;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findById(id, userData),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.find-all',
    service: 'purchase-request',
  })
  async getAll(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getAll', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate;
    const userDatas: {
      bu_id: string;
      bu_code: string;
      role: string;
      permissions: any;
    }[] = payload.userDatas;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAll(
        user_id,
        bu_code,
        paginate,
        userDatas,
      ),
    );

    return this.handleMultiPaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'my-pending.purchase-request.find-all',
    service: 'my-pending',
  })
  async findAllMyPending(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllMyPending', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllMyPending(user_id, bu_code, paginate),
    );

    return this.handleMultiPaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'my-pending.purchase-request.find-all.count',
    service: 'my-pending',
  })
  async findAllMyPendingCount(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllMyPendingCount', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllMyPendingCount(user_id, bu_code),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.create',
    service: 'purchase-request',
  })
  async create(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.create(payload.data, user_id, bu_code),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'purchase-request.submit',
    service: 'purchase-request',
  })
  async submit(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'submit', payload },
      PurchaseRequestController.name,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.submit(
        payload.id,
        payload.payload,
        payload.user_id,
        payload.bu_code,
      ),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.approve',
    service: 'purchase-request',
  })
  async approve(
    @Body()
    payload: {
      id: string;
      body: any;
      user_id: string;
      bu_code: string;
      version: string;
    },
  ): Promise<any> {
    this.logger.debug(
      { function: 'approve', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.approve(
        payload.id,
        payload.body,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.review',
    service: 'purchase-request',
  })
  async review(
    @Body()
    payload: {
      id: string;
      body: ReviewPurchaseRequestDto;
      user_id: string;
      bu_code: string;
      version: string;
    },
  ): Promise<any> {
    this.logger.debug(
      { function: 'review', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.review(
        payload.id,
        payload.body,
        user_id,
        bu_code,
      ),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.reject',
    service: 'purchase-request',
  })
  async reject(
    @Body()
    payload: {
      id: string;
      body: any;
      user_id: string;
      bu_code: string;
      version: string;
    },
  ): Promise<any> {
    this.logger.debug(
      { function: 'reject', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const body: RejectPurchaseRequestDto = payload.body;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.reject(payload.id, body),
    );

    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.save',
    service: 'purchase-request',
  })
  async update(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload },
      PurchaseRequestController.name,
    );
    const id = payload.id;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const data = payload.data;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestLogic.save(id, data, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.duplicate-pr',
    service: 'purchase-request',
  })
  async duplicatePr(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'duplicatePr', payload },
      PurchaseRequestController.name,
    );
    const body = payload.body;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.duplicatePr(body.ids, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.split',
    service: 'purchase-request',
  })
  async splitPr(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'splitPr', payload },
      PurchaseRequestController.name,
    );
    const id = payload.id;
    const detailIds = payload.body.detail_ids;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.splitPr(id, detailIds, user_id, bu_code),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.delete',
    service: 'purchase-request',
  })
  async delete(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      PurchaseRequestController.name,
    );
    await this.purchaseRequestService.initializePrismaService(
      payload.bu_code,
      payload.user_id,
    );
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.delete(payload.id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.find-all-by-status',
    service: 'purchase-request',
  })
  async findAllByStatus(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllByStatus', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const status = payload.status;
    const paginate = payload.paginate;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllByStatus(status, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.find-all-workflow-stages-by-pr',
    service: 'purchase-request',
  })
  async findAllWorkflowStagesByPr(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllWorkflowStagesByPr', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllWorkflowStagesByPr(user_id, bu_code),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.find-all-my-pending-stages',
    service: 'purchase-request',
  })
  async findAllMyPendingStages(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllMyPendingStages', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findAllMyPendingStages(),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.export',
    service: 'purchase-request',
  })
  async exportToExcel(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'exportToExcel', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.exportToExcel(id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.print',
    service: 'purchase-request',
  })
  async printToPdf(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'printToPdf', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const id = payload.id;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.printToPdf(id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'purchase-request.find-dimensions-by-detail-id',
    service: 'purchase-request',
  })
  async findDimensionsByDetailId(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findDimensionsByDetailId', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const detail_id = payload.detail_id;
    const version = payload.version;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findDimensionsByDetailId(detail_id),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request.find-history-by-detail-id',
    service: 'purchase-request',
  })
  async findHistoryByDetailId(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findHistoryByDetailId', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const detail_id = payload.detail_id;
    const version = payload.version;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findHistoryByDetailId(detail_id),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request.get-calculate-price-info-by-detail-id',
    service: 'purchase-request',
  })
  async findCalculatePriceInfoByDetailId(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findCalculatePriceInfoByDetailId', payload },
      PurchaseRequestController.name,
    );
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const detail_id = payload.detail_id;
    const data: CalculatePurchaseRequestDetail = payload.data;
    const version = payload.version;

    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestService.findCalculatePriceInfoByDetailId(
        detail_id,
        data,
      ),
    );
  }
}
