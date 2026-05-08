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
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_CurrenciesService } from './config_currencies.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  CurrenciesCreateDto,
  CurrenciesUpdateDto,
  IUpdateCurrencies,
  EnrichAuditUsers,
  Serialize,
  CurrencyResponseSchema,
  CurrencyDetailResponseSchema,
  CurrencyListItemResponseSchema,
} from '@/common';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { CurrencyCreateRequestDto, CurrencyUpdateRequestDto } from './swagger/request';

@Controller('api/config/:bu_code/currencies')
@ApiTags('Config: Currencies & FX')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_CurrenciesController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CurrenciesController.name,
  );

  constructor(private readonly currenciesService: Config_CurrenciesService) {
    super();
  }

  /**
   * Get a currency by ID
   * ค้นหาสกุลเงินเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Currency ID / รหัสสกุลเงิน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Currency detail / รายละเอียดสกุลเงิน
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('currencies.findOne'))
  @Serialize(CurrencyDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a currency by ID',
    description: 'Retrieves a specific currency configuration including its code, symbol, and base currency status. Currencies are used in multi-currency procurement for purchase orders and vendor price lists.',
    operationId: 'configCurrencies_findOne',
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
        description: 'The unique identifier of the currency',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Currency retrieved successfully',
      },
      404: {
        description: 'Currency not found',
      },
    },
    'x-description-th': 'ดึงข้อมูลสกุลเงินรายการเดียวตาม ID',
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all currencies with pagination
   * ค้นหารายการสกุลเงินทั้งหมดพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of currencies / รายการสกุลเงินพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('currencies.findAll'))
  @Serialize(CurrencyListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all currencies',
    description: 'Returns all supported currencies configured for the business unit, including the base currency. Used to manage multi-currency support for international procurement and vendor payments.',
    operationId: 'configCurrencies_findAll',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Currencies retrieved successfully',
      },
      404: {
        description: 'Currencies not found',
      },
    },
    'x-description-th': 'แสดงรายการสกุลเงินทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  @ApiUserFilterQueries()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.currenciesService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new currency
   * สร้างสกุลเงินใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Currency creation data / ข้อมูลสำหรับสร้างสกุลเงิน
   * @param version - API version / เวอร์ชัน API
   * @returns Created currency / สกุลเงินที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('currencies.create'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new currency',
    description: 'Adds a new currency to the system for use in multi-currency procurement. Once created, the currency can be assigned exchange rates and used in purchase orders and vendor price lists.',
    operationId: 'configCurrencies_create',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'Currency created successfully',
      },
    },
    'x-description-th': 'สร้างสกุลเงินใหม่',
  } as any)
  @ApiBody({ type: CurrencyCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: CurrenciesCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a currency (full replacement)
   * อัปเดตสกุลเงิน (แทนที่ทั้งหมด)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Currency ID / รหัสสกุลเงิน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Currency update data / ข้อมูลสำหรับอัปเดตสกุลเงิน
   * @param version - API version / เวอร์ชัน API
   * @returns Updated currency / สกุลเงินที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('currencies.update'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a currency (full replacement)',
    description: 'Fully replaces a currency configuration, such as updating its symbol, decimal precision, or base currency designation. Changes affect how amounts are displayed and calculated in procurement documents.',
    operationId: 'configCurrencies_update',
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
        description: 'The unique identifier of the currency',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Currency updated successfully',
      },
      404: {
        description: 'Currency not found',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลสกุลเงินที่มีอยู่',
  } as any)
  @ApiBody({ type: CurrencyUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CurrenciesUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCurrencies = {
      ...updateDto,
      id,
    };
    const result = await this.currenciesService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Partially update a currency
   * อัปเดตสกุลเงินบางส่วน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Currency ID / รหัสสกุลเงิน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Partial currency update data / ข้อมูลสำหรับอัปเดตสกุลเงินบางส่วน
   * @param version - API version / เวอร์ชัน API
   * @returns Updated currency / สกุลเงินที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('currencies.patch'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Partially update a currency',
    description: 'Partially updates specific fields of a currency configuration without replacing the entire record. Useful for toggling active status or adjusting display settings.',
    operationId: 'configCurrencies_patch',
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
        description: 'The unique identifier of the currency',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Currency updated successfully',
      },
      404: {
        description: 'Currency not found',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลสกุลเงินบางส่วน',
  } as any)
  @ApiBody({ type: CurrencyUpdateRequestDto })
  async patch(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CurrenciesUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'patch',
        id,
        updateDto,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCurrencies = {
      ...updateDto,
      id,
    };
    const result = await this.currenciesService.patch(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a currency
   * ลบสกุลเงิน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Currency ID / รหัสสกุลเงิน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('currencies.delete'))
  @Serialize(CurrencyResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a currency',
    description: 'Removes a currency from active use. The currency will no longer be available for new procurement transactions, but historical records using this currency are preserved.',
    operationId: 'configCurrencies_delete',
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
        description: 'Currency deleted successfully',
      },
    },
    'x-description-th': 'ลบสกุลเงินตาม ID',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_CurrenciesController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.currenciesService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
