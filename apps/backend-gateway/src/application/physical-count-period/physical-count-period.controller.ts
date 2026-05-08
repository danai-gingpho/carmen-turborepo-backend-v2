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
import { PhysicalCountPeriodService } from './physical-count-period.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PhysicalCountPeriodCreateRequestDto,
  PhysicalCountPeriodUpdateRequestDto,
} from './swagger/request';
import { BaseHttpController } from '@/common';
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
import {
  PhysicalCountPeriodCreateDto,
  PhysicalCountPeriodUpdateDto,
} from 'src/common/dto/physical-count-period/physical-count-period.dto';

@Controller('api')
@ApiTags('Inventory: Physical Count')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PhysicalCountPeriodController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountPeriodController.name,
  );

  constructor(
    private readonly physicalCountPeriodService: PhysicalCountPeriodService,
  ) {
    super();
  }

  /**
   * Get the currently active physical count period
   * ดึงรอบการตรวจนับสินค้าที่กำลังดำเนินอยู่ในปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Current physical count period / รอบการตรวจนับสินค้าปัจจุบัน
   */
  @Get(':bu_code/physical-count-period/current')
  @UseGuards(new AppIdGuard('physicalCountPeriod.current'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get current physical count period',
    description:
      'Finds the current physical count period, helping warehouse staff quickly identify the current inventory verification window they should be working on.',
    operationId: 'findCurrentPhysicalCountPeriod',
    'x-description-th': 'ดึงรอบการตรวจนับสินค้าที่กำลังดำเนินอยู่ในปัจจุบัน ช่วยให้พนักงานคลังสินค้าระบุรอบการตรวจนับที่ต้องทำงานได้อย่างรวดเร็ว',
    parameters: [
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
    ],
    responses: {
      200: {
        description: 'Current physical count period retrieved successfully',
      },
      404: { description: 'No current physical count period found' },
    },
  } as any)
  async findCurrent(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
    @Query('include_not_count') include_not_count: string = 'false',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findCurrent', version, include_not_count },
      PhysicalCountPeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountPeriodService.findCurrent(
      user_id,
      bu_code,
      version,
      include_not_count === 'true',
    );
    this.respond(res, result);
  }

  /**
   * Get a physical count period by ID
   * ค้นหารอบการตรวจนับสินค้าเดียวตาม ID
   * @param id - Physical count period ID / รหัสรอบการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Physical count period details / รายละเอียดรอบการตรวจนับสินค้า
   */
  @Get(':bu_code/physical-count-period/:id')
  @UseGuards(new AppIdGuard('physicalCountPeriod.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a physical count period by ID',
    description:
      'Retrieves the details of a specific physical count time window, including its date range and status, to determine when inventory verification must be completed.',
    operationId: 'findOnePhysicalCountPeriod',
    'x-description-th': 'ดึงรายละเอียดของรอบการตรวจนับสินค้าเฉพาะรอบ รวมถึงช่วงวันที่และสถานะ เพื่อตรวจสอบว่าต้องทำการตรวจนับให้เสร็จเมื่อใด',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Physical Count Period ID',
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
    ],
    responses: {
      200: { description: 'Physical count period retrieved successfully' },
      404: { description: 'Physical count period not found' },
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
      { function: 'findOne', id, version },
      PhysicalCountPeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountPeriodService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all physical count periods with pagination
   * ค้นหารอบการตรวจนับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated physical count period list / รายการรอบการตรวจนับสินค้าแบบแบ่งหน้า
   */
  @Get(':bu_code/physical-count-period')
  @UseGuards(new AppIdGuard('physicalCountPeriod.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all physical count periods',
    description:
      'Lists all defined physical count periods for the business unit, allowing inventory managers to plan and schedule recurring stock verification cycles.',
    operationId: 'findAllPhysicalCountPeriods',
    'x-description-th': 'ดึงรายการรอบการตรวจนับสินค้าทั้งหมดของหน่วยธุรกิจ ช่วยให้ผู้จัดการคลังสินค้าวางแผนและกำหนดตารางการตรวจสอบสินค้าคงคลังเป็นรอบ',
    parameters: [
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
    ],
    responses: {
      200: { description: 'Physical count periods retrieved successfully' },
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
      { function: 'findAll', query, version },
      PhysicalCountPeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.physicalCountPeriodService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new physical count period
   * สร้างรอบการตรวจนับสินค้าใหม่
   * @param createDto - Period creation data / ข้อมูลสำหรับสร้างรอบการตรวจนับ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created physical count period / รอบการตรวจนับสินค้าที่สร้างขึ้น
   */
  @Post(':bu_code/physical-count-period')
  @UseGuards(new AppIdGuard('physicalCountPeriod.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new physical count period',
    description:
      'Defines a new time window during which physical inventory counts must be completed, establishing the schedule for periodic stock verification across storage locations.',
    operationId: 'createPhysicalCountPeriod',
    'x-description-th': 'สร้างรอบการตรวจนับสินค้าใหม่ กำหนดช่วงเวลาที่ต้องทำการตรวจนับสินค้าคงคลังให้เสร็จสิ้น เพื่อวางตารางการตรวจสอบสินค้าเป็นรอบ',
    parameters: [
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
    ],
    responses: {
      201: { description: 'Physical count period created successfully' },
      400: { description: 'Invalid request body' },
      409: {
        description: 'Physical count period with same dates already exists',
      },
    },
  } as any)
  @ApiBody({ type: PhysicalCountPeriodCreateRequestDto })
  async create(
    @Body() createDto: PhysicalCountPeriodCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'create', createDto, version },
      PhysicalCountPeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountPeriodService.create(
      { ...createDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a physical count period
   * อัปเดตรอบการตรวจนับสินค้า
   * @param id - Physical count period ID / รหัสรอบการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Fields to update / ข้อมูลที่ต้องการอัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated physical count period / รอบการตรวจนับสินค้าที่อัปเดตแล้ว
   */
  @Patch(':bu_code/physical-count-period/:id')
  @UseGuards(new AppIdGuard('physicalCountPeriod.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a physical count period',
    description:
      'Modifies the date range or status of a physical count period, such as extending the deadline when warehouse staff need additional time to complete stock verification.',
    operationId: 'updatePhysicalCountPeriod',
    'x-description-th': 'แก้ไขช่วงวันที่หรือสถานะของรอบการตรวจนับสินค้า เช่น ขยายกำหนดเวลาเมื่อพนักงานคลังสินค้าต้องการเวลาเพิ่มเติมในการตรวจนับ',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Physical Count Period ID',
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
    ],
    responses: {
      200: { description: 'Physical count period updated successfully' },
      404: { description: 'Physical count period not found' },
    },
  } as any)
  @ApiBody({ type: PhysicalCountPeriodUpdateRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: PhysicalCountPeriodUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'update', id, updateDto, version },
      PhysicalCountPeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountPeriodService.update(
      id,
      { ...updateDto },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a physical count period by ID
   * ลบรอบการตรวจนับสินค้าตาม ID
   * @param id - Physical count period ID / รหัสรอบการตรวจนับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/physical-count-period/:id')
  @UseGuards(new AppIdGuard('physicalCountPeriod.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a physical count period',
    description:
      'Removes a physical count period that was created in error or is no longer needed. Periods with associated physical counts cannot be deleted.',
    operationId: 'deletePhysicalCountPeriod',
    'x-description-th': 'ลบรอบการตรวจนับสินค้าที่สร้างผิดพลาดหรือไม่จำเป็นแล้ว รอบที่มีการตรวจนับสินค้าที่เชื่อมโยงอยู่จะไม่สามารถลบได้',
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Physical Count Period ID',
      },
      {
        name: 'bu_code',
        in: 'path',
        required: true,
        description: 'Business Unit Code',
      },
    ],
    responses: {
      200: { description: 'Physical count period deleted successfully' },
      404: { description: 'Physical count period not found' },
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
      { function: 'delete', id, version },
      PhysicalCountPeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.physicalCountPeriodService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
