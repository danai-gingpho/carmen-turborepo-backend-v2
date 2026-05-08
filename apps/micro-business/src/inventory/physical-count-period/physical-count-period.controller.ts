import { Controller, HttpStatus } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { PhysicalCountPeriodService } from "./physical-count-period.service";
import { IPhysicalCountPeriodCreate, IPhysicalCountPeriodUpdate } from "./interface/physical-count-period.interface";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { runWithAuditContext, AuditContext } from "@repo/log-events-library";
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from "@/common";

@Controller()
export class PhysicalCountPeriodController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(PhysicalCountPeriodController.name);

  constructor(private readonly physicalCountPeriodService: PhysicalCountPeriodService) {
    super();
  }

  /**
   * Create audit context from payload
   * สร้างบริบทการตรวจสอบจาก payload
   * @param payload - Microservice payload / ข้อมูล payload จากไมโครเซอร์วิส
   * @returns Audit context object / ออบเจกต์บริบทการตรวจสอบ
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
   * Find a physical count period by ID
   * ค้นหารอบการตรวจนับสินค้ารายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Physical count period detail / รายละเอียดรอบการตรวจนับสินค้า
   */
  @MessagePattern({ cmd: "physical-count-period.findOne", service: "physical-count-period" })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findOne", payload }, PhysicalCountPeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all physical count periods with pagination
   * ค้นหารอบการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of physical count periods / รายการรอบการตรวจนับสินค้าแบบแบ่งหน้า
   */
  @MessagePattern({ cmd: "physical-count-period.findAll", service: "physical-count-period" })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findAll", payload }, PhysicalCountPeriodController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.findAll(user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find the current active physical count period
   * ค้นหารอบการตรวจนับสินค้าปัจจุบันที่เปิดใช้งาน
   * @param payload - Contains user_id, tenant_id / ประกอบด้วย user_id, tenant_id
   * @returns Current physical count period with locations / รอบการตรวจนับปัจจุบันพร้อมสถานที่
   */
  @MessagePattern({ cmd: "physical-count-period.current", service: "physical-count-period" })
  async findCurrent(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findCurrent", payload }, PhysicalCountPeriodController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const include_not_count = payload.include_not_count || false;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.findCurrent(user_id, tenant_id, include_not_count),
    );
    return this.handleResult(result);
  }

  /**
   * Create a new physical count period
   * สร้างรอบการตรวจนับสินค้าใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created physical count period / รอบการตรวจนับสินค้าที่สร้างแล้ว
   */
  @MessagePattern({ cmd: "physical-count-period.create", service: "physical-count-period" })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "create", payload }, PhysicalCountPeriodController.name);
    const data: IPhysicalCountPeriodCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.create(data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a physical count period
   * แก้ไขรอบการตรวจนับสินค้า
   * @param payload - Contains id, data, user_id, tenant_id / ประกอบด้วย id, data, user_id, tenant_id
   * @returns Updated physical count period / รอบการตรวจนับสินค้าที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: "physical-count-period.update", service: "physical-count-period" })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "update", payload }, PhysicalCountPeriodController.name);
    const data: IPhysicalCountPeriodUpdate = { id: payload.id, ...payload.data };
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.update(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a physical count period
   * ลบรอบการตรวจนับสินค้า
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({ cmd: "physical-count-period.delete", service: "physical-count-period" })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "delete", payload }, PhysicalCountPeriodController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.physicalCountPeriodService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
