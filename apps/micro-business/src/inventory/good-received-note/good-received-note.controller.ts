import { Controller, HttpStatus } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { GoodReceivedNoteService } from "./good-received-note.service";
import { GoodReceivedNoteLogic } from "./good-received-note.logic";
import { IGoodReceivedNoteCreate, IGoodReceivedNoteUpdate } from "./interface/good-received-note.interface";
import { BackendLogger } from "@/common/helpers/backend.logger";
import { runWithAuditContext, AuditContext } from "@repo/log-events-library";
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from "@/common";

@Controller()
export class GoodReceivedNoteController extends BaseMicroserviceController {
  private readonly logger = new BackendLogger(GoodReceivedNoteController.name);
  constructor(
    private readonly goodReceivedNoteService: GoodReceivedNoteService,
    private readonly goodReceivedNoteLogic: GoodReceivedNoteLogic,
  ) {
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
   * Find a good received note by ID
   * ค้นหาใบรับสินค้ารายการเดียวตาม ID
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Good received note detail / รายละเอียดใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note.findOne",
    service: "good-received-note",
  })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findOne", payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findOne(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all good received notes with pagination
   * ค้นหาใบรับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Contains user_id, tenant_id, paginate / ประกอบด้วย user_id, tenant_id, paginate
   * @returns Paginated list of good received notes / รายการใบรับสินค้าแบบแบ่งหน้า
   */
  @MessagePattern({
    cmd: "good-received-note.findAll",
    service: "good-received-note",
  })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findAll", payload: payload }, GoodReceivedNoteController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findAll(user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Create a new good received note
   * สร้างใบรับสินค้าใหม่
   * @param payload - Contains data, user_id, tenant_id / ประกอบด้วย data, user_id, tenant_id
   * @returns Created good received note / ใบรับสินค้าที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: "good-received-note.findByVendorId",
    service: "good-received-note",
  })
  async findByVendorId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findByVendorId", payload }, GoodReceivedNoteController.name);
    const vendor_id = payload.vendor_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findByVendorId(vendor_id, user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find Good Received Notes by vendor filtered for Credit Note selection
   * ค้นหาใบรับสินค้าของผู้ขายสำหรับใช้เลือกตอนสร้างใบลดหนี้
   * @param payload - Contains vendor_id, user_id, tenant_id, paginate / ประกอบด้วย vendor_id, user_id, tenant_id, paginate
   * @returns Paginated list of GRNs with doc_status in (saved, committed) / รายการใบรับสินค้าที่สถานะเป็น saved หรือ committed แบบแบ่งหน้า
   */
  @MessagePattern({
    cmd: "good-received-note.findByVendorIdForCn",
    service: "good-received-note",
  })
  async findByVendorIdForCn(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findByVendorIdForCn", payload }, GoodReceivedNoteController.name);
    const vendor_id = payload.vendor_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findByVendorIdForCn(vendor_id, user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  @MessagePattern({
    cmd: "good-received-note.create",
    service: "good-received-note",
  })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "create", payload: payload }, GoodReceivedNoteController.name);
    const data: IGoodReceivedNoteCreate = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    try {
      const result = await runWithAuditContext(auditContext, () =>
        this.goodReceivedNoteService.create(data, user_id, tenant_id),
      );
      this.logger.debug({ function: "create", result: result }, GoodReceivedNoteController.name);
      if (!result) {
        return {
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Service returned undefined result",
            timestamp: new Date().toISOString(),
          },
        };
      }
      return this.handleResult(result, HttpStatus.CREATED);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        { function: "create", error: errorMessage, stack: errorStack },
        GoodReceivedNoteController.name,
      );
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage || "Unknown error in create",
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Update a good received note
   * แก้ไขใบรับสินค้า
   * @param payload - Contains updateGoodReceivedNoteDto, user_id, tenant_id / ประกอบด้วย updateGoodReceivedNoteDto, user_id, tenant_id
   * @returns Updated good received note / ใบรับสินค้าที่แก้ไขแล้ว
   */
  @MessagePattern({
    cmd: "good-received-note.update",
    service: "good-received-note",
  })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "update", payload: payload }, GoodReceivedNoteController.name);
    const data: IGoodReceivedNoteUpdate = payload.updateGoodReceivedNoteDto;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.update(data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a good received note
   * ลบใบรับสินค้า
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({
    cmd: "good-received-note.delete",
    service: "good-received-note",
  })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "delete", payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.delete(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Regenerate amount totals on tb_good_received_note from detail items.
   * Recomputes one GRN if payload.id is provided, otherwise all non-deleted GRNs in tenant.
   */
  @MessagePattern({
    cmd: "good-received-note.regenerate-totals",
    service: "good-received-note",
  })
  async regenerateTotals(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "regenerateTotals", payload }, GoodReceivedNoteController.name);
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const id = payload.id as string | undefined;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.regenerateTotals(user_id, tenant_id, id),
    );
    return this.handleResult(result);
  }

  /**
   * Export a good received note to Excel
   * ส่งออกใบรับสินค้าเป็นไฟล์ Excel
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Excel export data / ข้อมูลส่งออก Excel
   */
  @MessagePattern({
    cmd: "good-received-note.export",
    service: "good-received-note",
  })
  async exportToExcel(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "exportToExcel", payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.exportToExcel(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Reject a good received note
   * ปฏิเสธใบรับสินค้า
   * @param payload - Contains id, reason, user_id, tenant_id / ประกอบด้วย id, reason, user_id, tenant_id
   * @returns Rejected good received note / ใบรับสินค้าที่ปฏิเสธแล้ว
   */
  @MessagePattern({
    cmd: "good-received-note.reject",
    service: "good-received-note",
  })
  async reject(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "reject", payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const reason = payload.reason || "";
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteLogic.reject(id, reason, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Approve a good received note
   * อนุมัติใบรับสินค้า
   * @param payload - Contains id, user_id, tenant_id / ประกอบด้วย id, user_id, tenant_id
   * @returns Approved good received note / ใบรับสินค้าที่อนุมัติแล้ว
   */
  @MessagePattern({
    cmd: "good-received-note.approve",
    service: "good-received-note",
  })
  async approve(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "approve", payload: payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteLogic.approve(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Save a good received note — sets status to saved, creates inventory transactions, updates PO received quantities
   * บันทึกใบรับสินค้า — เปลี่ยนสถานะเป็น saved, สร้าง inventory transactions, อัปเดตจำนวนรับใน PO
   */
  @MessagePattern({
    cmd: "good-received-note.save",
    service: "good-received-note",
  })
  async save(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "save", payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const data = payload.data || {};
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteLogic.save(id, data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Commit a good received note — changes status from saved to committed
   * ยืนยันใบรับสินค้า — เปลี่ยนสถานะจาก saved เป็น committed
   */
  @MessagePattern({
    cmd: "good-received-note.commit",
    service: "good-received-note",
  })
  async commit(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "commit", payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const data = payload.data || {};
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteLogic.commit(id, data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Void a good received note
   * ยกเลิกใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note.void",
    service: "good-received-note",
  })
  async voidGrn(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "voidGrn", payload }, GoodReceivedNoteController.name);
    const id = payload.id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.voidGrnById(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  // ==================== Good Received Note Detail CRUD ====================

  /**
   * Find a good received note detail by ID
   * ค้นหารายละเอียดใบรับสินค้าตาม ID
   * @param payload - Contains detail_id, user_id, tenant_id / ประกอบด้วย detail_id, user_id, tenant_id
   * @returns Good received note detail / รายละเอียดใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note-detail.find-by-id",
    service: "good-received-note",
  })
  async getDetailById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "getDetailById", payload: payload }, GoodReceivedNoteController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findDetailById(detailId, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Find all details of a good received note
   * ค้นหารายละเอียดทั้งหมดของใบรับสินค้า
   * @param payload - Contains grn_id, user_id, tenant_id / ประกอบด้วย grn_id, user_id, tenant_id
   * @returns List of good received note details / รายการรายละเอียดใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note-detail.find-all",
    service: "good-received-note",
  })
  async getDetailsByGrnId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "getDetailsByGrnId", payload: payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findDetailsByGrnId(grnId, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Create a detail item for a good received note
   * สร้างรายละเอียดสินค้าในใบรับสินค้า
   * @param payload - Contains grn_id, data, user_id, tenant_id / ประกอบด้วย grn_id, data, user_id, tenant_id
   * @returns Created detail item / รายละเอียดสินค้าที่สร้างแล้ว
   */
  @MessagePattern({
    cmd: "good-received-note-detail.create",
    service: "good-received-note",
  })
  async createDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "createDetail", payload: payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.createDetail(grnId, data, user_id, tenant_id),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update a detail item of a good received note
   * แก้ไขรายละเอียดสินค้าในใบรับสินค้า
   * @param payload - Contains detail_id, data, user_id, tenant_id / ประกอบด้วย detail_id, data, user_id, tenant_id
   * @returns Updated detail item / รายละเอียดสินค้าที่แก้ไขแล้ว
   */
  @MessagePattern({
    cmd: "good-received-note-detail.update",
    service: "good-received-note",
  })
  async updateDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "updateDetail", payload: payload }, GoodReceivedNoteController.name);
    const detailId = payload.detail_id;
    const data = payload.data;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.updateDetail(detailId, data, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a detail item of a good received note
   * ลบรายละเอียดสินค้าในใบรับสินค้า
   * @param payload - Contains detail_id, user_id, tenant_id / ประกอบด้วย detail_id, user_id, tenant_id
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @MessagePattern({
    cmd: "good-received-note-detail.delete",
    service: "good-received-note",
  })
  async deleteDetail(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "deleteDetail", payload: payload }, GoodReceivedNoteController.name);
    const detailId = payload.detail_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.deleteDetail(detailId, user_id, tenant_id),
    );
    return this.handleResult(result);
  }

  // ==================== Sub-resource list endpoints (products/locations in a GRN) ====================

  /**
   * List distinct products in a GRN
   * ค้นหาสินค้าแบบไม่ซ้ำในใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note.findProductsByGrnId",
    service: "good-received-note",
  })
  async findProductsByGrnId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findProductsByGrnId", payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findProductsByGrnId(grnId, user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * List locations for a specific product in a GRN
   * ค้นหาตำแหน่งจัดเก็บของสินค้าหนึ่งในใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note.findLocationsByGrnIdAndProductId",
    service: "good-received-note",
  })
  async findLocationsByGrnIdAndProductId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findLocationsByGrnIdAndProductId", payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const productId = payload.product_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findLocationsByGrnId(grnId, user_id, tenant_id, paginate, productId),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * List distinct locations in a GRN
   * ค้นหาตำแหน่งจัดเก็บแบบไม่ซ้ำในใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note.findLocationsByGrnId",
    service: "good-received-note",
  })
  async findLocationsByGrnId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findLocationsByGrnId", payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findLocationsByGrnId(grnId, user_id, tenant_id, paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * List products at a specific location in a GRN
   * ค้นหาสินค้าที่อยู่ในตำแหน่งจัดเก็บหนึ่งในใบรับสินค้า
   */
  @MessagePattern({
    cmd: "good-received-note.findProductsByGrnIdAndLocationId",
    service: "good-received-note",
  })
  async findProductsByGrnIdAndLocationId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: "findProductsByGrnIdAndLocationId", payload }, GoodReceivedNoteController.name);
    const grnId = payload.grn_id;
    const locationId = payload.location_id;
    const user_id = payload.user_id;
    const tenant_id = payload.tenant_id || payload.bu_code;
    const paginate = payload.paginate;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.findProductsByGrnId(grnId, user_id, tenant_id, paginate, locationId),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Print a goods received note via FastReport viewer (micro-report)
   * พิมพ์ใบรับสินค้าผ่าน FastReport viewer (micro-report)
   */
  @MessagePattern({
    cmd: 'good-received-note.printToReport',
    service: 'good-received-note',
  })
  async printToReport(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'printToReport', payload },
      GoodReceivedNoteController.name,
    );
    const { user_id, bu_code, id } = payload;
    const tenant_id = payload.tenant_id || bu_code;
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.goodReceivedNoteService.printToReport(id, user_id, tenant_id),
    );
    return this.handleResult(result);
  }
}
