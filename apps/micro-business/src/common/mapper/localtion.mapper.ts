import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class LocationMapper {
  private readonly logger: BackendLogger = new BackendLogger(
    LocationMapper.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async fetch(ids: string[], user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-location', ids, user_id, bu_code }, LocationMapper.name);
    const res = this.masterService.send(
      { cmd: 'locations.find-many-by-id', service: 'locations' },
      { ids, user_id, bu_code },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new Error(response.response.message);
    }

    return response.data;
  }
}
