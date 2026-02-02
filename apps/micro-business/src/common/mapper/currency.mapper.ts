import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class CurrencyMapper {
  private readonly logger: BackendLogger = new BackendLogger(
    CurrencyMapper.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async fetch(ids: string[], user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-currency', ids, user_id, bu_code }, CurrencyMapper.name);
    const res = this.masterService.send(
      {
        cmd: 'currencies.find-all-by-id',
        service: 'currencies',
      },
      {
        ids,
        user_id,
        bu_code,
      },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new Error('Currencies not found');
    }

    return response.data;
  }
}
