import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ICreateProduct, IUpdateProduct, Result } from '@/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class Config_ProductsService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductsService.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'products.findOne', service: 'products' },
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

  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'products.findAll', service: 'products' },
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

    // console.log("response:", response);
    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async create(
    createDto: ICreateProduct,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'products.create', service: 'products' },
      {
        data: createDto,
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
    updateDto: IUpdateProduct,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'products.update', service: 'products' },
      {
        data: updateDto,
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
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'products.delete', service: 'products' },
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

  async findItemGroup(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findItemGroup',
        id,
        user_id,
        bu_code,
        version,
      },
      Config_ProductsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'products.findItemGroup', service: 'products' },
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

  // async getOrderUnitByProductId(id: string) {

  // }

  // async getIngredientUnitByProductId(id: string) {

  // }
}
