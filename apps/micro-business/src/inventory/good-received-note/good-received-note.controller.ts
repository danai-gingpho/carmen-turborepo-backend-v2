import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GoodReceivedNoteService } from './good-received-note.service';
import {
  IGoodReceivedNoteCreate,
  IGoodReceivedNoteUpdate,
} from './interface/good-received-note.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController } from '@/common';

@Controller()
export class GoodReceivedNoteController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(GoodReceivedNoteController.name);
  constructor(
    private readonly goodReceivedNoteService: GoodReceivedNoteService,
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
    cmd: 'good-received-note.findOne',
    service: 'good-received-note',
  })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findOne(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note.findAll',
    service: 'good-received-note',
  })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload: payload }, GoodReceivedNoteController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findAll(user_id, tenant_id, paginate)
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note.create',
    service: 'good-received-note',
  })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload: payload }, GoodReceivedNoteController.name);
    const data: IGoodReceivedNoteCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    try {
      const result = await runWithAuditContext(auditContext, () =>
        this.goodReceivedNoteService.create(data, user_id, tenant_id)
      );
      this.logger.debug({ function: 'create', result: result }, GoodReceivedNoteController.name);
      if (!result) {
        return {
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Service returned undefined result',
            timestamp: new Date().toISOString(),
          },
        };
      }
      return this.handleResult(result, HttpStatus.CREATED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error({ function: 'create', error: errorMessage, stack: errorStack }, GoodReceivedNoteController.name);
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage || 'Unknown error in create',
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  @MessagePattern({
    cmd: 'good-received-note.update',
    service: 'good-received-note',
  })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload: payload }, GoodReceivedNoteController.name);
    const data: IGoodReceivedNoteUpdate = payload.updateGoodReceivedNoteDto;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.update(data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note.delete',
    service: 'good-received-note',
  })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.delete(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note.export',
    service: 'good-received-note',
  })
  async exportToExcel(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'exportToExcel', payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.exportToExcel(id, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note.reject',
    service: 'good-received-note',
  })
  async reject(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'reject', payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const reason = payload.reason || '';
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.reject(id, reason, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  // ==================== Good Received Note Detail CRUD ====================

  @MessagePattern({
    cmd: 'good-received-note-detail.find-by-id',
    service: 'good-received-note',
  })
  async getDetailById(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailById', payload: payload }, GoodReceivedNoteController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findDetailById(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note-detail.find-all',
    service: 'good-received-note',
  })
  async getDetailsByGrnId(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'getDetailsByGrnId', payload: payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findDetailsByGrnId(grnId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note-detail.create',
    service: 'good-received-note',
  })
  async createDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'createDetail', payload: payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.createDetail(grnId, data, user_id, tenant_id)
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({
    cmd: 'good-received-note-detail.update',
    service: 'good-received-note',
  })
  async updateDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'updateDetail', payload: payload }, GoodReceivedNoteController.name);
    const detailId = payload.detail_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.updateDetail(detailId, data, user_id, tenant_id)
    );
    return this.handleResult(result);
  }

  @MessagePattern({
    cmd: 'good-received-note-detail.delete',
    service: 'good-received-note',
  })
  async deleteDetail(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'deleteDetail', payload: payload }, GoodReceivedNoteController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.deleteDetail(detailId, user_id, tenant_id)
    );
    return this.handleResult(result);
  }
}
