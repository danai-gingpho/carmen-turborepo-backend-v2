import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class PurchaseOrderService {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderService.name,
  );

  constructor(
    @Inject('PROCUREMENT_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.find-by-id', service: 'purchase-order' },
        { id, user_id, bu_code, version },
      ),
    );

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
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.find-all', service: 'purchase-order' },
        { user_id, bu_code, paginate, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async create(
    createDto: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.create', service: 'purchase-order' },
        { data: createDto, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async update(
    id: string,
    updateDto: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.update', service: 'purchase-order' },
        { data: { id, ...updateDto }, user_id, bu_code, version },
      ),
    );

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
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.delete', service: 'purchase-order' },
        { data: id, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async groupPrForPo(
    pr_ids: string[],
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'groupPrForPo',
        pr_ids,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.group-pr', service: 'purchase-order' },
        { data: { pr_ids }, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async confirmPrToPo(
    pr_ids: string[],
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'confirmPrToPo',
        pr_ids,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.confirm-pr', service: 'purchase-order' },
        { data: { pr_ids }, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async cancel(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'cancel',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.cancel', service: 'purchase-order' },
        { id, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async closePO(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'closePO',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.close', service: 'purchase-order' },
        { id, user_id, bu_code, version },
      ),
    );

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
    bu_code: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'exportToExcel',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.export', service: 'purchase-order' },
        { id, user_id, bu_code, version },
      ),
    );

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

  async printToPdf(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      {
        function: 'printToPdf',
        id,
        version,
      },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order.print', service: 'purchase-order' },
        { id, user_id, bu_code, version },
      ),
    );

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

  // ==================== Purchase Order Detail CRUD ====================

  async findDetailById(
    detailId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order-detail.find-by-id', service: 'purchase-order' },
        { detail_id: detailId, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async findDetailsByPurchaseOrderId(
    purchaseOrderId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByPurchaseOrderId', purchaseOrderId, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order-detail.find-all', service: 'purchase-order' },
        { purchase_order_id: purchaseOrderId, user_id, bu_code, version },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async createDetail(
    purchaseOrderId: string,
    data: any,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', purchaseOrderId, data, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order-detail.create', service: 'purchase-order' },
        { purchase_order_id: purchaseOrderId, data, user_id, bu_code, version },
      ),
    );

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
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, data, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order-detail.update', service: 'purchase-order' },
        { detail_id: detailId, data, user_id, bu_code, version },
      ),
    );

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
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, version },
      PurchaseOrderService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'purchase-order-detail.delete', service: 'purchase-order' },
        { detail_id: detailId, user_id, bu_code, version },
      ),
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
