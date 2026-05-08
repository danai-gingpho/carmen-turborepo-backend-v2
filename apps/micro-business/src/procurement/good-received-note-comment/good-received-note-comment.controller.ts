import { Body, Controller, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { GoodReceivedNoteCommentService } from './good-received-note-comment.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { AllExceptionsFilter } from '@/common/exception/global.filter';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import {
  CreateGoodReceivedNoteCommentSchema,
  UpdateGoodReceivedNoteCommentSchema,
} from './dto/good-received-note-comment.dto';
import { AttachmentSchema } from '../../common/dto/attachment.schema';
import { MicroservicePayload, MicroserviceResponse } from '@/common';

@UseFilters(new AllExceptionsFilter())
@Controller()
export class GoodReceivedNoteCommentController {
  private readonly logger: BackendLogger = new BackendLogger(GoodReceivedNoteCommentController.name);

  constructor(
    private readonly goodReceivedNoteCommentService: GoodReceivedNoteCommentService,
  ) {}

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({
    cmd: 'good-received-note-comment.find-by-id',
    service: 'good-received-note-comment',
  })
  async findById(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findById', payload }, GoodReceivedNoteCommentController.name);

    const { id, user_id, bu_code } = payload;

    await this.goodReceivedNoteCommentService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteCommentService.findById(id),
    );
  }

  @MessagePattern({
    cmd: 'good-received-note-comment.find-all-by-good-received-note-id',
    service: 'good-received-note-comment',
  })
  async findAllByGoodReceivedNoteId(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'findAllByGoodReceivedNoteId', payload },
      GoodReceivedNoteCommentController.name,
    );

    const { good_received_note_id, user_id, bu_code, paginate } = payload;

    await this.goodReceivedNoteCommentService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteCommentService.findAllByGoodReceivedNoteId(good_received_note_id, paginate),
    );
  }

  @MessagePattern({
    cmd: 'good-received-note-comment.create',
    service: 'good-received-note-comment',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, GoodReceivedNoteCommentController.name);

    const { data, user_id, bu_code } = payload;

    await this.goodReceivedNoteCommentService.initializePrismaService(bu_code, user_id);

    const parsedData = CreateGoodReceivedNoteCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteCommentService.create(parsedData),
    );
  }

  @MessagePattern({
    cmd: 'good-received-note-comment.update',
    service: 'good-received-note-comment',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, GoodReceivedNoteCommentController.name);

    const { id, data, user_id, bu_code } = payload;

    await this.goodReceivedNoteCommentService.initializePrismaService(bu_code, user_id);

    const parsedData = UpdateGoodReceivedNoteCommentSchema.parse(data);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteCommentService.update(id, parsedData),
    );
  }

  @MessagePattern({
    cmd: 'good-received-note-comment.delete',
    service: 'good-received-note-comment',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, GoodReceivedNoteCommentController.name);

    const { id, user_id, bu_code } = payload;

    await this.goodReceivedNoteCommentService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteCommentService.delete(id),
    );
  }

  @MessagePattern({
    cmd: 'good-received-note-comment.add-attachment',
    service: 'good-received-note-comment',
  })
  async addAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'addAttachment', payload }, GoodReceivedNoteCommentController.name);

    const { id, attachment, user_id, bu_code } = payload;

    await this.goodReceivedNoteCommentService.initializePrismaService(bu_code, user_id);

    const parsedAttachment = AttachmentSchema.parse(attachment);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteCommentService.addAttachment(id, parsedAttachment),
    );
  }

  @MessagePattern({
    cmd: 'good-received-note-comment.remove-attachment',
    service: 'good-received-note-comment',
  })
  async removeAttachment(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'removeAttachment', payload }, GoodReceivedNoteCommentController.name);

    const { id, fileToken, user_id, bu_code } = payload;

    await this.goodReceivedNoteCommentService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteCommentService.removeAttachment(id, fileToken),
    );
  }
}
