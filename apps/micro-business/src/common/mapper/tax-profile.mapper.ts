import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'
import { BackendLogger } from '../helpers/backend.logger'

@Injectable()
export class TaxProfileMapper {
  private readonly logger: BackendLogger = new BackendLogger(
    TaxProfileMapper.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async fetch(ids: string[], user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-tax-profile', ids, user_id, bu_code }, TaxProfileMapper.name);
    const res = this.masterService.send(
      { cmd: 'tax-profile.find-all-by-id', service: 'tax-profile' },
      { ids, user_id, bu_code },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new Error(response.response.message);
    }

    return response.data;
  }
}
