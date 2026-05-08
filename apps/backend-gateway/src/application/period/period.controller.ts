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
import { PeriodService } from './period.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
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
  PeriodCreateDto,
  PeriodUpdateDto,
} from 'src/common/dto/period/period.dto';
import { PeriodGenerateNextRequestDto } from './swagger/request';

@Controller('api')
@ApiTags('Inventory: Periods')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PeriodController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PeriodController.name,
  );

  constructor(private readonly periodService: PeriodService) {
    super();
  }

  /**
   * Find the current period (status is open or locked)
   * ค้นหางวดปัจจุบัน (สถานะเปิดหรือล็อค)
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Current period / งวดปัจจุบัน
   */
  @Get(':bu_code/period/current')
  @UseGuards(new AppIdGuard('period.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get current period',
    description: 'Retrieves the current fiscal/accounting period with status open or locked. Returns the earliest open/locked period ordered by fiscal year and month.',
    'x-description-th': 'ดึงข้อมูลรอบบัญชีปัจจุบัน',
    operationId: 'findCurrentPeriod',
    responses: {
      200: { description: 'Current period retrieved successfully' },
      404: { description: 'No current period found' },
    },
  } as any)
  async findCurrent(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findCurrent', version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.findCurrent(
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Find a period by ID
   * ค้นหางวด/รอบบัญชีรายการเดียวตาม ID
   * @param id - Period ID / รหัสงวด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Period details / รายละเอียดงวด/รอบบัญชี
   */
  @Get(':bu_code/period/:id')
  @UseGuards(new AppIdGuard('period.findOne'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a period by ID',
    description: 'Retrieves the details of a fiscal/accounting period, including its open/closed status and date range, used to verify whether inventory transactions and valuations can be posted.',
    'x-description-th': 'ดึงข้อมูลรอบบัญชีรายการเดียวตาม ID',
    operationId: 'findOnePeriod',
    responses: {
      200: { description: 'Period retrieved successfully' },
      404: { description: 'Period not found' },
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
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all periods in the business unit
   * ค้นหารายการงวด/รอบบัญชีทั้งหมดในหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of periods / รายการงวดแบบแบ่งหน้า
   */
  @Get(':bu_code/period')
  @UseGuards(new AppIdGuard('period.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all periods',
    description: 'Lists all fiscal/accounting periods for the business unit, enabling finance staff to manage month-end closing cycles and control when inventory transactions can be recorded.',
    'x-description-th': 'แสดงรายการรอบบัญชีทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'findAllPeriods',
    responses: {
      200: { description: 'Periods retrieved successfully' },
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
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.periodService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new fiscal/accounting period
   * สร้างงวด/รอบบัญชีใหม่
   * @param createDto - Period creation data / ข้อมูลสำหรับสร้างงวด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Created period / งวดที่สร้างแล้ว
   */
  @Post(':bu_code/period')
  @UseGuards(new AppIdGuard('period.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new period',
    description: 'Creates a new fiscal/accounting period that controls when inventory transactions and valuations can be posted, typically aligned with the hotel monthly closing schedule.',
    'x-description-th': 'สร้างรอบบัญชีใหม่',
    operationId: 'createPeriod',
    responses: {
      201: { description: 'Period created successfully' },
      409: { description: 'Period or fiscal year/month already exists' },
    },
  })
  @ApiBody({
    type: PeriodCreateDto,
    description: 'Period data to create',
  })
  async create(
    @Body() createDto: PeriodCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'create', createDto, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a fiscal/accounting period
   * อัปเดตงวด/รอบบัญชี
   * @param id - Period ID / รหัสงวด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Period update data / ข้อมูลสำหรับอัปเดตงวด
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated period / งวดที่อัปเดตแล้ว
   */
  @Patch(':bu_code/period/:id')
  @UseGuards(new AppIdGuard('period.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a period',
    description: 'Modifies an existing fiscal period, such as opening or closing it for inventory transactions, which is essential for month-end closing and inventory valuation control.',
    'x-description-th': 'อัปเดตข้อมูลรอบบัญชีที่มีอยู่',
    operationId: 'updatePeriod',
    responses: {
      200: { description: 'Period updated successfully' },
      404: { description: 'Period not found' },
    },
  })
  @ApiBody({
    type: PeriodUpdateDto,
    description: 'Period data to update',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: PeriodUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'update', id, updateDto, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Bulk-generate the next N fiscal periods
   * สร้างงวด/รอบบัญชีถัดไปจำนวน N งวดแบบกลุ่ม
   * @param body - Count of periods and start day / จำนวนงวดและวันเริ่มต้น
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Generated periods / งวดที่สร้างแล้ว
   */
  @Post(':bu_code/period/next')
  @UseGuards(new AppIdGuard('period.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Generate next N open periods',
    description:
      'Bulk-generates upcoming fiscal periods for forward planning, automatically creating the next N monthly periods so inventory and procurement operations can be scheduled in advance.',
    'x-description-th': 'สร้างรอบบัญชีถัดไปจำนวน N รอบแบบอัตโนมัติ',
    operationId: 'generateNextPeriods',
    responses: {
      201: { description: 'Periods generated successfully' },
    },
  })
  @ApiBody({ type: PeriodGenerateNextRequestDto })
  async generateNext(
    @Body() body: { count: number; start_day?: number },
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const startDay = body.start_day ?? 1;
    this.logger.debug(
      { function: 'generateNext', count: body.count, start_day: startDay, version },
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.generateNext(
      body.count,
      startDay,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Delete a fiscal/accounting period
   * ลบงวด/รอบบัญชี
   * @param id - Period ID / รหัสงวด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
   */
  @Delete(':bu_code/period/:id')
  @UseGuards(new AppIdGuard('period.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a period',
    description: 'Removes a fiscal period that was created in error. Periods with existing inventory transactions cannot be deleted to preserve financial integrity.',
    'x-description-th': 'ลบรอบบัญชีตาม ID',
    operationId: 'deletePeriod',
    responses: {
      200: { description: 'Period deleted successfully' },
      404: { description: 'Period not found' },
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
      PeriodController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.periodService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
