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
import { RequestForPricingService } from './request-for-pricing.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateRequestForPricingRequestDto,
  UpdateRequestForPricingRequestDto,
} from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  EnrichAuditUsers,
} from '@/common';

@Controller('api/:bu_code/request-for-pricing')
@ApiTags('Procurement: Request for Pricing')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class RequestForPricingController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    RequestForPricingController.name,
  );

  constructor(
    private readonly requestForPricingService: RequestForPricingService,
  ) {
    super();
    this.logger.debug('RequestForPricingController initialized');
  }

  /**
   * Retrieve a Request for Pricing by ID
   * ค้นหารายการเดียวตาม ID ของเอกสารขอราคา
   * @param id - Request for Pricing ID / รหัสเอกสารขอราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Request for Pricing details / รายละเอียดเอกสารขอราคา
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('requestForPricing.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get request for pricing by ID',
    description: 'Retrieves a specific Request for Pricing (RFP) document sent to vendors, including the requested items, vendor responses, and quoted prices used for competitive procurement comparison.',
    'x-description-th': 'ดึงข้อมูลใบขอราคารายการเดียวตาม ID',
    operationId: 'findOneRequestForPricing',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Request for pricing was successfully retrieved',
      },
      404: {
        description: 'Request for pricing was not found',
      },
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * List all Requests for Pricing with pagination
   * ค้นหารายการทั้งหมดของเอกสารขอราคาพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of Requests for Pricing / รายการเอกสารขอราคาแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('requestForPricing.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all request for pricing',
    description: 'Lists all Request for Pricing (RFP) documents within the business unit, allowing procurement staff to track and compare competitive pricing submissions from multiple vendors.',
    'x-description-th': 'แสดงรายการใบขอราคาทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'findAllRequestForPricing',
    deprecated: false,
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'The version of the API',
        example: 'latest',
      },
    ],
    responses: {
      200: {
        description: 'Request for pricing list was successfully retrieved',
      },
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.requestForPricingService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new Request for Pricing to solicit vendor quotes
   * สร้างเอกสารขอราคาใหม่เพื่อขอใบเสนอราคาจากผู้ขาย
   * @param data - RFP creation data / ข้อมูลสำหรับสร้างเอกสารขอราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created Request for Pricing / เอกสารขอราคาที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('requestForPricing.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new request for pricing',
    description: 'Creates a new Request for Pricing (RFP) to solicit competitive quotes from vendors for specified items, initiating the price comparison process before purchase order generation.',
    'x-description-th': 'สร้างใบขอราคาใหม่',
    operationId: 'createRequestForPricing',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      201: {
        description: 'Request for pricing was successfully created',
      },
      400: {
        description: 'Bad request',
      },
    },
  })
  @ApiBody({ type: CreateRequestForPricingRequestDto })
  async create(
    @Body() data: Record<string, unknown>,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        data,
        version,
      },
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.create(data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing Request for Pricing
   * อัปเดตเอกสารขอราคาที่มีอยู่
   * @param id - Request for Pricing ID / รหัสเอกสารขอราคา
   * @param data - Updated RFP data / ข้อมูลเอกสารขอราคาที่อัปเดต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated Request for Pricing / เอกสารขอราคาที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('requestForPricing.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a request for pricing',
    description: 'Updates an existing Request for Pricing (RFP) to modify requested items, adjust quantities, or record vendor pricing responses during the competitive bidding process.',
    'x-description-th': 'อัปเดตข้อมูลใบขอราคาที่มีอยู่',
    operationId: 'updateRequestForPricing',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Request for pricing was successfully updated',
      },
      404: {
        description: 'Request for pricing was not found',
      },
    },
  })
  @ApiBody({ type: UpdateRequestForPricingRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: Record<string, unknown>,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        data,
        version,
      },
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.update(
      { ...data, id },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a Request for Pricing that is no longer needed
   * ลบเอกสารขอราคาที่ไม่ต้องการแล้ว
   * @param id - Request for Pricing ID / รหัสเอกสารขอราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('requestForPricing.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a request for pricing',
    description: 'Removes a Request for Pricing (RFP) document that is no longer needed, such as cancelled procurement inquiries or duplicate vendor pricing requests.',
    'x-description-th': 'ลบใบขอราคาตาม ID',
    operationId: 'deleteRequestForPricing',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Request for pricing was successfully deleted',
      },
      404: {
        description: 'Request for pricing was not found',
      },
    },
  } as any)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        version,
      },
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Print a request-for-pricing via FastReport viewer (micro-report)
   * พิมพ์ใบขอราคาผ่าน FastReport viewer (micro-report)
   */
  @Get(':id/print-viewer')
  @UseGuards(new AppIdGuard('requestForPricing.print'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Print request-for-pricing via FastReport viewer',
    description:
      'Sends RFQ data + signature config to micro-report which generates FastReport XML and returns a viewer URL.',
    operationId: 'printRequestForPricingViewer',
    'x-description-th': 'ส่งข้อมูล RFQ + signature ไป micro-report เพื่อสร้าง FastReport XML แล้วคืน viewer URL',
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
      RequestForPricingController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.requestForPricingService.printToReport(id, user_id, bu_code);
    this.respond(res, result);
  }
}
