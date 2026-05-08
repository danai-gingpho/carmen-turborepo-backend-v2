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
import { Config_ExchangeRateService } from './config_exchange-rate.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  ExchangeRateCreateDto,
  ExchangeRateUpdateDto,
  IUpdateExchangeRate,
  Serialize,
  EnrichAuditUsers,
  ExchangeRateDetailResponseSchema,
  ExchangeRateListItemResponseSchema,
  ExchangeRateMutationResponseSchema,
} from '@/common';
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
import { ExchangeRateCreateRequest, ExchangeRateUpdateRequest } from './swagger/request';
import {
  ExchangeRateResponseDto,
  ExchangeRateByDateResponseDto,
  ExchangeRateListResponseDto,
  ExchangeRateMutationResponseDto,
} from './swagger/response';

@Controller('api/config/:bu_code/exchange-rate')
@ApiTags('Config: Currencies & FX')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_ExchangeRateController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ExchangeRateController.name,
  );

  constructor(
    private readonly config_exchangeRateService: Config_ExchangeRateService,
  ) {
    super();
  }

  /**
   * Retrieves a specific currency exchange rate for multi-currency procurement
   * ค้นหาอัตราแลกเปลี่ยนเดียวตาม ID สำหรับการจัดซื้อหลายสกุลเงิน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Exchange rate ID / รหัสอัตราแลกเปลี่ยน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('exchangeRate.findOne'))
  @Serialize(ExchangeRateDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get an exchange rate by ID',
    description: 'Retrieves a specific currency exchange rate record with its effective date and conversion factor. Exchange rates are used to convert foreign currency amounts in procurement documents to the base currency.',
    operationId: 'configExchangeRate_findOne',
    'x-description-th': 'ดึงข้อมูลอัตราแลกเปลี่ยนรายการเดียวตาม ID',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BLAVG' })
  @ApiParam({ name: 'id', description: 'Exchange rate ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Exchange rate retrieved successfully', type: ExchangeRateResponseDto })
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
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_exchangeRateService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Lists all currency exchange rates for the business unit
   * ค้นหาอัตราแลกเปลี่ยนทั้งหมดที่กำหนดค่าสำหรับหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('exchangeRate.findAll'))
  @Serialize(ExchangeRateListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all exchange rates',
    description: 'Returns all configured currency exchange rates with their effective dates. Used by the procurement system to convert multi-currency purchase orders and invoices to the base currency.',
    operationId: 'configExchangeRate_findAll',
    'x-description-th': 'แสดงรายการอัตราแลกเปลี่ยนทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BLAVG' })
  @ApiResponse({ status: 200, description: 'Exchange rates retrieved successfully', type: ExchangeRateListResponseDto })
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
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_exchangeRateService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieves an exchange rate by date and currency code
   * ค้นหาอัตราแลกเปลี่ยนตามวันที่และรหัสสกุลเงิน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param date - Exchange rate date (yyyy-MM-dd) / วันที่อัตราแลกเปลี่ยน
   * @param currency_code - Currency code (e.g. USD) / รหัสสกุลเงิน
   * @param version - API version / เวอร์ชัน API
   */
  @Get('by-date/:date/:currency_code')
  @UseGuards(new AppIdGuard('exchangeRate.findByDateAndCurrency'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get exchange rate by date and currency code',
    description: 'Retrieves the exchange rate for a specific date and currency code. If the currency code matches the business unit default currency, returns exchange_rate = 1 without querying the exchange rate table.',
    operationId: 'configExchangeRate_findByDateAndCurrency',
    'x-description-th': 'ดึงข้อมูลอัตราแลกเปลี่ยนตามวันที่และรหัสสกุลเงิน',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BLAVG' })
  @ApiParam({ name: 'date', description: 'Exchange rate date (yyyy-MM-dd)', example: '2026-03-19' })
  @ApiParam({ name: 'currency_code', description: 'Currency code (ISO 4217)', example: 'USD' })
  @ApiResponse({ status: 200, description: 'Exchange rate retrieved successfully', type: ExchangeRateByDateResponseDto })
  @ApiResponse({ status: 404, description: 'Exchange rate not found for the given date and currency code' })
  async findByDateAndCurrency(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('date') date: string,
    @Param('currency_code') currency_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findByDateAndCurrency',
        date,
        currency_code,
        version,
      },
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_exchangeRateService.findByDateAndCurrency(
      date,
      currency_code,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Creates a new exchange rate between currencies
   * สร้างอัตราแลกเปลี่ยนใหม่ระหว่างสกุลเงินสำหรับการคำนวณการจัดซื้อหลายสกุลเงิน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Exchange rate creation data / ข้อมูลสำหรับสร้างอัตราแลกเปลี่ยน
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('exchangeRate.create'))
  @Serialize(ExchangeRateMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new exchange rate',
    description: 'Records a new currency exchange rate with its effective date. Supports single or bulk creation. currency_code and currency_name are automatically populated from the currency_id.',
    operationId: 'configExchangeRate_create',
    'x-description-th': 'สร้างอัตราแลกเปลี่ยนใหม่',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BLAVG' })
  @ApiResponse({ status: 201, description: 'Exchange rate created successfully', type: ExchangeRateMutationResponseDto })
  @ApiBody({ type: ExchangeRateCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: Record<string, unknown> | Record<string, unknown>[],
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_exchangeRateService.create(
      createDto as any,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Modifies an existing exchange rate record
   * อัปเดตอัตราแลกเปลี่ยนที่มีอยู่ เช่น แก้ไขอัตราการแปลงหรือวันที่มีผลบังคับใช้
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Exchange rate ID / รหัสอัตราแลกเปลี่ยน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('exchangeRate.update'))
  @Serialize(ExchangeRateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update an exchange rate',
    description: 'Modifies an existing exchange rate record, such as correcting the conversion factor or adjusting the effective date. Changes affect future currency conversions in procurement documents.',
    operationId: 'configExchangeRate_update',
    'x-description-th': 'อัปเดตข้อมูลอัตราแลกเปลี่ยนที่มีอยู่',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BLAVG' })
  @ApiParam({ name: 'id', description: 'Exchange rate ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Exchange rate updated successfully', type: ExchangeRateMutationResponseDto })
  @ApiBody({ type: ExchangeRateUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ExchangeRateUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateExchangeRate = {
      ...updateDto,
      id,
    };
    const result = await this.config_exchangeRateService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Removes an exchange rate record from the system
   * ลบอัตราแลกเปลี่ยนออกจากระบบ เอกสารจัดซื้อในอดีตไม่ได้รับผลกระทบ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Exchange rate ID / รหัสอัตราแลกเปลี่ยน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('exchangeRate.delete'))
  @Serialize(ExchangeRateMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete an exchange rate',
    description: 'Removes an exchange rate record from the system (soft delete). Historical procurement documents that used this rate are unaffected, but it will no longer be available for future currency conversions.',
    operationId: 'configExchangeRate_delete',
    'x-description-th': 'ลบอัตราแลกเปลี่ยนตาม ID',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BLAVG' })
  @ApiParam({ name: 'id', description: 'Exchange rate ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Exchange rate deleted successfully', type: ExchangeRateMutationResponseDto })
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
      Config_ExchangeRateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_exchangeRateService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
