import { Controller, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Payload } from '@nestjs/microservices';
import { MessagePattern } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { BaseMicroserviceController, MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class ProductsController extends BaseMicroserviceController {
  private readonly logger: BackendLogger = new BackendLogger(
    ProductsController.name,
  );
  constructor(private readonly productsService: ProductsService) {
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
   * Find a single product by ID
   * ค้นหารายการสินค้าเดียวตาม ID
   * @param payload - Microservice payload containing product ID / ข้อมูล payload ที่มี ID ของสินค้า
   * @returns Product detail / รายละเอียดสินค้า
   */
  @MessagePattern({ cmd: 'products.findOne', service: 'products' })
  async findOne(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findOne', payload }, ProductsController.name);
    const id = payload.id;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findOne(id));
    return this.handleResult(result);
  }

  /**
   * Find all products with pagination
   * ค้นหารายการสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing pagination parameters / ข้อมูล payload ที่มีพารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of products / รายการสินค้าพร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'products.findAll', service: 'products' })
  async findAll(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAll', payload }, ProductsController.name);
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findAll(paginate));
    return this.handlePaginatedResult(result);
  }

  /**
   * Find multiple products by their IDs
   * ค้นหารายการสินค้าหลายรายการตาม ID
   * @param payload - Microservice payload containing array of product IDs / ข้อมูล payload ที่มีอาร์เรย์ของ ID สินค้า
   * @returns List of products matching the IDs / รายการสินค้าที่ตรงกับ ID
   */
  @MessagePattern({ cmd: 'products.find-many-by-id', service: 'products' })
  async findManyById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findManyById', payload }, ProductsController.name);
    const ids = payload.ids;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findManyById(ids));
    return this.handleResult(result);
  }

  /**
   * Create a new product
   * สร้างสินค้าใหม่
   * @param payload - Microservice payload containing product data / ข้อมูล payload ที่มีข้อมูลสินค้า
   * @returns Created product ID / ID ของสินค้าที่สร้างขึ้น
   */
  @MessagePattern({ cmd: 'products.create', service: 'products' })
  async create(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'create', payload }, ProductsController.name);
    const data = payload.data;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.create(data));
    return this.handleResult(result, HttpStatus.CREATED);
  }

  /**
   * Update an existing product
   * อัปเดตสินค้าที่มีอยู่
   * @param payload - Microservice payload containing updated product data / ข้อมูล payload ที่มีข้อมูลสินค้าที่อัปเดต
   * @returns Updated product ID / ID ของสินค้าที่อัปเดต
   */
  @MessagePattern({ cmd: 'products.update', service: 'products' })
  async update(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'update', payload }, ProductsController.name);
    const data = payload.data;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.update(data));
    return this.handleResult(result);
  }

  /**
   * Delete a product (soft delete)
   * ลบสินค้า (ลบแบบซอฟต์)
   * @param payload - Microservice payload containing product ID / ข้อมูล payload ที่มี ID ของสินค้า
   * @returns Deleted product ID / ID ของสินค้าที่ลบ
   */
  @MessagePattern({ cmd: 'products.delete', service: 'products' })
  async delete(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'delete', payload }, ProductsController.name);
    const id = payload.id;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.delete(id));
    return this.handleResult(result);
  }

  /**
   * Find the item group hierarchy for a product
   * ค้นหาลำดับชั้นกลุ่มสินค้าของสินค้า
   * @param payload - Microservice payload containing item group ID / ข้อมูล payload ที่มี ID ของกลุ่มสินค้า
   * @returns Item group with sub-category and category / กลุ่มสินค้าพร้อมหมวดหมู่ย่อยและหมวดหมู่
   */
  @MessagePattern({ cmd: 'products.findItemGroup', service: 'products' })
  async findItemGroup(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findItemGroup', payload }, ProductsController.name);
    const id = payload.id;
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.findItemGroup(id));
    return this.handleResult(result);
  }

  /**
   * Get products by location ID with pagination
   * ดึงรายการสินค้าตาม ID สถานที่พร้อมการแบ่งหน้า
   * @param payload - Microservice payload containing location ID and pagination / ข้อมูล payload ที่มี ID สถานที่และการแบ่งหน้า
   * @returns Paginated list of products at the location / รายการสินค้าที่สถานที่พร้อมการแบ่งหน้า
   */
  @MessagePattern({ cmd: 'products.getByLocationId', service: 'products' })
  async getByLocationId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getByLocationId', payload },
      ProductsController.name,
    );
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);
    const location_id = payload.location_id;
    const paginate = payload.paginate;
    const version = payload.version;

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () => this.productsService.getByLocationId(
      location_id,
      paginate,
      version,
    ));
    return this.handlePaginatedResult(result);
  }

  /**
   * ค้นหา product_location ตาม product_id
   */
  @MessagePattern({ cmd: 'productLocation.findByProductId', service: 'product-location' })
  async findProductLocationsByProductId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findProductLocationsByProductId', payload }, ProductsController.name);
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.findProductLocationsByProductId(payload.product_id),
    );
    return this.handleResult(result);
  }

  /**
   * ค้นหา location ทั้งหมดพร้อม products ในแต่ละ location
   */
  @MessagePattern({ cmd: 'productLocation.findAllLocationsWithProducts', service: 'product-location' })
  async findAllLocationsWithProducts(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findAllLocationsWithProducts', payload }, ProductsController.name);
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.findAllLocationsWithProducts(payload.paginate, payload.search, payload.category_id),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * ค้นหา product_location ตาม location_id
   */
  @MessagePattern({ cmd: 'productLocation.findByLocationId', service: 'product-location' })
  async findProductLocationsByLocationId(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'findProductLocationsByLocationId', payload }, ProductsController.name);
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.findProductLocationsByLocationId(payload.location_id, payload.paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * เปรียบเทียบสินค้าระหว่าง 2 สถานที่
   */
  @MessagePattern({ cmd: 'productLocation.compare', service: 'product-location' })
  async compareProductLocations(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'compareProductLocations', payload }, ProductsController.name);
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.compareProductLocations(payload.location_id_1, payload.location_id_2, payload.paginate),
    );
    return this.handlePaginatedResult(result);
  }

  /**
   * Refresh denormalized fields in tb_product_location
   * อัปเดตฟิลด์ denormalized จาก tb_product และ tb_location
   */
  @MessagePattern({ cmd: 'productLocation.refresh', service: 'product-location' })
  async refreshProductLocations(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'refreshProductLocations', payload }, ProductsController.name);
    this.productsService.userId = payload.user_id;
    this.productsService.bu_code = payload.bu_code;
    await this.productsService.initializePrismaService(payload.bu_code, payload.user_id);

    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.refreshProductLocations(),
    );
    return this.handleResult(result);
  }

  /**
   * Get last GRN by product ID and date
   * ค้นหาใบรับสินค้าล่าสุดตาม ID สินค้าและวันที่
   */
  @MessagePattern({ cmd: 'product.get-last-purchase', service: 'product' })
  async getLastPurchase(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getLastPurchase', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.getLastPurchase(payload.product_id, payload.date),
    );
    return this.handleResult(result);
  }

  /**
   * Get on-hand quantity for a product
   * ดึงจำนวนสินค้าคงเหลือ
   */
  @MessagePattern({ cmd: 'product.get-on-hand', service: 'product' })
  async getOnHand(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getOnHand', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.getOnHand(payload.product_id, payload.location_id),
    );
    return this.handleResult(result);
  }

  /**
   * Get product cost by location
   * ดึงต้นทุนสินค้าตามสถานที่
   */
  @MessagePattern({ cmd: 'product.get-cost', service: 'product' })
  async getProductCost(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getProductCost', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.getProductCost(payload.product_id, payload.location_id, payload.quantity),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'product.get-on-order', service: 'product' })
  async getOnOrder(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getOnOrder', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.getOnOrder(payload.product_id),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'product.get-cost-estimate', service: 'product' })
  async getProductCostEstimate(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getProductCostEstimate', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.getProductCostEstimate(payload.product_id, payload.location_id, Number(payload.quantity)),
    );
    return this.handleResult(result);
  }

  @MessagePattern({ cmd: 'product.get-last-receiving', service: 'product' })
  async getLastReceiving(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getLastReceiving', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.getLastReceiving(payload.product_id),
    );
    return this.handleResult(result);
  }

  /**
   * Get inventory movement (stock card) for a product over a date range
   * ดึงรายการเคลื่อนไหวสินค้าตามช่วงวันที่ (สมุดสต็อก)
   */
  @MessagePattern({ cmd: 'product.get-inventory-movement', service: 'product' })
  async getInventoryMovement(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'getInventoryMovement', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.getInventoryMovement(
        payload.product_id,
        payload.start_at,
        payload.end_at,
        payload.location_id,
      ),
    );
    return this.handleResult(result);
  }

  /**
   * List products that have at least one inventory movement
   * ดึงสินค้าที่เคยมีการเคลื่อนไหวสต็อก
   */
  @MessagePattern({ cmd: 'product.list-with-movement', service: 'product' })
  async listProductsWithMovement(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'listProductsWithMovement', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.listProductsWithMovement(),
    );
    return this.handleResult(result);
  }

  /**
   * List locations that have inventory movement for a given product
   * ดึงสถานที่ที่มีการเคลื่อนไหวสต็อกสำหรับสินค้าที่ระบุ
   */
  @MessagePattern({ cmd: 'product.list-locations-with-movement', service: 'product' })
  async listLocationsWithMovement(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'listLocationsWithMovement', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.listLocationsWithMovement(payload.product_id),
    );
    return this.handleResult(result);
  }

  /**
   * List locations that have any inventory movement
   * ดึงสถานที่ที่มีการเคลื่อนไหวสต็อก (ไม่ระบุสินค้า)
   */
  @MessagePattern({ cmd: 'product.list-locations-with-any-movement', service: 'product' })
  async listLocationsWithAnyMovement(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'listLocationsWithAnyMovement', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.listLocationsWithAnyMovement(),
    );
    return this.handleResult(result);
  }

  /**
   * List products that have movement at a given location
   * ดึงสินค้าที่มีการเคลื่อนไหวสต็อกที่สถานที่ที่ระบุ
   */
  @MessagePattern({ cmd: 'product.list-products-with-movement-at-location', service: 'product' })
  async listProductsWithMovementAtLocation(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'listProductsWithMovementAtLocation', payload }, ProductsController.name);
    const bu_code = payload.bu_code;
    const user_id = payload.user_id;
    this.productsService.userId = user_id;
    this.productsService.bu_code = bu_code;
    await this.productsService.initializePrismaService(bu_code, user_id);
    const auditContext = this.createAuditContext(payload);
    const result = await runWithAuditContext(auditContext, () =>
      this.productsService.listProductsWithMovementAtLocation(payload.location_id),
    );
    return this.handleResult(result);
  }
}
