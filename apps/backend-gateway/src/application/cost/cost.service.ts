import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';

@Injectable()
export class CostService {
  private readonly logger: BackendLogger = new BackendLogger(CostService.name);

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly businessService: ClientProxy,
  ) {}

  async getProductCostEstimate(
    product_id: string,
    location_id: string,
    quantity: number,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getProductCostEstimate', product_id, location_id, quantity, user_id, bu_code, version },
      CostService.name,
    );

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'product.get-cost-estimate', service: 'product' },
      { product_id, location_id, quantity, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async getLastReceiving(
    product_id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getLastReceiving', product_id, user_id, bu_code, version },
      CostService.name,
    );

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'product.get-last-receiving', service: 'product' },
      { product_id, user_id, bu_code, version, ...getGatewayRequestContext() },
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
