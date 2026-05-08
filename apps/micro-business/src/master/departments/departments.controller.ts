import { Controller, HttpStatus } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ICreateDepartments } from './interface/departments.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class DepartmentsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentsController.name,
  );
  constructor(private readonly departmentsService: DepartmentsService) {
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
   * Find a single department by ID with optional user details
   * ค้นหารายการแผนกเดียวตาม ID พร้อมรายละเอียดผู้ใช้ (ถ้าต้องการ)
   * @param payload - Microservice payload containing department ID and withUsers flag / ข้อมูล payload ที่มี ID แผนกและตัวเลือกรวมผู้ใช้
   * @returns Department detail / รายละเอียดแผนก
   */
  @MessagePattern({ cmd: 'departments.findOne', service: 'departments' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, DepartmentsController.name);
    const id = payload.id;
    const withUsers = payload?.withUsers ?? false;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.findOne(id, withUsers),
    );
    return this.handleResult(result);
  }

  /**
   * Find all departments with pagination
   * ค้นหารายการแผนกทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of departments / รายการแผนกพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'departments.findAll', service: 'departments' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, DepartmentsController.name);
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    const paginate = payload.paginate;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.findAll(paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new department
   * สร้างแผนกใหม่
   * @param payload - Microservice payload containing department data / ข้อมูล payload ที่มีข้อมูลแผนก
   * @returns Created department ID / ID ของแผนกที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'departments.create', service: 'departments' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, DepartmentsController.name);
    const data: ICreateDepartments = payload.data;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.create(data),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing department
   * อัปเดตแผนกที่มีอยู่
   * @param payload - Microservice payload containing updated department data / ข้อมูล payload ที่มีข้อมูลแผนกที่อัปเดต
   * @returns Updated department ID / ID ของแผนกที่อัปเดต
   */
  @MessagePattern({ cmd: 'departments.update', service: 'departments' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, DepartmentsController.name);
    const data = payload.data;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.update(data),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a department (soft delete)
   * ลบแผนก (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing department ID / ข้อมูล payload ที่มี ID ของแผนก
   * @returns Deleted department ID / ID ของแผนกที่ลบ
   */
  @MessagePattern({ cmd: 'departments.delete', service: 'departments' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, DepartmentsController.name);
    const id = payload.id;
    this.departmentsService.userId = payload.user_id;
    this.departmentsService.bu_code = payload.bu_code;
    await this.departmentsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.departmentsService.delete(id),
    );
    return this.handleResult(result);
  }
}
