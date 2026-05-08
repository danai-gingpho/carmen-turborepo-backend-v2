import { Controller, HttpStatus } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class LocationsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    LocationsController.name,
  );
  constructor(private readonly locationsService: LocationsService) {
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
   * Find a single location by ID
   * ค้นหารายการสถานที่เดียวตาม ID
   * @param payload - Microservice payload containing location ID / ข้อมูล payload ที่มี ID ของสถานที่
   * @returns Location detail / รายละเอียดสถานที่
   */
  @MessagePattern({ cmd: 'locations.findOne', service: 'locations' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, LocationsController.name);
    const id = payload.id;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    const withUser = payload?.withUser || false;
    const withProducts = payload?.withProducts || false;
    const version = payload?.version || 'latest';
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findOne(id, withUser, withProducts, version),
    );

    return this.handleResult(result);
  }

  /**
   * Find multiple locations by their IDs
   * ค้นหารายการสถานที่หลายรายการตาม ID
   * @param payload - Microservice payload containing array of location IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID สถานที่
   * @returns List of locations matching the IDs / รายการสถานที่ที่ตรงกับ ID
   */
  @MessagePattern({ cmd: 'locations.find-many-by-id', service: 'locations' })
  async findManyById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findManyById', payload }, LocationsController.name);
    const ids = payload.ids;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findManyById(ids, version),
    );
    return this.handleResult(result);
  }

  /**
   * Find all locations with pagination
   * ค้นหารายการสถานที่ทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of locations / รายการสถานที่พร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'locations.findAll', service: 'locations' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, LocationsController.name);
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findAll(payload.bu_code, paginate, version),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Find all locations assigned to the current user
   * ค้นหารายการสถานที่ทั้งหมดที่กำหนดให้ผู้ใช้ปัจจุบัน
   * @param payload - Microservice payload containing user context / ข้อมูล payload ที่มีบริบทผู้ใช้
   * @returns List of locations for the user / รายการสถานที่ของผู้ใช้
   */
  @MessagePattern({ cmd: 'locations.findAllByUser', service: 'locations' })
  async findAllByUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllByUser', payload }, LocationsController.name);
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findAllByUser(version),
    );
    return this.handleResult(result);
  }

  /**
   * Find all locations assigned to a specific product
   * ค้นหารายการสถานที่ทั้งหมดที่มอบหมายให้สินค้าที่ระบุ
   * @param payload - Microservice payload containing product ID / ข้อมูล payload ที่มี ID ของสินค้า
   * @returns List of locations for the product / รายการสถานที่ของสินค้า
   */
  @MessagePattern({ cmd: 'locations.findAllByProductId', service: 'locations' })
  async findAllByProductId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllByProductId', payload }, LocationsController.name);
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.findAllByProductId(payload.product_id, paginate, version),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Get product inventory at a specific location
   * ดึงสินค้าคงคลังที่สถานที่เฉพาะ
   * @param payload - Microservice payload containing location ID and product ID / ข้อมูล payload ที่มี ID สถานที่และ ID สินค้า
   * @returns Product inventory details / รายละเอียดสินค้าคงคลัง
   */
  @MessagePattern({ cmd: 'locations-product.getProductInventory', service: 'locations-product-inventory' })
  async getProductInventory(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getProductInventory', payload }, LocationsController.name);
    const location_id = payload.location_id;
    const product_id = payload.product_id;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.getProductInventory(location_id, product_id, version),
    );
    return this.handleResult(result);
  }

  /**
   * Create a new location
   * สร้างสถานที่ใหม่
   * @param payload - Microservice payload containing location data / ข้อมูล payload ที่มีข้อมูลสถานที่
   * @returns Created location ID / ID ของสถานที่ที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'locations.create', service: 'locations' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, LocationsController.name);
    const data = payload.data;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.create(data, version),
    );
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing location
   * อัปเดตสถานที่ที่มีอยู่
   * @param payload - Microservice payload containing updated location data / ข้อมูล payload ที่มีข้อมูลสถานที่ที่อัปเดต
   * @returns Updated location ID / ID ของสถานที่ที่อัปเดต
   */
  @MessagePattern({ cmd: 'locations.update', service: 'locations' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, LocationsController.name);
    const data = payload.data;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.update(data, version),
    );
    return this.handleResult(result);
  }

  /**
   * Delete a location (soft delete)
   * ลบสถานที่ (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing location ID / ข้อมูล payload ที่มี ID ของสถานที่
   * @returns Deleted location ID / ID ของสถานที่ที่ลบ
   */
  @MessagePattern({ cmd: 'locations.getLocationsByUserId', service: 'locations' })
  async getLocationsByUserId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getLocationsByUserId', payload }, LocationsController.name);
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.getLocationsByUserId(payload.target_user_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'locations.updateUserLocations', service: 'locations' })
  async updateUserLocations(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'updateUserLocations', payload }, LocationsController.name);
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.updateUserLocations(payload.target_user_id, payload.location_ids),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'locations.delete', service: 'locations' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, LocationsController.name);
    const id = payload.id;
    this.locationsService.userId = payload.user_id;
    this.locationsService.bu_code = payload.bu_code;
    await this.locationsService.initializePrismaService(payload.bu_code, payload.user_id);
    const version = payload?.version || 'latest';

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.locationsService.delete(id, version),
    );
    return this.handleResult(result);
  }
}
