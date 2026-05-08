import { Controller, HttpStatus } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { WorkflowNavigatorService } from './workflows.navagation.service';
import { GlobalApiReturn, NavigateForwardResult, NavigationHistory, NavigationInfo, Stage, WorkflowData, BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';
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

  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find a single workflow by ID
   * ค้นหารายการเวิร์กโฟลว์เดียวตาม ID
   * @param payload - Microservice payload containing workflow ID / ข้อมูล payload ที่มี ID ของเวิร์กโฟลว์
   * @returns Workflow detail / รายละเอียดเวิร์กโฟลว์
   */
  @MessagePattern({ cmd: 'workflows.findOne', service: 'workflows' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, WorkflowsController.name);
    const id = payload.id;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all workflows with pagination
   * ค้นหารายการเวิร์กโฟลว์ทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of workflows / รายการเวิร์กโฟลว์พร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'workflows.findAll', service: 'workflows' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, WorkflowsController.name);
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find workflows by type
   * ค้นหาเวิร์กโฟลว์ตามประเภท
   * @param payload - Microservice payload containing workflow type / ข้อมูล payload ที่มีประเภทเวิร์กโฟลว์
   * @returns Paginated list of workflows matching the type / รายการเวิร์กโฟลว์ที่ตรงกับประเภทพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'workflows.find-by-type', service: 'workflows' })
  async findByType(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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

  /**
   * Create a new workflow
   * สร้างเวิร์กโฟลว์ใหม่
   * @param payload - Microservice payload containing workflow data / ข้อมูล payload ที่มีข้อมูลเวิร์กโฟลว์
   * @returns Created workflow ID / ID ของเวิร์กโฟลว์ที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'workflows.create', service: 'workflows' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, WorkflowsController.name);
    const data = payload.data;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing workflow
   * อัปเดตเวิร์กโฟลว์ที่มีอยู่
   * @param payload - Microservice payload containing updated workflow data / ข้อมูล payload ที่มีข้อมูลเวิร์กโฟลว์ที่อัปเดต
   * @returns Updated workflow ID / ID ของเวิร์กโฟลว์ที่อัปเดต
   */
  @MessagePattern({ cmd: 'workflows.update', service: 'workflows' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, WorkflowsController.name);
    const data = payload.data;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a workflow (soft delete)
   * ลบเวิร์กโฟลว์ (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing workflow ID / ข้อมูล payload ที่มี ID ของเวิร์กโฟลว์
   * @returns Deleted workflow ID / ID ของเวิร์กโฟลว์ที่ลบ
   */
  @MessagePattern({ cmd: 'workflows.delete', service: 'workflows' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, WorkflowsController.name);
    const id = payload.id;
    this.workflowsService.userId = payload.user_id;
    this.workflowsService.bu_code = payload.bu_code;
    await this.workflowsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.workflowsService.delete(id));
    return this.handleResult(result);
  }

  /**
   * Get workflow navigation information for forward navigation
   * ดึงข้อมูลการนำทางเวิร์กโฟลว์สำหรับการนำทางไปข้างหน้า
   * @param payload - Microservice payload containing workflow data, current status, and request data / ข้อมูล payload ที่มีข้อมูลเวิร์กโฟลว์ สถานะปัจจุบัน และข้อมูลคำขอ
   * @returns Forward navigation result / ผลการนำทางไปข้างหน้า
   */
  @MessagePattern({ cmd: 'workflows.get-workflow-navigation', service: 'workflows' })
  async getWorkflowNavigation(@Payload() payload: MicroservicePayload): Promise<NavigateForwardResult> {
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

  /**
   * Navigate back to a previous workflow stage
   * นำทางกลับไปยังขั้นตอนเวิร์กโฟลว์ก่อนหน้า
   * @param payload - Microservice payload containing workflow ID, target stage, and current stage / ข้อมูล payload ที่มี ID ของเวิร์กโฟลว์ ขั้นตอนเป้าหมาย และขั้นตอนปัจจุบัน
   * @returns Navigation result with previous/current stage and history / ผลการนำทางพร้อมขั้นตอนก่อน/ปัจจุบันและประวัติ
   */
  @MessagePattern({ cmd: 'workflows.navigate-back-to-stage', service: 'workflows' })
  async navigateBackToStage(@Payload() payload: MicroservicePayload): Promise<GlobalApiReturn<{
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

  /**
   * Get all previous stages for a given workflow stage
   * ดึงขั้นตอนก่อนหน้าทั้งหมดของขั้นตอนเวิร์กโฟลว์ที่กำหนด
   * @param payload - Microservice payload containing workflow ID and stage name / ข้อมูล payload ที่มี ID ของเวิร์กโฟลว์และชื่อขั้นตอน
   * @returns List of previous stage names / รายการชื่อขั้นตอนก่อนหน้า
   */
  @MessagePattern({ cmd: 'workflows.get-previous-stages', service: 'workflows' })
  async getPreviousStages(@Payload() payload: MicroservicePayload): Promise<GlobalApiReturn<string[]>> {
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

  /**
   * Get detailed information for a specific workflow stage
   * ดึงข้อมูลรายละเอียดของขั้นตอนเวิร์กโฟลว์ที่กำหนด
   * @param payload - Microservice payload containing workflow ID and stage name / ข้อมูล payload ที่มี ID ของเวิร์กโฟลว์และชื่อขั้นตอน
   * @returns Stage detail or null if not found / รายละเอียดขั้นตอน หรือ null หากไม่พบ
   */
  @MessagePattern({ cmd: 'workflows.get-workflow-stage-detail', service: 'workflows' })
  async getWorkflowStageDetail(@Payload() payload: MicroservicePayload): Promise<GlobalApiReturn<Stage | null>> {
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

  /**
   * Get all unique stage names across multiple workflows
   * ดึงชื่อขั้นตอนที่ไม่ซ้ำกันทั้งหมดจากหลายเวิร์กโฟลว์
   * @param payload - Microservice payload containing workflow IDs / ข้อมูล payload ที่มี ID ของเวิร์กโฟลว์หลายรายการ
   * @returns Unique list of stage names / รายการชื่อขั้นตอนที่ไม่ซ้ำกัน
   */
  @MessagePattern({ cmd: 'workflows.get-all-workflows-stages', service: 'workflows' })
  async getAllWorkflowStages(@Payload() payload: MicroservicePayload) {
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

  @MessagePattern({ cmd: 'workflows.patch-user-action', service: 'workflows' })
  async patchUserAction(@Payload() payload: MicroservicePayload) {
    this.logger.debug({ function: 'patchUserAction', payload }, WorkflowsController.name);
    const { doc_type, doc_id, user_ids } = payload.data || payload;
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    this.workflowsService.userId = user_id;
    this.workflowsService.bu_code = bu_code;
    await this.workflowsService.initializePrismaService(bu_code, user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.workflowsService.patchUserAction(doc_type, doc_id, user_ids),
    );
    return this.handleResult(result);
  }
}
