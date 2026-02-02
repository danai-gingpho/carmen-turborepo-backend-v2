import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RUNNING_CODE_PRESET } from '@/procurement/const/procurement.const';
import { firstValueFrom, Observable } from 'rxjs';
import { PatternMapper } from './common.interface';
import { BackendLogger } from './helpers/backend.logger';

@Injectable()
export class CommonLogic {
  private readonly logger: BackendLogger = new BackendLogger(CommonLogic.name);
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async generateRunningCode(
    type: string,
    issueDate: Date,
    last_no: number,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<string> {
    this.logger.debug(
      {
        function: 'generateRunningCode',
        type,
        issueDate,
        last_no,
        user_id,
        bu_code,
        version,
      },
      CommonLogic.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      { type, issueDate, last_no, user_id, bu_code, version },
    );
    const response = await firstValueFrom(res);

    return response.data.code;
  }

  async getRunningPattern(
    type: string,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<PatternMapper> {
    this.logger.debug(
      { function: 'getRunningPattern', type, user_id, bu_code, version },
      CommonLogic.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.find-by-type', service: 'running-codes' },
      { type, user_id, bu_code, version },
    );
    const response = await firstValueFrom(res);
    let pattern: PatternMapper;
    if (response?.data) {
      pattern = response.data.config;
    } else {
      const res: Observable<any> = this.masterService.send(
        { cmd: 'running-code.create', service: 'running-codes' },
        {
          data: {
            type,
            config: RUNNING_CODE_PRESET[type].config,
            note: 'initialized by system default.',
          },
          user_id,
          bu_code,
          version,
        },
      );
      const response = await firstValueFrom(res);
      if (response.response.status !== HttpStatus.CREATED) {
        throw new Error(response.response.message);
      }
      pattern = RUNNING_CODE_PRESET[type].config;
    }

    return pattern;
  }
}
