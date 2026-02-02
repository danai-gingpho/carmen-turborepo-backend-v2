import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class UnitConversionService {
  private readonly logger: BackendLogger = new BackendLogger(
    UnitConversionService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE') private readonly masterService: ClientProxy,
  ) { }

  async getOrderUnitProduct(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getOrderUnitProduct',
        productId,
        version,
      },
      UnitConversionService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'unit.get-order-unit-by-product-id', service: 'unit-conversion' },
      { productId, user_id, bu_code, version },
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

  async getIngredientUnitProduct(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getIngredientUnitProduct',
        productId,
        version,
      },
      UnitConversionService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'unit.get-ingredient-unit-by-product-id', service: 'unit-conversion' },
      { productId, user_id, bu_code, version },
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

  async getAvailableUnitProduct(
    productId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getAvailableUnitProduct',
        productId,
        version,
      },
      UnitConversionService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'unit.get-available-unit-by-product-id', service: 'unit-conversion' },
      { productId, user_id, bu_code, version },
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