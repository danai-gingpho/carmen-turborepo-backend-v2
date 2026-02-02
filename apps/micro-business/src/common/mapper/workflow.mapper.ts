import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from '../helpers/backend.logger';

@Injectable()
export class WorkflowMapper {
  private readonly logger: BackendLogger = new BackendLogger(
    WorkflowMapper.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) { }

  async fetch(workflow_id: string, user_id: string, bu_code: string) {
    this.logger.debug(
      { function: 'fetch-workflow', workflow_id, user_id, bu_code },
      WorkflowMapper.name,
    );
    const res = this.masterService.send(
      { cmd: 'workflows.findOne', service: 'workflows' },
      {
        id: workflow_id,
        user_id,
        bu_code,
      },
    );
    const response = await firstValueFrom(res);

    console.log('response workflow', response);
    if (response.response.status !== HttpStatus.OK) {
      throw new Error(response.response.message);
    }

    return response.data;
  }
}
