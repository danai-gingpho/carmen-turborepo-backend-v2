import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class UserMapper {
  private readonly logger: BackendLogger = new BackendLogger(UserMapper.name);
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
  ) { }

  async fetch(id: string, user_id: string, bu_code: string) {
    this.logger.debug({ function: 'fetch-user', id, user_id, bu_code }, UserMapper.name);
    const res: Observable<any> = await this.authService.send(
      {
        cmd: 'get-user-by-id',
        service: 'auth',
      },
      {
        id: id,
      },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      throw new Error(response.response.message);
    }

    return response.data;
  }
}
