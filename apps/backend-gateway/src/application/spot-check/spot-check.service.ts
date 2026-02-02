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
export class SpotCheckService {
  private readonly logger: BackendLogger = new BackendLogger(
    SpotCheckService.name,
  );
  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  async findAllPendingSpotCheckCount(
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAllPendingSpotCheckCount',
        version,
        user_id,
      },
      SpotCheckService.name,
    );

    // const res: Observable<any> = this.inventoryService.send(
    //   { cmd: 'spot-check.find-all.count', service: 'spot-check' },
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
        function: 'findAllPendingSpotCheckCount',
        version,
        user_id,
        response,
      },
      SpotCheckService.name,
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.findOne', service: 'spot-check' },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.findAll', service: 'spot-check' },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.create', service: 'spot-check' },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.update', service: 'spot-check' },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.delete', service: 'spot-check' },
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

  // ==================== Spot Check Detail CRUD ====================

  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check-detail.find-by-id', service: 'spot-check' },
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

  async findDetailsBySpotCheckId(
    spotCheckId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsBySpotCheckId', spotCheckId, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check-detail.find-all', service: 'spot-check' },
      { spot_check_id: spotCheckId, user_id, tenant_id, version },
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
    spotCheckId: string,
    data: any,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', spotCheckId, data, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check-detail.create', service: 'spot-check' },
      { spot_check_id: spotCheckId, data, user_id, tenant_id, version },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check-detail.update', service: 'spot-check' },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check-detail.delete', service: 'spot-check' },
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
    data: { items: Array<{ product_id: string; actual_qty: number }> },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'saveItems', id, data, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.save-items', service: 'spot-check' },
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
    data: { items: Array<{ product_id: string; actual_qty: number }> },
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'reviewItems', id, data, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.review-items', service: 'spot-check' },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.get-review', service: 'spot-check' },
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
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.submit', service: 'spot-check' },
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

  async reset(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'reset', id, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.reset', service: 'spot-check' },
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

  async getProductsByLocationId(
    locationId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'getProductsByLocationId', locationId, user_id, tenant_id, version },
      SpotCheckService.name,
    );

    const res: Observable<any> = this.inventoryService.send(
      { cmd: 'spot-check.get-products-by-location', service: 'spot-check' },
      { location_id: locationId, user_id, tenant_id, version },
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
}
