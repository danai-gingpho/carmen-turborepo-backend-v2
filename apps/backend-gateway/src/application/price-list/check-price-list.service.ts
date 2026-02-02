import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class CheckPriceListService {
  private readonly logger: BackendLogger = new BackendLogger(
    CheckPriceListService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE') private readonly masterService: ClientProxy,
  ) {}

  async checkPriceList(urlToken: string, version: string, decodedToken: any): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'checkPriceList',
        url_token: urlToken,
        version,
        decodedToken,
      },
      CheckPriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'check-price-list.check', service: 'check-price-list' },
      { url_token: urlToken, version, decodedToken },
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
