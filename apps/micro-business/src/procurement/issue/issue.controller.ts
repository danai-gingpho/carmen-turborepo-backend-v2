import { Body, Controller } from "@nestjs/common";
import { IssueService } from "./issue.service";
import { MessagePattern } from "@nestjs/microservices";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class IssueController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(IssueController.name);
  constructor(private readonly issueService: IssueService) {
    super();
  }

  /**
   * Create an audit context from the microservice payload
   * สร้าง audit context จาก payload ของไมโครเซอร์วิส
   * @param payload - Microservice payload containing tenant and user info / payload ของไมโครเซอร์วิสที่มีข้อมูลผู้เช่าและผู้ใช้
   * @returns Audit context object / ออบเจกต์ audit context
   */
  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Find all issues with pagination
   * ค้นหาปัญหาทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Payload containing pagination parameters / payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of issues / รายการปัญหาที่แบ่งหน้าแล้ว
   */
  @MessagePattern({
    cmd: 'issue.find-all',
    service: 'issue',
  })
  async findAll(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.findAll(payload.paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find an issue by ID
   * ค้นหาปัญหารายการเดียวตาม ID
   * @param payload - Payload containing the issue ID / payload ที่มี ID ของปัญหา
   * @returns Issue data / ข้อมูลปัญหา
   */
  @MessagePattern({
    cmd: 'issue.find-one',
    service: 'issue',
  })
  async findOne(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.findOne(payload.id));
    return this.handleResult(result);
  }

  /**
   * Create a new issue
   * สร้างปัญหาใหม่
   * @param payload - Payload containing issue data / payload ที่มีข้อมูลปัญหา
   * @returns Created issue / ปัญหาที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: 'issue.create',
    service: 'issue',
  })
  async create(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.create(payload.data));
    return this.handleResultCreate(result);
  }

  /**
   * Update an existing issue
   * อัปเดตปัญหาที่มีอยู่
   * @param payload - Payload containing issue ID and updated data / payload ที่มี ID ปัญหาและข้อมูลที่อัปเดต
   * @returns Updated issue / ปัญหาที่อัปเดตแล้ว
   */
  @MessagePattern({
    cmd: 'issue.update',
    service: 'issue',
  })
  async update(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.update(payload.id, payload.data));
    return this.handleResult(result);
  }

  /**
   * Delete an issue by ID (soft delete)
   * ลบปัญหาตาม ID (ลบแบบซอฟต์)
   * @param payload - Payload containing the issue ID to delete / payload ที่มี ID ของปัญหาที่ต้องการลบ
   * @returns Deleted issue ID / ID ของปัญหาที่ลบแล้ว
   */
  @MessagePattern({
    cmd: 'issue.delete',
    service: 'issue',
  })
  async delete(@Body() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, IssueController.name);
    await this.issueService.initializePrismaService(payload.tenant_id || payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.issueService.delete(payload.id));
    return this.handleResult(result);
  }
}
