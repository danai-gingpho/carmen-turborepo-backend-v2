import { Body, Controller, UseFilters } from '@nestjs/common';
import { GoodReceivedNoteDetailCommentService } from './good-received-note-detail-comment.service';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import {
  CreateGoodReceivedNoteDetailCommentSchema,
  UpdateGoodReceivedNoteDetailCommentSchema,
  AttachmentSchema,
} from './dto/good-received-note-detail-comment.dto';
import { MicroservicePayload, MicroserviceResponse } from '@/common';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class GoodReceivedNoteDetailCommentController {
  private readonly logger: BackendLogger = new BackendLogger(
    GoodReceivedNoteDetailCommentController.name,
  );

  constructor(
    private readonly goodReceivedNoteDetailCommentService: GoodReceivedNoteDetailCommentService,
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
    cmd: 'good-received-note-detail-comment.find-by-id',
    service: 'good-received-note-detail-comment',
  })
  async findById(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findById', payload },
      GoodReceivedNoteDetailCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.goodReceivedNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteDetailCommentService.findById(id),
    );
  }

  /**
   * Find all comments for a specific purchase request with pagination
   * ค้นหาความคิดเห็นทั้งหมดของใบขอซื้อที่ระบุพร้อมการแบ่งหน้า
   * @param payload - Payload containing purchase request ID and pagination / payload ที่มี ID ใบขอซื้อและการแบ่งหน้า
   * @returns Paginated list of comments / รายการความคิดเห็นที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'good-received-note-detail-comment.find-all-by-good-received-note-detail-id',
    service: 'good-received-note-detail-comment',
  })
  async findAllByGoodReceivedNoteDetailId(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllByGoodReceivedNoteDetailId', payload },
      GoodReceivedNoteDetailCommentController.name,
    );

    const { good_received_note_detail_id, user_id, bu_code, paginate } = payload;

    await this.goodReceivedNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteDetailCommentService.findAllByGoodReceivedNoteDetailId(
        good_received_note_detail_id,
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
    cmd: 'good-received-note-detail-comment.create',
    service: 'good-received-note-detail-comment',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      GoodReceivedNoteDetailCommentController.name,
    );

    const { data, user_id, bu_code } = payload;

    await this.goodReceivedNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = CreateGoodReceivedNoteDetailCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteDetailCommentService.create(parsedData),
    );
  }

  /**
   * Update an existing purchase request comment
   * อัปเดตความคิดเห็นใบขอซื้อที่มีอยู่
   * @param payload - Payload containing comment ID and updated data / payload ที่มี ID ความคิดเห็นและข้อมูลที่อัปเดต
   * @returns Updated comment / ความคิดเห็นที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'good-received-note-detail-comment.update',
    service: 'good-received-note-detail-comment',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      GoodReceivedNoteDetailCommentController.name,
    );

    const { id, data, user_id, bu_code } = payload;

    await this.goodReceivedNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = UpdateGoodReceivedNoteDetailCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteDetailCommentService.update(id, parsedData),
    );
  }

  /**
   * Delete a purchase request comment (soft delete, own comments only)
   * ลบความคิดเห็นใบขอซื้อ (ลบแบบซอฟต์ เฉพาะความคิดเห็นของตนเอง)
   * @param payload - Payload containing the comment ID to delete / payload ที่มี ID ของความคิดเห็นที่ต้องการลบ
   * @returns Deleted comment ID / ID ของความคิดเห็นที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'good-received-note-detail-comment.delete',
    service: 'good-received-note-detail-comment',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      GoodReceivedNoteDetailCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.goodReceivedNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteDetailCommentService.delete(id),
    );
  }

  /**
   * Add an attachment to a purchase request comment
   * เพิ่มไฟล์แนบในความคิดเห็นใบขอซื้อ
   * @param payload - Payload containing comment ID and attachment data / payload ที่มี ID ความคิดเห็นและข้อมูลไฟล์แนบ
   * @returns Updated comment with new attachment / ความคิดเห็นที่อัปเดตพร้อมไฟล์แนบใหม่
   */
  @MessagePattern({
    cmd: 'good-received-note-detail-comment.add-attachment',
    service: 'good-received-note-detail-comment',
  })
  async addAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'addAttachment', payload },
      GoodReceivedNoteDetailCommentController.name,
    );

    const { id, attachment, user_id, bu_code } = payload;

    await this.goodReceivedNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedAttachment = AttachmentSchema.parse(attachment);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteDetailCommentService.addAttachment(id, parsedAttachment),
    );
  }

  /**
   * Remove an attachment from a purchase request comment
   * ลบไฟล์แนบจากความคิดเห็นใบขอซื้อ
   * @param payload - Payload containing comment ID and file token of attachment to remove / payload ที่มี ID ความคิดเห็นและ token ของไฟล์แนบที่ต้องการลบ
   * @returns Updated comment without the removed attachment / ความคิดเห็นที่อัปเดตโดยไม่มีไฟล์แนบที่ลบ
   */
  @MessagePattern({
    cmd: 'good-received-note-detail-comment.remove-attachment',
    service: 'good-received-note-detail-comment',
  })
  async removeAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'removeAttachment', payload },
      GoodReceivedNoteDetailCommentController.name,
    );

    const { id, fileToken, user_id, bu_code } = payload;

    await this.goodReceivedNoteDetailCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteDetailCommentService.removeAttachment(id, fileToken),
    );
  }
}
