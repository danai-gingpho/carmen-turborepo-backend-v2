import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { CreatePurchaseRequestTemplateDto } from './dto/purchase-requesr-template.dto';
import { UpdatePurchaseRequestTemplateDto } from './dto/update-purchase-request-template.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class PurchaseRequestTemplateService {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestTemplateService.name,
  );

  constructor(
    @Inject('PROCUREMENT_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

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
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.find-all',
        service: 'purchase-request-template',
      },
      {
        user_id: user_id,
        bu_code: bu_code,
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
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.find-one',
        service: 'purchase-request-template',
      },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
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

  async create(
    createPurchaseRequestTemplateDto: CreatePurchaseRequestTemplateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'create',
        createPurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.create',
        service: 'purchase-request-template',
      },
      {
        data: createPurchaseRequestTemplateDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version,
      },
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
    updatePurchaseRequestTemplateDto: UpdatePurchaseRequestTemplateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updatePurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.update',
        service: 'purchase-request-template',
      },
      {
        data: { id, ...updatePurchaseRequestTemplateDto },
        user_id: user_id,
        bu_code: bu_code,
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
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<any> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.delete',
        service: 'purchase-request-template',
      },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
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
