import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class ProductsService {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductsService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async getByLocation(
    user_id: string,
    bu_code: string,
    location_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getByLocation',
        user_id,
        bu_code,
        location_id,
        paginate,
        version,
      },
      ProductsService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'products.getByLocationId', service: 'products' },
      {
        user_id: user_id,
        bu_code: bu_code,
        location_id: location_id,
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
}
