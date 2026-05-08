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
import { PriceListService } from './price-list.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginate, IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  PriceListDetailResponseSchema,
  PriceListListItemResponseSchema,
  PriceListMutationResponseSchema,
  PriceListCreateDto,
  PriceListUpdateDto,
  isValidDate,
  toISOStringOrThrow,
} from '@/common';
import {
  PriceListCreateRequestDto,
  PriceListUpdateRequestDto,
} from './swagger/request';

@Controller('api/:bu_code/price-list')
@ApiTags('Procurement: Price Lists')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PriceListController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PriceListController.name,
  );

  constructor(private readonly priceListService: PriceListService) {
    super();
    this.logger.debug('PriceListController initialized');
  }

  /**
   * Compare vendor prices for a product across active price lists
   * เปรียบเทียบราคาสินค้าจากผู้ขายข้ามรายการราคาที่ใช้งานอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Query with product_id, at_date, unit_id, currency_id / คิวรีที่มี product_id, at_date, unit_id, currency_id
   * @param version - API version / เวอร์ชัน API
   * @returns Price comparison results / ผลลัพธ์การเปรียบเทียบราคา
   */
  @Get('price-compare')
  @UseGuards(new AppIdGuard('priceList.priceCompare'))
  @Serialize(PriceListListItemResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Compare price list',
    description: 'Compares vendor prices for a specific product across all active price lists, enabling procurement staff to identify the best-value supplier for purchase orders.',
    operationId: 'priceCompare',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: 'Price comparison was successfully retrieved',
      },
    },
    'x-description-th': 'เปรียบเทียบราคาสินค้าจากผู้ขายข้ามรายการราคาที่ใช้งานอยู่',
  } as any)
  async priceCompare(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: Record<string, string>,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'priceCompare',
        query,
        version,
      },
      PriceListController.name,
    );

    const { product_id, at_date, unit_id, currency_id } = query

    if (!product_id || !at_date || !currency_id) {
      throw new Error('product_id, at_date, and currency_id are required');
    }

    if (!isValidDate(at_date)) {
      throw new Error('at_date is invalid date format');
    }
    const due_date = toISOStringOrThrow(at_date);
    const { user_id } = ExtractRequestHeader(req);
    const queryData = {
      product_id,
      due_date,
      unit_id: unit_id || null,
      currency_id,
    }

    const result = await this.priceListService.priceCompare(queryData, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Get a specific price list by ID
   * ค้นหารายการราคาเดียวตาม ID
   * @param id - Price list ID / รหัสรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Price list details / รายละเอียดรายการราคา
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('priceList.findOne'))
  @Serialize(PriceListDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get price list by ID',
    description: 'Retrieves the full details of a vendor price list including all product prices, validity dates, and terms, used when reviewing or editing procurement pricing agreements.',
    operationId: 'findOnePriceListByBusinessUnit',
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
        description: 'Price list was successfully retrieved',
      },
      404: {
        description: 'Price list was not found',
      },
    },
    'x-description-th': 'ดึงข้อมูลรายการราคารายการเดียวตาม ID',
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
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * List all price lists for the business unit
   * ค้นหารายการราคาทั้งหมดของหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of price lists / รายการราคาแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('priceList.findAll'))
  @Serialize(PriceListListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all price lists',
    description:
      'Lists all active vendor price lists for the business unit, allowing procurement staff to browse current pricing agreements and compare vendor offerings.',
    operationId: 'findAllPriceListsByBusinessUnit',
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
        description: 'Price lists were successfully retrieved',
      },
    },
    'x-description-th': 'แสดงรายการราคาทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
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
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate: IPaginate = PaginateQuery(query) as IPaginate;
    const result = await this.priceListService.findAll(user_id, bu_code, paginate, version);
    this.respond(res, result);
  }

  /**
   * Create a new vendor price list
   * สร้างรายการราคาผู้ขายใหม่
   * @param data - Price list creation data / ข้อมูลสำหรับสร้างรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Created price list / รายการราคาที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('priceList.create'))
  @Serialize(PriceListMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new price list',
    description: 'Records a new vendor price list with product prices and validity dates, establishing the pricing basis for procurement purchase orders and cost comparison.',
    operationId: 'createPriceListByBusinessUnit',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      201: {
        description: 'Price list was successfully created',
      },
      400: {
        description: 'Bad request',
      },
    },
    'x-description-th': 'สร้างรายการราคาใหม่',
  } as any)
  @ApiBody({ type: PriceListCreateRequestDto })
  async create(
    @Body() data: PriceListCreateDto,
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
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.create({ ...data }, user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing price list
   * อัปเดตรายการราคาที่มีอยู่
   * @param id - Price list ID / รหัสรายการราคา
   * @param data - Price list update data / ข้อมูลสำหรับอัปเดตรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated price list / รายการราคาที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('priceList.update'))
  @Serialize(PriceListMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a price list',
    description: 'Modifies an existing vendor price list, such as adjusting product prices, extending validity dates, or correcting pricing errors in procurement agreements.',
    operationId: 'updatePriceListByBusinessUnit',
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
        description: 'Price list was successfully updated',
      },
      404: {
        description: 'Price list was not found',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลรายการราคาที่มีอยู่',
  } as any)
  @ApiBody({ type: PriceListUpdateRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: PriceListUpdateDto,
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
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.update({ ...data, id }, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a price list by ID
   * ลบรายการราคาตาม ID
   * @param id - Price list ID / รหัสรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('priceList.delete'))
  @Serialize(PriceListMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a price list',
    description: 'Removes an outdated or incorrect vendor price list from active use. Historical pricing data is retained for audit purposes.',
    operationId: 'deletePriceListByBusinessUnit',
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
        description: 'Price list was successfully deleted',
      },
      404: {
        description: 'Price list was not found',
      },
    },
    'x-description-th': 'ลบรายการราคาตาม ID',
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
      PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.priceListService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
