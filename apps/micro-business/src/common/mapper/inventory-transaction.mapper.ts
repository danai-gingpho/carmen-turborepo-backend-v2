import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class InventoryTransactionMapper {
  private readonly logger: BackendLogger = new BackendLogger(
    InventoryTransactionMapper.name,
  );
  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) { }

  async fetch(ids: string[], user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-inventory-transaction', ids, user_id, bu_code }, InventoryTransactionMapper.name);
    const res = this.inventoryService.send(
      {
        cmd: 'inventory-transaction.find-all-by-ids',
        service: 'inventory-transaction',
      },
      { ids, user_id, bu_code },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new Error(response.response.message);
    }

    console.log('response', response.data);

    return response.data;
  }
}
