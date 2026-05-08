import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class DepartmentMapper {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentMapper.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async fetch(department_id: string, user_id: string, bu_code: string) {
    this.logger.debug(
      { function: 'fetch-department', department_id, user_id, bu_code },
      DepartmentMapper.name,
    );
    const res = this.masterService.send(
      { cmd: 'departments.findOne', service: 'departments' },
      {
        id: department_id,
        user_id,
        bu_code,
      },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      throw new Error('Department not found');
    }

    return response.data;
  }
}
