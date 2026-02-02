import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { randomInt } from 'crypto';

@Injectable()
export class PhysicalCountService {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountService.name,
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
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.findOne', service: 'physical-count' },
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
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.findAll', service: 'physical-count' },
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async create(
    data: any,
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
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.create', service: 'physical-count' },
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
    id: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        data,
        user_id,
        tenant_id,
        version,
      },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.update', service: 'physical-count' },
      { id: id, data: data, user_id: user_id, tenant_id: tenant_id, version: version },
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
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.delete', service: 'physical-count' },
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

  // ==================== Physical Count Detail CRUD ====================

  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count-detail.find-by-id', service: 'physical-count' },
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

  async findDetailsByPhysicalCountId(
    physicalCountId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByPhysicalCountId', physicalCountId, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count-detail.find-all', service: 'physical-count' },
      { physical_count_id: physicalCountId, user_id, tenant_id, version },
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
    physicalCountId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', physicalCountId, data, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count-detail.create', service: 'physical-count' },
      { physical_count_id: physicalCountId, data, user_id, tenant_id, version },
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
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count-detail.update', service: 'physical-count' },
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
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count-detail.delete', service: 'physical-count' },
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

  async saveItems(
    id: string,
    data: { items: Array<{ id: string; actual_qty: number }> },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'saveItems', id, data, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.save-items', service: 'physical-count' },
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

  async reviewItems(
    id: string,
    data: { items: Array<{ id: string; actual_qty: number }> },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'reviewItems', id, data, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.review-items', service: 'physical-count' },
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

  async getReview(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'getReview', id, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.get-review', service: 'physical-count' },
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

  async submit(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'submit', id, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count.submit', service: 'physical-count' },
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
    detailId: string,
    data: { comment: string },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createComment', detailId, data, user_id, tenant_id, version },
      PhysicalCountService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'physical-count-detail.create-comment', service: 'physical-count' },
      { detail_id: detailId, data, user_id, tenant_id, version },
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

   async findAllPendingPhysicalCountCount(
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllPendingPhysicalCountCount',
        version,
        user_id,
      },
      PhysicalCountService.name,
    );

    // const res: Observable<any> = this.inventoryService.send(
    //   { cmd: 'physical-count.find-all.count', service: 'physical-count' },
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
        function: 'findAllPendingPhysicalCountCount',
        version,
        user_id,
        response,
      },
      PhysicalCountService.name,
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
