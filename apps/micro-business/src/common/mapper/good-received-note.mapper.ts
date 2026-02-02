import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class GoodReceivedNoteMapper {
  private readonly logger: BackendLogger = new BackendLogger(GoodReceivedNoteMapper.name);
  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) { }

  async fetch(id: string[], user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-good-received-note', id, user_id, bu_code }, GoodReceivedNoteMapper.name);
    const res = this.inventoryService.send(
      { cmd: 'good-received-note.findOne', service: 'good-received-note' },
      { id, user_id, bu_code },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new Error(response.response.message);
    }

    return response.data;
  }
}
