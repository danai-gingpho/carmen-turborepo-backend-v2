import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  IGoodReceivedNoteCreate,
  IGoodReceivedNoteUpdate,
  Result,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { randomInt } from 'crypto';

@Injectable()
export class GoodReceivedNoteService {
  private readonly logger: BackendLogger = new BackendLogger(
    GoodReceivedNoteService.name,
  );
  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.findOne', service: 'good-received-note' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.findAll', service: 'good-received-note' },
      {
        user_id: user_id,
        tenant_id: tenant_id,
        paginate: paginate,
        version: version,
      },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    console.log('response data:', response.data)
    console.log('response paginate:', response.paginate)

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async create(
    data: IGoodReceivedNoteCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        data,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.create', service: 'good-received-note' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async update(
    data: IGoodReceivedNoteUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        data,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.update', service: 'good-received-note' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.delete', service: 'good-received-note' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async exportToExcel(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.export', service: 'good-received-note' },
      { id, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // Convert the buffer data back to Buffer if it was serialized
    const data = response.data;
    if (data && data.buffer && data.buffer.type === 'Buffer') {
      data.buffer = Buffer.from(data.buffer.data);
    }

    return Result.ok(data);
  }

  async reject(
    id: string,
    reason: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        reason,
        user_id,
        tenant_id,
        version,
      },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.reject', service: 'good-received-note' },
      { id, reason, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  // ==================== Good Received Note Detail CRUD ====================

  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.find-by-id', service: 'good-received-note' },
      { detail_id: detailId, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async findDetailsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByGrnId', grnId, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.find-all', service: 'good-received-note' },
      { grn_id: grnId, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async createDetail(
    grnId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', grnId, data, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.create', service: 'good-received-note' },
      { grn_id: grnId, data, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async updateDetail(
    detailId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, data, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.update', service: 'good-received-note' },
      { detail_id: detailId, data, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async deleteDetail(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note-detail.delete', service: 'good-received-note' },
      { detail_id: detailId, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  // ==================== Mobile-specific endpoints ====================

  async findByManualPO(
    po_no: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findByManualPO', po_no, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.find-by-manual-po', service: 'good-received-note' },
      { po_no, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async confirm(
    id: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'confirm', id, data, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.confirm', service: 'good-received-note' },
      { id, data, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async getComments(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'getComments', id, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.get-comments', service: 'good-received-note' },
      { id, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async createComment(
    id: string,
    data: { comment: string },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createComment', id, data, user_id, tenant_id, version },
      GoodReceivedNoteService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'good-received-note.create-comment', service: 'good-received-note' },
      { id, data, user_id, tenant_id, version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async findAllPendingGoodReceivedNoteCount(
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllPendingGoodReceivedNoteCount',
        version,
        user_id,
      },
      GoodReceivedNoteService.name,
    );

    // const res: Observable<any> = this.inventoryService.send(
    //   { cmd: 'good-received-note.find-all.count', service: 'good-received-note' },
    //   {
    //     user_id,
    //     version: version,
    //   },
    // );

    // const response = await firstValueFrom(res);

    // todo: implement the actual call to inventory service
    // mock response for testing purpose
    const response = {
      data: {
        pending: randomInt(1, 100),
      },
      response: {
        status: HttpStatus.OK,
        message: 'Success',
      },
    };

    this.logger.debug(
      {
        function: 'findAllPendingGoodReceivedNoteCount',
        version,
        user_id,
        response,
      },
      GoodReceivedNoteService.name,
    );

if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
