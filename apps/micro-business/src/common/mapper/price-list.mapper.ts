import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class PriceListMapper {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListMapper.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async fetch(ids: string[], user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-price-list', ids, user_id, bu_code }, PriceListMapper.name);
    const res = this.masterService.send(
      {
        cmd: 'price-list.find-all-by-id',
        service: 'price-list',
      },
      {
        ids,
        user_id,
        bu_code,
      },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new Error('Price list not found');
    }

    return response.data;
  }
}
