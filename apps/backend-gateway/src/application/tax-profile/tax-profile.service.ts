import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateTaxProfileDto } from './dto/tax-profile.dto';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class TaxProfileService {
  private readonly logger: BackendLogger = new BackendLogger(
    TaxProfileService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE') private readonly masterService: ClientProxy,
  ) { }

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
      TaxProfileService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'tax-profile.findOne', service: 'tax-profile' },
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
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      TaxProfileService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'tax-profile.findAll', service: 'tax-profile' },
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
}
