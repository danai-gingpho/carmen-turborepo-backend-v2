import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

@Injectable()
export class LocationsService {
  private readonly logger: BackendLogger = new BackendLogger(
    LocationsService.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    withUser: boolean,
    withProducts: boolean,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
        version,
        withUser,
        withProducts,
      },
      LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.findOne', service: 'locations' },
      { id: id, user_id: user_id, bu_code: bu_code, withUser: withUser, withProducts: withProducts, version: version },
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
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.findAll', service: 'locations' },
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

  async findByUserId(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findByUserId',
        user_id,
        bu_code,
        version,
      },
      LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations.findAllByUser', service: 'locations' },
      { user_id: user_id, bu_code: bu_code, version: version },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // return response.data;
    console.log("response:", response);
    return Result.ok({ data: response.data, paginate: response.paginate });
  }
  // ---------------------------------
  async getProductInventory(location_id: string, product_id: string, user_id: string, bu_code: string, version: string): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getProductInventory',
        location_id,
        product_id,
        user_id,
        bu_code,
        version,
      },
      LocationsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'locations-product.getProductInventory', service: 'locations-product-inventory' },
      { location_id: location_id, product_id: product_id, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    // return response.data;
    return Result.ok(response.data);
  }
}
