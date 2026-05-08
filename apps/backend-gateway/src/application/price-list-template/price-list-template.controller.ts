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
import { PriceListTemplateService } from './price-list-template.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PriceListTemplateCreateRequestDto,
  PriceListTemplateUpdateRequestDto,
  PriceListTemplateUpdateStatusRequestDto,
} from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiVersionMinRequest,
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
  PriceListTemplateDetailResponseSchema,
  PriceListTemplateListItemResponseSchema,
  PriceListTemplateMutationResponseSchema,
  PriceListTemplateCreateDto,
  PriceListTemplateUpdateDto,
  Serialize,
} from '@/common';

@Controller('api/:bu_code/price-list-template')
@ApiTags('Procurement: Price Lists')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PriceListTemplateController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListTemplateController.name,
  );

  constructor(
    private readonly priceListTemplateService: PriceListTemplateService,
  ) {
    super();
    this.logger.debug('PriceListTemplateController initialized');
  }

  /**
   * Get a specific price list template by ID
   * ค้นหาเทมเพลตรายการราคาเดียวตาม ID
   * @param id - Price list template ID / รหัสเทมเพลตรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Price list template details / รายละเอียดเทมเพลตรายการราคา
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('priceListTemplate.findOne'))
  @Serialize(PriceListTemplateDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get price list template by ID',
    description: 'Retrieves the full details of a reusable price list template, including its product lineup and configuration, used when generating new vendor price lists from a standard template.',
    operationId: 'findOnePriceListTemplate',
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
        description: 'Price list template was successfully retrieved',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
    'x-description-th': 'ดึงข้อมูลแม่แบบรายการราคารายการเดียวตาม ID',
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
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * List all price list templates for the business unit
   * ค้นหาเทมเพลตรายการราคาทั้งหมดของหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of price list templates / รายการเทมเพลตรายการราคาแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('priceListTemplate.findAll'))
  @Serialize(PriceListTemplateListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all price list templates',
    description: 'Lists all available price list templates for the business unit, enabling procurement staff to select a standard template when requesting pricing from vendors.',
    operationId: 'findAllPriceListTemplates',
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
        description: 'Price list templates were successfully retrieved',
      },
    },
    'x-description-th': 'แสดงรายการแม่แบบรายการราคาทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
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
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.priceListTemplateService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new price list template
   * สร้างเทมเพลตรายการราคาใหม่
   * @param data - Price list template creation data / ข้อมูลสำหรับสร้างเทมเพลตรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Created price list template / เทมเพลตรายการราคาที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('priceListTemplate.create'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new price list template',
    description: 'Creates a reusable price list template with a predefined set of products, streamlining the process of requesting standardized pricing from multiple vendors.',
    operationId: 'createPriceListTemplate',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      201: {
        description: 'Price list template was successfully created',
      },
      400: {
        description: 'Bad request',
      },
    },
    'x-description-th': 'สร้างแม่แบบรายการราคาใหม่',
  } as any)
  @ApiBody({ type: PriceListTemplateCreateRequestDto })
  async create(
    @Body() data: PriceListTemplateCreateDto,
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
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.create(data, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing price list template
   * อัปเดตเทมเพลตรายการราคาที่มีอยู่
   * @param id - Price list template ID / รหัสเทมเพลตรายการราคา
   * @param data - Price list template update data / ข้อมูลสำหรับอัปเดตเทมเพลตรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated price list template / เทมเพลตรายการราคาที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('priceListTemplate.update'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a price list template',
    description: 'Modifies a price list template to add or remove products, or update its configuration to reflect changing procurement requirements.',
    operationId: 'updatePriceListTemplate',
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
        description: 'Price list template was successfully updated',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลแม่แบบรายการราคาที่มีอยู่',
  } as any)
  @ApiBody({ type: PriceListTemplateUpdateRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: PriceListTemplateUpdateDto,
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
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.update(
      { ...data, id },
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a price list template by ID
   * ลบเทมเพลตรายการราคาตาม ID
   * @param id - Price list template ID / รหัสเทมเพลตรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('priceListTemplate.delete'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a price list template',
    description: 'Removes a price list template that is no longer needed for vendor pricing requests. Existing price lists generated from this template are not affected.',
    operationId: 'deletePriceListTemplate',
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
        description: 'Price list template was successfully deleted',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
    'x-description-th': 'ลบแม่แบบรายการราคาตาม ID',
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
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Update the status of a price list template
   * อัปเดตสถานะของเทมเพลตรายการราคา
   * @param id - Price list template ID / รหัสเทมเพลตรายการราคา
   * @param status - New status value / ค่าสถานะใหม่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated template status / สถานะเทมเพลตที่อัปเดตแล้ว
   */
  @Patch(':id/status')
  @UseGuards(new AppIdGuard('priceListTemplate.updateStatus'))
  @Serialize(PriceListTemplateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update price list template status',
    description: 'Changes the lifecycle status of a price list template (draft, active, or inactive), controlling whether it is available for generating new vendor price requests.',
    operationId: 'updatePriceListTemplateStatus',
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
        description: 'Price list template status was successfully updated',
      },
      404: {
        description: 'Price list template was not found',
      },
    },
    'x-description-th': 'อัปเดตสถานะของแม่แบบรายการราคา',
  } as any)
  @ApiBody({ type: PriceListTemplateUpdateStatusRequestDto })
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body('status') status: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateStatus',
        id,
        status,
        version,
      },
      PriceListTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListTemplateService.updateStatus(
      id,
      status,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
