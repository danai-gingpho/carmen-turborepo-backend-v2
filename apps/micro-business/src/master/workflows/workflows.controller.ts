import { Controller, HttpStatus } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { WorkflowNavigatorService } from './workflows.navagation.service';
import { GlobalApiReturn, NavigateForwardResult, NavigationHistory, NavigationInfo, Stage, WorkflowData, BaseMicroserviceController } from '@/common';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';

@Controller()
export class WorkflowsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    WorkflowsController.name,
  );
  constructor(
    private readonly workflowsService: WorkflowsService
  ) {
    super();
  }

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'workflows.findOne', service: 'workflows' })
  async findOne(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findOne', payload }, WorkflowsController.name);
    const id = payload.id;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    console.log('payload', payload.bu_code);
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.findOne(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'workflows.findAll', service: 'workflows' })
  async findAll(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findAll', payload }, WorkflowsController.name);
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'workflows.find-by-type', service: 'workflows' })
  async findByType(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'findByType', payload }, WorkflowsController.name);
    const type = payload.type;
    const user_id = payload.user_id;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.findByType(type, user_id));
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({ cmd: 'workflows.create', service: 'workflows' })
  async create(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'create', payload }, WorkflowsController.name);
    const data = payload.data;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  @MessagePattern({ cmd: 'workflows.update', service: 'workflows' })
  async update(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'update', payload }, WorkflowsController.name);
    const data = payload.data;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.update(data));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'workflows.delete', service: 'workflows' })
  async delete(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'delete', payload }, WorkflowsController.name);
    const id = payload.id;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.delete(id));
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'workflows.get-workflow-navigation', service: 'workflows' })
  async getWorkflowNavigation(@Payload() payload: any): Promise<NavigateForwardResult> {
    this.logger.debug({ function: 'getWorkflowNavigation', payload }, WorkflowsController.name);
    const workflowData = payload.workflowData;
    const currentStatus = payload.currentStatus;
    const previousStatus = payload.previousStatus;
    const requestData = payload.requestData;

    if (previousStatus && !currentStatus) {
      throw new Error('currentStatus is required when previousStatus is provided');
    }

    const workflowNav = new WorkflowNavigatorService(workflowData, currentStatus);

    return workflowNav.navigateForward(requestData);
  }

  @MessagePattern({ cmd: 'workflows.navigate-back-to-stage', service: 'workflows' })
  async navigateBackToStage(@Payload() payload: any): Promise<GlobalApiReturn<{
    previous_stage: string;
    current_stage: string;
    navigation_info: NavigationInfo;
    history: NavigationHistory;
  }>> {
    this.logger.debug({ function: 'navigateBackToStage', payload }, WorkflowsController.name);
    const workflow_id = payload.workflow_id;
    const targetStage = payload.stage;
    const currentStage = payload.current_stage;
    const requestData = payload.requestData || {};

    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const workflowResult = await runWithAuditContext(auditContext, () => this.workflowsService.findOne(workflow_id));

    if (!workflowResult.isOk() || !workflowResult.value) {
      throw new Error('Workflow not found');
    }

    const workflowData = workflowResult.value;

    const stageExists = workflowData.data.stages.some(s => s.name === targetStage);
    if (!stageExists) {
      throw new Error(`Stage "${targetStage}" does not exist in workflow definition`);
    }

    const workflowNav = new WorkflowNavigatorService(workflowData.data, targetStage);

    const navigationInfo = workflowNav.getNavigationInfo(targetStage, requestData);

    return {
      response: { status: 200 },
      data: {
        previous_stage: currentStage,
        current_stage: targetStage,
        navigation_info: navigationInfo,
        history: workflowNav.getHistory(),
      },
    };
  }

  @MessagePattern({ cmd: 'workflows.get-previous-stages', service: 'workflows' })
  async getPreviousStages(@Payload() payload: any): Promise<GlobalApiReturn<string[]>> {
    this.logger.debug({ function: 'getPreviousStages', payload }, WorkflowsController.name);
    const workflow_id = payload.workflow_id;
    const stage = payload.stage;

    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const workflowResult = await runWithAuditContext(auditContext, () => this.workflowsService.findOne(workflow_id));

    if (!workflowResult.isOk() || !workflowResult.value) {
      throw new Error('Workflow not found');
    }

    const workflowData = workflowResult.value;

    const workflowNav = new WorkflowNavigatorService(workflowData.data, stage);
    const data = workflowNav.getPreviousStageNamesByStructure(stage);

    return {
      response: { status: 200 },
      data: data,
    };
  }

  @MessagePattern({ cmd: 'workflows.get-workflow-stage-detail', service: 'workflows' })
  async getWorkflowStageDetail(@Payload() payload: any): Promise<GlobalApiReturn<Stage | null>> {
    this.logger.debug({ function: 'getWorkflowStageDetail', payload }, WorkflowsController.name);
    const workflow_id = payload.workflow_id;
    const stage = payload.stage;

    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const workflowResult = await runWithAuditContext(auditContext, () => this.workflowsService.findOne(workflow_id));
    if (!workflowResult.isOk() || !workflowResult.value) {
      throw new Error('Workflow not found');
    }

    const workflowData = workflowResult.value;
    const workflowNav = new WorkflowNavigatorService(workflowData.data, stage);
    const data = workflowNav.getCurrentStageDetail();

    return {
      response: { status: 200 },
      data: data,
    };
  }

  @MessagePattern({ cmd: 'workflows.get-all-workflows-stages', service: 'workflows' })
  async getAllWorkflowStages(@Payload() payload: any) {
    this.logger.debug({ function: 'getAllWorkflowStages', payload }, WorkflowsController.name);
    const workflow_ids = payload.workflow_ids
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(bu_code, user_id);

    const auditContext = this.createAuditContext(payload);
    const workflowResult = await runWithAuditContext(auditContext, () => this.workflowsService.findAllWorkflowByIds(workflow_ids, bu_code, user_id));
    if (!workflowResult.isOk() || !workflowResult.value) {
      throw new Error('Workflow not found');
    }
    const stages = new Set<string>();

    for (const workflow of workflowResult.value) {
      const workflowData = workflow.data as WorkflowData
      const workflowNav = new WorkflowNavigatorService(workflowData, '');
      const data: string[] = workflowNav.getALLStageName();
      data.forEach(stage => stages.add(stage));
    }

    return {
      response: { status: 200 },
      data: Array.from(stages),
    };
  }
}
