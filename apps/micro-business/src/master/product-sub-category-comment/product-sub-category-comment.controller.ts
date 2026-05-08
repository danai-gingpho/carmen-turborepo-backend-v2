import { Body, Controller, UseFilters } from '@nestjs/common';
import { ProductSubCategoryCommentService } from './product-sub-category-comment.service';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import {
  CreateProductSubCategoryCommentSchema,
  UpdateProductSubCategoryCommentSchema,
  AttachmentSchema,
} from './dto/product-sub-category-comment.dto';
import { MicroservicePayload, MicroserviceResponse } from '@/common';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class ProductSubCategoryCommentController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductSubCategoryCommentController.name,
  );

  constructor(
    private readonly productSubCategoryCommentService: ProductSubCategoryCommentService,
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
    cmd: 'product-sub-category-comment.find-by-id',
    service: 'product-sub-category-comment',
  })
  async findById(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findById', payload },
      ProductSubCategoryCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.productSubCategoryCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.productSubCategoryCommentService.findById(id),
    );
  }

  /**
   * Find all comments for a specific purchase request with pagination
   * ค้นหาความคิดเห็นทั้งหมดของใบขอซื้อที่ระบุพร้อมการแบ่งหน้า
   * @param payload - Payload containing purchase request ID and pagination / payload ที่มี ID ใบขอซื้อและการแบ่งหน้า
   * @returns Paginated list of comments / รายการความคิดเห็นที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'product-sub-category-comment.find-all-by-product-sub-category-id',
    service: 'product-sub-category-comment',
  })
  async findAllByProductSubCategoryId(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllByProductSubCategoryId', payload },
      ProductSubCategoryCommentController.name,
    );

    const { product_sub_category_id, user_id, bu_code, paginate } = payload;

    await this.productSubCategoryCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.productSubCategoryCommentService.findAllByProductSubCategoryId(
        product_sub_category_id,
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
    cmd: 'product-sub-category-comment.create',
    service: 'product-sub-category-comment',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'create', payload },
      ProductSubCategoryCommentController.name,
    );

    const { data, user_id, bu_code } = payload;

    await this.productSubCategoryCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = CreateProductSubCategoryCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.productSubCategoryCommentService.create(parsedData),
    );
  }

  /**
   * Update an existing purchase request comment
   * อัปเดตความคิดเห็นใบขอซื้อที่มีอยู่
   * @param payload - Payload containing comment ID and updated data / payload ที่มี ID ความคิดเห็นและข้อมูลที่อัปเดต
   * @returns Updated comment / ความคิดเห็นที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'product-sub-category-comment.update',
    service: 'product-sub-category-comment',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'update', payload },
      ProductSubCategoryCommentController.name,
    );

    const { id, data, user_id, bu_code } = payload;

    await this.productSubCategoryCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedData = UpdateProductSubCategoryCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.productSubCategoryCommentService.update(id, parsedData),
    );
  }

  /**
   * Delete a purchase request comment (soft delete, own comments only)
   * ลบความคิดเห็นใบขอซื้อ (ลบแบบซอฟต์ เฉพาะความคิดเห็นของตนเอง)
   * @param payload - Payload containing the comment ID to delete / payload ที่มี ID ของความคิดเห็นที่ต้องการลบ
   * @returns Deleted comment ID / ID ของความคิดเห็นที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'product-sub-category-comment.delete',
    service: 'product-sub-category-comment',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'delete', payload },
      ProductSubCategoryCommentController.name,
    );

    const { id, user_id, bu_code } = payload;

    await this.productSubCategoryCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.productSubCategoryCommentService.delete(id),
    );
  }

  /**
   * Add an attachment to a purchase request comment
   * เพิ่มไฟล์แนบในความคิดเห็นใบขอซื้อ
   * @param payload - Payload containing comment ID and attachment data / payload ที่มี ID ความคิดเห็นและข้อมูลไฟล์แนบ
   * @returns Updated comment with new attachment / ความคิดเห็นที่อัปเดตพร้อมไฟล์แนบใหม่
   */
  @MessagePattern({
    cmd: 'product-sub-category-comment.add-attachment',
    service: 'product-sub-category-comment',
  })
  async addAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'addAttachment', payload },
      ProductSubCategoryCommentController.name,
    );

    const { id, attachment, user_id, bu_code } = payload;

    await this.productSubCategoryCommentService.initializePrismaService(
      bu_code,
      user_id,
    );

    const parsedAttachment = AttachmentSchema.parse(attachment);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.productSubCategoryCommentService.addAttachment(id, parsedAttachment),
    );
  }

  /**
   * Remove an attachment from a purchase request comment
   * ลบไฟล์แนบจากความคิดเห็นใบขอซื้อ
   * @param payload - Payload containing comment ID and file token of attachment to remove / payload ที่มี ID ความคิดเห็นและ token ของไฟล์แนบที่ต้องการลบ
   * @returns Updated comment without the removed attachment / ความคิดเห็นที่อัปเดตโดยไม่มีไฟล์แนบที่ลบ
   */
  @MessagePattern({
    cmd: 'product-sub-category-comment.remove-attachment',
    service: 'product-sub-category-comment',
  })
  async removeAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'removeAttachment', payload },
      ProductSubCategoryCommentController.name,
    );

    const { id, fileToken, user_id, bu_code } = payload;

    await this.productSubCategoryCommentService.initializePrismaService(
      bu_code,
      user_id,
    );
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.productSubCategoryCommentService.removeAttachment(id, fileToken),
    );
  }
}
