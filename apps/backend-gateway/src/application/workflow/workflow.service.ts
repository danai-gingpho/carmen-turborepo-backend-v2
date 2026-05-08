import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class WorkflowService {
  private readonly logger: BackendLogger = new BackendLogger(
    WorkflowService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly masterService: ClientProxy,
  ) { }

  /**
   * Find a workflow configuration by document type
   * ค้นหาการกำหนดค่าขั้นตอนการทำงานตามประเภทเอกสาร
   * @param workflowType - Workflow type / ประเภทขั้นตอนการทำงาน
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Workflow configuration / การกำหนดค่าขั้นตอนการทำงาน
   */
  async findByType(
    workflowType: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
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

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'workflows.find-by-type', service: 'workflows' },
      {
        type: workflowType,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
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

  /**
   * Get previous approval stages relative to the current stage
   * ดึงขั้นตอนอนุมัติก่อนหน้าเทียบกับขั้นตอนปัจจุบัน
   * @param workflow_id - Workflow ID / รหัสขั้นตอนการทำงาน
   * @param stage - Current stage / ขั้นตอนปัจจุบัน
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Previous workflow stages / ขั้นตอนการทำงานก่อนหน้า
   */
  async getPreviousStages(
    workflow_id: string,
    stage: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
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

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'workflows.get-previous-stages', service: 'workflows' },
      {
        workflow_id: workflow_id,
        stage: stage,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
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

  async patchUserAction(
    doc_type: string,
    doc_id: string,
    user_ids: string[] | undefined,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'patchUserAction', doc_type, doc_id, user_ids },
      WorkflowService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'workflows.patch-user-action', service: 'workflows' },
      {
        data: { doc_type, doc_id, user_ids },
        user_id,
        bu_code, ...getGatewayRequestContext() },
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
