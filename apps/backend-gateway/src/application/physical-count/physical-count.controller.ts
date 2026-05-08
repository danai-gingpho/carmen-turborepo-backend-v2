import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { PhysicalCountService } from './physical-count.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  PhysicalCountCreateRequestDto,
  PhysicalCountUpdateRequestDto,
  PhysicalCountSaveItemsRequestDto,
  PhysicalCountDetailCommentRequestDto,
} from './swagger/request';
import {
  PhysicalCountResponseDto,
} from './swagger/response';
import {
  BaseHttpController,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { PhysicalCountCreateDto, PhysicalCountUpdateDto } from 'src/common/dto/physical-count/physical-count.dto';

@Controller('api')
@ApiTags('Inventory: Physical Count')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PhysicalCountController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountController.name,
  );

  constructor(
    private readonly physicalCountService: PhysicalCountService,
  ) {
    super();
  }

  /**
   * Get pending physical count total for the current user
   * ดึงจำนวนการตรวจนับสินค้าที่รอดำเนินการของผู้ใช้ปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Pending physical count number / จำนวนการตรวจนับสินค้าที่รอดำเนินการ
   */
  @Get('physical-count/pending')
  @UseGuards(new AppIdGuard('physicalCount.findAllPending.count'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get pending physical count count',
    description: 'Returns the count of physical inventory counts awaiting the current user to record actual stock quantities, used to drive dashboard notifications and task prioritization.',
    operationId: 'findAllPendingPhysicalCountCount',
    'x-description-th': 'ดึงจำนวนการตรวจนับสินค้าที่รอให้ผู้ใช้ปัจจุบันบันทึกจำนวนสินค้าจริง ใช้สำหรับแสดงการแจ้งเตือนบนแดชบอร์ดและจัดลำดับความสำคัญงาน',
    responses: {
      200: { description: 'Pending physical count count retrieved successfully' },
    },
  } as any)
  async findAllPendingPhysicalCountCount(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAllPendingPhysicalCountCount',
        version,
      },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findAllPendingPhysicalCountCount(
      user_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get a physical count session by ID with full details
   * ค้นหารายการเดียวตาม ID ของการตรวจนับสินค้าพร้อมรายละเอียดทั้งหมด
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count details / รายละเอียดการตรวจนับสินค้า
   */
  @Get(':bu_code/physical-count/:id')
  @UseGuards(new AppIdGuard('physicalCount.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a physical count by ID',
    description: 'Retrieves the full details of a physical inventory count session, including the location, period, status, and counted items, for review or continuation of the stock verification process.',
    operationId: 'findOnePhysicalCount',
    'x-description-th': 'ดึงรายละเอียดทั้งหมดของการตรวจนับสินค้าตาม ID รวมถึงสถานที่ รอบการตรวจนับ สถานะ และรายการสินค้าที่ตรวจนับ สำหรับการตรวจสอบหรือดำเนินการตรวจนับต่อ',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical count retrieved successfully' },
      404: { description: 'Physical count not found' },
    },
  } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all physical count sessions with pagination
   * ค้นหารายการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated physical count list / รายการตรวจนับสินค้าแบบแบ่งหน้า
   */
  @Get(':bu_code/physical-count/')
  @UseGuards(new AppIdGuard('physicalCount.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all physical counts',
    description: 'Lists all physical inventory count sessions for a business unit with pagination, allowing inventory managers to monitor ongoing and completed stock verification activities.',
    operationId: 'findAllPhysicalCounts',
    'x-description-th': 'ดึงรายการตรวจนับสินค้าทั้งหมดของหน่วยธุรกิจพร้อมการแบ่งหน้า ช่วยให้ผู้จัดการคลังสินค้าติดตามกิจกรรมการตรวจนับที่กำลังดำเนินการและที่เสร็จสิ้นแล้ว',
    parameters: [
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical counts retrieved successfully' },
    },
  } as any)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.physicalCountService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new physical count session for a storage location
   * สร้างรายการตรวจนับสินค้าใหม่สำหรับสถานที่จัดเก็บที่กำหนด
   * @param createDto - Physical count creation data / ข้อมูลสำหรับสร้างการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created physical count / การตรวจนับสินค้าที่สร้างขึ้น
   */
  @Post(':bu_code/physical-count')
  @UseGuards(new AppIdGuard('physicalCount.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new physical count',
    description: 'Initiates a new periodic physical inventory count for a specific storage location and count period, generating the list of products to be verified against system stock levels.',
    operationId: 'createPhysicalCount',
    'x-description-th': 'สร้างรายการตรวจนับสินค้าใหม่สำหรับสถานที่จัดเก็บและรอบการตรวจนับที่กำหนด ระบบจะสร้างรายการสินค้าที่ต้องตรวจสอบเทียบกับจำนวนในระบบโดยอัตโนมัติ',
    parameters: [
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      201: { description: 'Physical count created successfully' },
      400: { description: 'Invalid request body' },
    },
  } as any)
  @ApiBody({ type: PhysicalCountCreateRequestDto })
  async create(
    @Body() createDto: PhysicalCountCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.create(
      { ...createDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a physical count record before finalization
   * อัปเดตรายการตรวจนับสินค้าก่อนการส่งขั้นสุดท้าย
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Fields to update / ข้อมูลที่ต้องการอัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated physical count / การตรวจนับสินค้าที่อัปเดตแล้ว
   */
  @Patch(':bu_code/physical-count/:id')
  @UseGuards(new AppIdGuard('physicalCount.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a physical count',
    description: 'Modifies a physical count record, such as changing the assigned location or adjusting metadata, before the count is finalized and submitted.',
    operationId: 'updatePhysicalCount',
    'x-description-th': 'แก้ไขรายการตรวจนับสินค้า เช่น เปลี่ยนสถานที่หรือปรับข้อมูลเมตา ก่อนที่การตรวจนับจะถูกส่งขั้นสุดท้าย',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical count updated successfully' },
      404: { description: 'Physical count not found' },
    },
  } as any)
  @ApiBody({ type: PhysicalCountUpdateRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: PhysicalCountUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.update(
      id,
      { ...updateDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a draft physical count by ID
   * ลบรายการตรวจนับสินค้าสถานะร่างตาม ID
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/physical-count/:id')
  @UseGuards(new AppIdGuard('physicalCount.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a physical count',
    description: 'Removes a physical count that was created in error or is no longer needed. Only draft counts that have not been submitted can be deleted.',
    operationId: 'deletePhysicalCount',
    'x-description-th': 'ลบรายการตรวจนับสินค้าที่สร้างผิดพลาดหรือไม่จำเป็นแล้ว สามารถลบได้เฉพาะรายการที่อยู่ในสถานะร่างและยังไม่ได้ส่งเท่านั้น',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical count deleted successfully' },
      404: { description: 'Physical count not found' },
    },
  } as any)
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Refresh the product list for a physical count session
   * รีเฟรชรายการสินค้าในการตรวจนับสินค้า โดยดึงสินค้าใหม่จาก location แล้วเพิ่มเข้าไป
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Refreshed physical count with updated product list / การตรวจนับสินค้าที่รีเฟรชแล้วพร้อมรายการสินค้าล่าสุด
   */
  @Patch(':bu_code/physical-count/:id/refresh')
  @UseGuards(new AppIdGuard('physicalCount.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Refresh product list for a physical count',
    description: 'Re-fetches the product list from the location (product_location + inventory transactions) and adds any new products that are not yet in the physical count detail list. Existing counted items are preserved.',
    operationId: 'refreshPhysicalCount',
    'x-description-th': 'รีเฟรชรายการสินค้าจากสถานที่จัดเก็บ (product_location + inventory transactions) และเพิ่มสินค้าใหม่ที่ยังไม่อยู่ในรายการตรวจนับ รายการที่นับแล้วจะถูกเก็บรักษาไว้',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
  } as any)
  @ApiResponse({ status: 200, description: 'Physical count product list refreshed successfully', type: PhysicalCountResponseDto })
  @ApiResponse({ status: 400, description: 'Physical count is already completed' })
  @ApiResponse({ status: 404, description: 'Physical count not found' })
  async refresh(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'refresh', id, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.refresh(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Physical Count Detail CRUD ====================

  /**
   * Get all line items for a physical count session
   * ค้นหารายการสินค้าทั้งหมดในการตรวจนับสินค้า
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count detail items / รายการรายละเอียดการตรวจนับสินค้า
   */
  @Get(':bu_code/physical-count/:id/details')
  @UseGuards(new AppIdGuard('physicalCount.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all details for a Physical Count',
    description: 'Returns all product line items included in a physical count, showing system quantities alongside any recorded actual quantities for inventory reconciliation.',
    operationId: 'findAllPhysicalCountDetails',
    'x-description-th': 'ดึงรายการสินค้าทั้งหมดในการตรวจนับสินค้า แสดงจำนวนในระบบเทียบกับจำนวนที่นับได้จริง สำหรับการกระทบยอดสินค้าคงคลัง',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
    ],
    responses: {
      200: { description: 'Physical Count details retrieved successfully' },
      404: { description: 'Physical Count not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findDetailsByPhysicalCountId(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findDetailsByPhysicalCountId', id, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findDetailsByPhysicalCountId(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Get a specific line item from a physical count by detail ID
   * ค้นหารายการสินค้าเฉพาะรายการเดียวตาม ID ของรายละเอียดการตรวจนับ
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param detailId - Physical count detail ID / รหัสรายละเอียดการตรวจนับ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count detail item / รายละเอียดรายการตรวจนับสินค้า
   */
  @Get(':bu_code/physical-count/:id/details/:detail_id')
  @UseGuards(new AppIdGuard('physicalCount.findOne'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a specific Physical Count detail by ID',
    description: 'Retrieves a specific product line item from a physical count, including its system quantity, actual counted quantity, and any variance for detailed investigation.',
    operationId: 'findPhysicalCountDetailById',
    'x-description-th': 'ดึงรายการสินค้าเฉพาะรายการหนึ่งจากการตรวจนับสินค้า รวมถึงจำนวนในระบบ จำนวนที่นับได้จริง และผลต่าง สำหรับการตรวจสอบรายละเอียด',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Physical Count Detail ID' },
    ],
    responses: {
      200: { description: 'Physical Count detail retrieved successfully' },
      404: { description: 'Physical Count detail not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findDetailById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findDetailById', id, detailId, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.findDetailById(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a line item from a draft physical count
   * ลบรายการสินค้าจากการตรวจนับสินค้าสถานะร่าง
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param detailId - Physical count detail ID / รหัสรายละเอียดการตรวจนับ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/physical-count/:id/details/:detail_id')
  @UseGuards(new AppIdGuard('physicalCount.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a Physical Count detail',
    description: 'Removes a product line item from a draft physical count, used when items were added in error or are no longer relevant to the current count session.',
    operationId: 'deletePhysicalCountDetail',
    'x-description-th': 'ลบรายการสินค้าจากการตรวจนับสินค้าสถานะร่าง ใช้เมื่อรายการถูกเพิ่มผิดพลาดหรือไม่เกี่ยวข้องกับการตรวจนับในปัจจุบัน',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Physical Count Detail ID' },
    ],
    responses: {
      200: { description: 'Physical Count detail deleted successfully' },
      400: { description: 'Cannot delete detail of non-draft Physical Count' },
      404: { description: 'Physical Count detail not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async deleteDetail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detailId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'deleteDetail', id, detailId, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.deleteDetail(detailId, user_id, bu_code, version);
    this.respond(res, result);
  }

  // ==================== Mobile-specific endpoints ====================

  /**
   * Save counted quantities as draft from mobile device
   * บันทึกจำนวนที่นับได้เป็นร่างจากอุปกรณ์มือถือ
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Items with counted quantities / รายการสินค้าพร้อมจำนวนที่นับได้
   * @param version - API version / เวอร์ชัน API
   * @returns Save result / ผลลัพธ์การบันทึก
   */
  @Patch(':bu_code/physical-count/:id/save')
  @UseGuards(new AppIdGuard('physicalCount.save'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Save Physical Count items',
    description: 'Persists the counted quantities entered by warehouse staff on a mobile device as a draft, allowing them to pause and resume the physical count without finalizing it.',
    operationId: 'savePhysicalCountItems',
    'x-description-th': 'บันทึกจำนวนที่นับได้จากอุปกรณ์มือถือเป็นร่าง ช่วยให้พนักงานคลังสินค้าหยุดพักและดำเนินการตรวจนับต่อได้โดยไม่ต้องส่งขั้นสุดท้าย',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count items saved successfully' },
      400: { description: 'Invalid request body' },
      404: { description: 'Physical Count not found' },
    },
  } as any)
  @ApiBody({ type: PhysicalCountSaveItemsRequestDto })
  @HttpCode(HttpStatus.OK)
  async saveItems(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { items: Array<{ id: string; actual_qty: number }> },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'saveItems', id, data, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.saveItems(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Calculate variances between actual and system quantities
   * คำนวณผลต่างระหว่างจำนวนจริงกับจำนวนในระบบ
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Items with counted quantities / รายการสินค้าพร้อมจำนวนที่นับได้
   * @param version - API version / เวอร์ชัน API
   * @returns Variance review result / ผลลัพธ์การตรวจสอบผลต่าง
   */
  @Patch(':bu_code/physical-count/:id/review')
  @UseGuards(new AppIdGuard('physicalCount.review'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Review Physical Count items',
    description: 'Compares the counted quantities against system stock levels and calculates variances for each item, enabling warehouse staff to review discrepancies before final submission.',
    operationId: 'reviewPhysicalCountItems',
    'x-description-th': 'เปรียบเทียบจำนวนที่นับได้กับจำนวนในระบบ และคำนวณผลต่างของแต่ละรายการ ช่วยให้พนักงานคลังสินค้าตรวจสอบความคลาดเคลื่อนก่อนส่งขั้นสุดท้าย',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count items reviewed successfully with difference list' },
      400: { description: 'Invalid request body' },
      404: { description: 'Physical Count not found' },
    },
  } as any)
  @ApiBody({ type: PhysicalCountSaveItemsRequestDto })
  @HttpCode(HttpStatus.OK)
  async reviewItems(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { items: Array<{ id: string; actual_qty: number }> },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'reviewItems', id, data, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.reviewItems(id, data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Get the variance report for a physical count
   * ดึงรายงานผลต่างของการตรวจนับสินค้า
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Variance report / รายงานผลต่าง
   */
  @Get(':bu_code/physical-count/:id/review')
  @UseGuards(new AppIdGuard('physicalCount.getReview'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get Physical Count review result',
    description: 'Retrieves the previously calculated variance report for a physical count, showing the differences between system and actual quantities so managers can approve or investigate discrepancies.',
    operationId: 'getPhysicalCountReview',
    'x-description-th': 'ดึงรายงานผลต่างที่คำนวณไว้ก่อนหน้าของการตรวจนับสินค้า แสดงความแตกต่างระหว่างจำนวนในระบบกับจำนวนจริง เพื่อให้ผู้จัดการอนุมัติหรือตรวจสอบความคลาดเคลื่อน',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count review result retrieved successfully' },
      404: { description: 'Physical Count not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async getReview(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getReview', id, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.getReview(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Submit a physical count and generate inventory adjustments
   * ส่งการตรวจนับสินค้าและสร้างรายการปรับปรุงสินค้าคงคลังอัตโนมัติ
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Submission result / ผลลัพธ์การส่ง
   */
  @Patch(':bu_code/physical-count/:id/submit')
  @UseGuards(new AppIdGuard('physicalCount.submit'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Submit Physical Count',
    description: 'Finalizes a physical count and automatically generates inventory adjustment records to reconcile system stock levels with the actual counted quantities.',
    operationId: 'submitPhysicalCount',
    'x-description-th': 'ส่งการตรวจนับสินค้าขั้นสุดท้าย และสร้างรายการปรับปรุงสินค้าคงคลังอัตโนมัติเพื่อปรับจำนวนในระบบให้ตรงกับจำนวนที่นับได้จริง',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      200: { description: 'Physical Count submitted and adjustment created successfully' },
      400: { description: 'Physical Count cannot be submitted' },
      404: { description: 'Physical Count not found' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'submit', id, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.submit(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Add a comment to a physical count detail item
   * เพิ่มความคิดเห็นในรายละเอียดการตรวจนับสินค้า
   * @param id - Physical count ID / รหัสการตรวจนับสินค้า
   * @param detailId - Physical count detail ID / รหัสรายละเอียดการตรวจนับ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param data - Comment text / ข้อความความคิดเห็น
   * @param version - API version / เวอร์ชัน API
   * @returns Created comment / ความคิดเห็นที่สร้างขึ้น
   */
  @Post(':bu_code/physical-count/:id/details/:detail_id/comments')
  @UseGuards(new AppIdGuard('physicalCount.createComment'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Add comment to Physical Count detail',
    description: 'Records an explanatory note on a specific counted item, such as reasons for variances (e.g., spoilage, breakage, or misplacement) to support audit trails.',
    operationId: 'createPhysicalCountDetailComment',
    'x-description-th': 'เพิ่มหมายเหตุอธิบายในรายการสินค้าที่ตรวจนับ เช่น สาเหตุของผลต่าง (เสียหาย แตกหัก หรือวางผิดที่) เพื่อสนับสนุนเส้นทางการตรวจสอบ',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Physical Count ID' },
      { name: 'detail_id', in: 'path', required: true, description: 'Physical Count Detail ID' },
      { name: 'bu_code', in: 'path', required: true, description: 'Business Unit Code' },
    ],
    responses: {
      201: { description: 'Comment created successfully' },
      400: { description: 'Invalid request body' },
      404: { description: 'Physical Count detail not found' },
    },
  } as any)
  @ApiBody({ type: PhysicalCountDetailCommentRequestDto })
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('detail_id', new ParseUUIDPipe({ version: '4' })) detailId: string,
    @Param('bu_code') bu_code: string,
    @Body() data: { comment: string },
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'createComment', id, detailId, data, version },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.createComment(detailId, data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Print a physical count via FastReport viewer (micro-report)
   * พิมพ์ใบนับสินค้าผ่าน FastReport viewer (micro-report)
   */
  @Get(':bu_code/physical-count/:id/print-viewer')
  @UseGuards(new AppIdGuard('physicalCount.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print physical count via FastReport viewer',
    description:
      'Sends PC data + signature config to micro-report which generates FastReport XML and returns a viewer URL.',
    operationId: 'printPhysicalCountViewer',
    'x-description-th': 'ส่งข้อมูล PC + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL',
  } as any)
  @HttpCode(HttpStatus.OK)
  async printToReport(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      { function: 'printToReport', id, bu_code },
      PhysicalCountController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }
}
