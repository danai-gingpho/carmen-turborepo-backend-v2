import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class WorkflowService {
  private readonly logger: BackendLogger = new BackendLogger(
    WorkflowService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE') private readonly masterService: ClientProxy,
  ) { }

  async findByType(
    workflowType: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findByType',
        workflowType,
        user_id,
        bu_code,
        version,
      },
      WorkflowService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'workflows.find-by-type', service: 'workflows' },
      {
        type: workflowType,
        user_id: user_id,
        bu_code: bu_code,
        version: version,
      },
    );

    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async getPreviousStages(
    workflow_id: string,
    stage: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getPreviousStages',
        workflow_id,
        stage,
        user_id,
        bu_code,
        version,
      },
      WorkflowService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'workflows.get-previous-stages', service: 'workflows' },
      {
        workflow_id: workflow_id,
        stage: stage,
        user_id: user_id,
        bu_code: bu_code,
        version: version,
      },
    );

    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
