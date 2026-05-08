import { Body, Controller, UseFilters } from '@nestjs/common';
import { CreditNoteDetailCommentService } from './credit-note-detail-comment.service';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import {
  CreateCreditNoteDetailCommentSchema,
  UpdateCreditNoteDetailCommentSchema,
  AttachmentSchema,
} from './dto/credit-note-detail-comment.dto';
import { MicroservicePayload, MicroserviceResponse } from '@/common';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class CreditNoteDetailCommentController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteDetailCommentController.name,
  );

  constructor(
    private readonly creditNoteDetailCommentService: CreditNoteDetailCommentService,
  ) {}

  /**
   * Create an audit context from the microservice payload
   * สร้าง audit context จาก payload ของไมโครเซอร์วิส
   * @param payload - Microservice payload containing tenant and user info / payload ของไมโครเซอร์วิสที่มีข้อมูลผู้เช่าและผู้ใช้
   * @returns Audit context object / ออบเจกต์ audit context
   */
  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find a purchase request comment by ID
   * ค้นหาความคิดเห็นใบขอซื้อรายการเดียวตาม ID
   * @param payload - Payload containing the comment ID / payload ที่มี ID ของความคิดเห็น
   * @returns Comment data with user profile / ข้อมูลความคิดเห็นพร้อมโปรไฟล์ผู้ใช้
   */
  @MessagePattern({
    cmd: 'credit-note-detail-comment.find-by-id',
    service: 'credit-note-detail-comment',
  })
  async findById(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findById', payload },
      CreditNoteDetailCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.creditNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.creditNoteDetailCommentService.findById(id),
    );
  }

  /**
   * Find all comments for a specific purchase request with pagination
   * ค้นหาความคิดเห็นทั้งหมดของใบขอซื้อที่ระบุพร้อมการแบ่งหน้า
   * @param payload - Payload containing purchase request ID and pagination / payload ที่มี ID ใบขอซื้อและการแบ่งหน้า
   * @returns Paginated list of comments / รายการความคิดเห็นที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note-detail-comment.find-all-by-credit-note-detail-id',
    service: 'credit-note-detail-comment',
  })
  async findAllByCreditNoteDetailId(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllByCreditNoteDetailId', payload },
      CreditNoteDetailCommentController.name,
    );

    const { credit_note_detail_id, user_id, bu_code, paginate } = payload;

    await this.creditNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.creditNoteDetailCommentService.findAllByCreditNoteDetailId(
        credit_note_detail_id,
        paginate,
      ),
    );
  }

  /**
   * Create a new comment on a purchase request
   * สร้างความคิดเห็นใหม่ในใบขอซื้อ
   * @param payload - Payload containing comment data / payload ที่มีข้อมูลความคิดเห็น
   * @returns Created comment / ความคิดเห็นที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note-detail-comment.create',
    service: 'credit-note-detail-comment',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      CreditNoteDetailCommentController.name,
    );

    const { data, user_id, bu_code } = payload;

    await this.creditNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = CreateCreditNoteDetailCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.creditNoteDetailCommentService.create(parsedData),
    );
  }

  /**
   * Update an existing purchase request comment
   * อัปเดตความคิดเห็นใบขอซื้อที่มีอยู่
   * @param payload - Payload containing comment ID and updated data / payload ที่มี ID ความคิดเห็นและข้อมูลที่อัปเดต
   * @returns Updated comment / ความคิดเห็นที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note-detail-comment.update',
    service: 'credit-note-detail-comment',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      CreditNoteDetailCommentController.name,
    );

    const { id, data, user_id, bu_code } = payload;

    await this.creditNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = UpdateCreditNoteDetailCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.creditNoteDetailCommentService.update(id, parsedData),
    );
  }

  /**
   * Delete a purchase request comment (soft delete, own comments only)
   * ลบความคิดเห็นใบขอซื้อ (ลบแบบซอฟต์ เฉพาะความคิดเห็นของตนเอง)
   * @param payload - Payload containing the comment ID to delete / payload ที่มี ID ของความคิดเห็นที่ต้องการลบ
   * @returns Deleted comment ID / ID ของความคิดเห็นที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'credit-note-detail-comment.delete',
    service: 'credit-note-detail-comment',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      CreditNoteDetailCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.creditNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.creditNoteDetailCommentService.delete(id),
    );
  }

  /**
   * Add an attachment to a purchase request comment
   * เพิ่มไฟล์แนบในความคิดเห็นใบขอซื้อ
   * @param payload - Payload containing comment ID and attachment data / payload ที่มี ID ความคิดเห็นและข้อมูลไฟล์แนบ
   * @returns Updated comment with new attachment / ความคิดเห็นที่อัปเดตพร้อมไฟล์แนบใหม่
   */
  @MessagePattern({
    cmd: 'credit-note-detail-comment.add-attachment',
    service: 'credit-note-detail-comment',
  })
  async addAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'addAttachment', payload },
      CreditNoteDetailCommentController.name,
    );

    const { id, attachment, user_id, bu_code } = payload;

    await this.creditNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedAttachment = AttachmentSchema.parse(attachment);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.creditNoteDetailCommentService.addAttachment(id, parsedAttachment),
    );
  }

  /**
   * Remove an attachment from a purchase request comment
   * ลบไฟล์แนบจากความคิดเห็นใบขอซื้อ
   * @param payload - Payload containing comment ID and file token of attachment to remove / payload ที่มี ID ความคิดเห็นและ token ของไฟล์แนบที่ต้องการลบ
   * @returns Updated comment without the removed attachment / ความคิดเห็นที่อัปเดตโดยไม่มีไฟล์แนบที่ลบ
   */
  @MessagePattern({
    cmd: 'credit-note-detail-comment.remove-attachment',
    service: 'credit-note-detail-comment',
  })
  async removeAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'removeAttachment', payload },
      CreditNoteDetailCommentController.name,
    );

    const { id, fileToken, user_id, bu_code } = payload;

    await this.creditNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.creditNoteDetailCommentService.removeAttachment(id, fileToken),
    );
  }
}
