import { Controller } from '@nestjs/common';
import { RunningCodeService } from './running-code.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { ICommonResponse } from '@/common/interface/common.interface';
import { IPattern } from '@/common/helpers/running-code.helper';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { MicroservicePayload } from '@/common';

@Controller()
export class RunningCodeController {
  private readonly logger: BackendLogger = new BackendLogger(
    RunningCodeController.name,
  );
  constructor(private readonly runningCodeService: RunningCodeService) {}

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
   * Find a single running code configuration by ID
   * ค้นหารายการการตั้งค่ารหัสลำดับเดียวตาม ID
   * @param payload - Microservice payload containing running code ID / ข้อมูล payload ที่มี ID ของรหัสลำดับ
   * @returns Running code detail / รายละเอียดรหัสลำดับ
   */
  @MessagePattern({ cmd: 'running-code.findOne', service: 'running-codes' })
  async findOne(@Payload() payload: MicroservicePayload) : Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'findOne', payload }, RunningCodeController.name);
    const id = payload.id;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.findOne(id));
  }

  /**
   * Find all running code configurations with pagination
   * ค้นหารายการการตั้งค่ารหัสลำดับทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of running codes / รายการรหัสลำดับพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'running-code.findAll', service: 'running-codes' })
  async findAll(@Payload() payload: MicroservicePayload) : Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'findAll', payload }, RunningCodeController.name);
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.findAll(paginate));
  }

  /**
   * Find a running code configuration by type
   * ค้นหาการตั้งค่ารหัสลำดับตามประเภท
   * @param payload - Microservice payload containing running code type / ข้อมูล payload ที่มีประเภทรหัสลำดับ
   * @returns Running code configuration for the type / การตั้งค่ารหัสลำดับสำหรับประเภท
   */
  @MessagePattern({
    cmd: 'running-code.find-by-type',
    service: 'running-codes',
  })
  async findByType(@Payload() payload: MicroservicePayload) : Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'findByType', payload }, RunningCodeController.name);
    const type = payload.type;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.findByType(type));
  }

  /**
   * Initialize all default running code configurations
   * สร้างการตั้งค่ารหัสลำดับเริ่มต้นทั้งหมด (PL, PR, SI, SO, PO, GRN, CN)
   * @param payload - Microservice payload / ข้อมูล payload
   * @returns List of initialized running codes / รายการรหัสลำดับที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'running-code.init', service: 'running-codes' })
  async init(@Payload() payload: MicroservicePayload): Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'init', payload }, RunningCodeController.name);
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.init());
  }

  /**
   * Create a new running code configuration
   * สร้างการตั้งค่ารหัสลำดับใหม่
   * @param payload - Microservice payload containing running code data / ข้อมูล payload ที่มีข้อมูลรหัสลำดับ
   * @returns Created running code ID / ID ของรหัสลำดับที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'running-code.create', service: 'running-codes' })
  async create(@Payload() payload: MicroservicePayload) : Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'create', payload }, RunningCodeController.name);
    const data = payload.data;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.create(data));
  }

  /**
   * Update an existing running code configuration
   * อัปเดตการตั้งค่ารหัสลำดับที่มีอยู่
   * @param payload - Microservice payload containing updated running code data / ข้อมูล payload ที่มีข้อมูลรหัสลำดับที่อัปเดต
   * @returns Updated running code ID / ID ของรหัสลำดับที่อัปเดต
   */
  @MessagePattern({ cmd: 'running-code.update', service: 'running-codes' })
  async update(@Payload() payload: MicroservicePayload) : Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'update', payload }, RunningCodeController.name);
    const data = payload.data;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.update(data));
  }

  /**
   * Delete a running code configuration (soft delete)
   * ลบการตั้งค่ารหัสลำดับ (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing running code ID / ข้อมูล payload ที่มี ID ของรหัสลำดับ
   * @returns Deleted running code ID / ID ของรหัสลำดับที่ลบ
   */
  @MessagePattern({ cmd: 'running-code.delete', service: 'running-codes' })
  async delete(@Payload() payload: MicroservicePayload) : Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'delete', payload }, RunningCodeController.name);
    const id = payload.id;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.delete(id));
  }

  /**
   * Generate a new running code based on type, date, and last number
   * สร้างรหัสลำดับใหม่ตามประเภท วันที่ และหมายเลขล่าสุด
   * @param payload - Microservice payload containing type, issueDate, and last_no / ข้อมูล payload ที่มีประเภท วันที่ออก และหมายเลขล่าสุด
   * @returns Generated code / รหัสที่สร้างขึ้น
   */
  @MessagePattern({
    cmd: 'running-code.generate-code',
    service: 'running-codes',
  })
  async generateCode(@Payload() payload: MicroservicePayload) : Promise<ICommonResponse<unknown>> {
    this.logger.debug({ function: 'generateCode', payload }, RunningCodeController.name);
    const type = payload.type;
    const issueDate = payload.issueDate;
    const last_no = payload.last_no;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.generateCode(
      type,
      issueDate,
      last_no,
    ));
  }

  /**
   * Get running code pattern configuration by type
   * ดึงการตั้งค่ารูปแบบรหัสลำดับตามประเภท
   * @param payload - Microservice payload containing running code type / ข้อมูล payload ที่มีประเภทรหัสลำดับ
   * @returns Running code pattern / รูปแบบรหัสลำดับ
   */
  @MessagePattern({
    cmd: 'running-code.get-pattern-by-type',
    service: 'running-codes',
  })
  async getRunningPatternByType(
    @Payload() payload: MicroservicePayload,
  ): Promise<ICommonResponse<IPattern[]>> {
    this.logger.debug(
      { function: 'getRunningPatternByType', payload },
      RunningCodeController.name,
    );
    const type = payload.type;
    this.runningCodeService.userId = payload.user_id;
    this.runningCodeService.bu_code = payload.bu_code;
    await this.runningCodeService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.runningCodeService.getRunningPatternByType(
      type,
    ));
  }
}
