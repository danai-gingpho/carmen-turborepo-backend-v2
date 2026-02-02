import { Body, Controller, UseFilters } from '@nestjs/common';
import { PurchaseRequestCommentService } from './purchase-request-comment.service';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import {
  CreatePurchaseRequestCommentSchema,
  UpdatePurchaseRequestCommentSchema,
  AttachmentSchema,
} from './dto/purchase-request-comment.dto';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class PurchaseRequestCommentController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestCommentController.name,
  );

  constructor(
    private readonly purchaseRequestCommentService: PurchaseRequestCommentService,
  ) {}

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
    cmd: 'purchase-request-comment.find-by-id',
    service: 'purchase-request-comment',
  })
  async findById(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findById', payload },
      PurchaseRequestCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.purchaseRequestCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestCommentService.findById(id),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request-comment.find-all-by-purchase-request-id',
    service: 'purchase-request-comment',
  })
  async findAllByPurchaseRequestId(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'findAllByPurchaseRequestId', payload },
      PurchaseRequestCommentController.name,
    );

    const { purchase_request_id, user_id, bu_code, paginate } = payload;

    await this.purchaseRequestCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestCommentService.findAllByPurchaseRequestId(
        purchase_request_id,
        paginate,
      ),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request-comment.create',
    service: 'purchase-request-comment',
  })
  async create(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'create', payload },
      PurchaseRequestCommentController.name,
    );

    const { data, user_id, bu_code } = payload;

    await this.purchaseRequestCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = CreatePurchaseRequestCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestCommentService.create(parsedData),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request-comment.update',
    service: 'purchase-request-comment',
  })
  async update(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'update', payload },
      PurchaseRequestCommentController.name,
    );

    const { id, data, user_id, bu_code } = payload;

    await this.purchaseRequestCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = UpdatePurchaseRequestCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestCommentService.update(id, parsedData),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request-comment.delete',
    service: 'purchase-request-comment',
  })
  async delete(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'delete', payload },
      PurchaseRequestCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.purchaseRequestCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestCommentService.delete(id),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request-comment.add-attachment',
    service: 'purchase-request-comment',
  })
  async addAttachment(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'addAttachment', payload },
      PurchaseRequestCommentController.name,
    );

    const { id, attachment, user_id, bu_code } = payload;

    await this.purchaseRequestCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedAttachment = AttachmentSchema.parse(attachment);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestCommentService.addAttachment(id, parsedAttachment),
    );
  }

  @MessagePattern({
    cmd: 'purchase-request-comment.remove-attachment',
    service: 'purchase-request-comment',
  })
  async removeAttachment(@Body() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'removeAttachment', payload },
      PurchaseRequestCommentController.name,
    );

    const { id, fileToken, user_id, bu_code } = payload;

    await this.purchaseRequestCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.purchaseRequestCommentService.removeAttachment(id, fileToken),
    );
  }
}
