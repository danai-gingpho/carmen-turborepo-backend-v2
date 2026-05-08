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
import { Config_CreditTermService } from './config_credit_term.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  CreditTermCreateDto,
  CreditTermUpdateDto,
  IUpdateCreditTerm,
  EnrichAuditUsers,
  Serialize,
  CreditTermDetailResponseSchema,
  CreditTermListItemResponseSchema,
  CreditTermMutationResponseSchema,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { CreditTermCreateRequestDto, CreditTermUpdateRequestDto } from './swagger/request';

@ApiTags('Config: Vendors')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/credit-term')
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_CreditTermController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CreditTermController.name,
  );

  constructor(
    private readonly configCreditTermService: Config_CreditTermService,
  ) {
    super();
  }

  /**
   * Get a credit term by ID
   * ค้นหาเงื่อนไขการชำระเงินเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Credit term ID / รหัสเงื่อนไขการชำระเงิน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Credit term detail / รายละเอียดเงื่อนไขการชำระเงิน
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('creditTerm.findOne'))
  @Serialize(CreditTermDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a credit term by ID',
    description: 'Retrieves a specific payment term definition (e.g., Net 30, Net 60, COD) including its due day calculation rules. Credit terms are assigned to vendors to determine invoice payment deadlines.',
    operationId: 'configCreditTerm_findOne',
    responses: {
      200: { description: 'Credit term retrieved successfully' },
      404: { description: 'Credit term not found' },
    },
    'x-description-th': 'ดึงข้อมูลเงื่อนไขการชำระเงินรายการเดียวตาม ID',
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
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configCreditTermService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all credit terms with pagination
   * ค้นหารายการเงื่อนไขการชำระเงินทั้งหมดพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of credit terms / รายการเงื่อนไขการชำระเงินพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('creditTerm.findAll'))
  @Serialize(CreditTermListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all credit terms',
    description: 'Returns all payment term definitions configured for the business unit. These terms are used when setting up vendor agreements and calculating invoice due dates for accounts payable.',
    operationId: 'configCreditTerm_findAll',
    responses: { 200: { description: 'Credit terms retrieved successfully' } },
    'x-description-th': 'แสดงรายการเงื่อนไขการชำระเงินทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
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
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configCreditTermService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new credit term
   * สร้างเงื่อนไขการชำระเงินใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Credit term creation data / ข้อมูลสำหรับสร้างเงื่อนไขการชำระเงิน
   * @param version - API version / เวอร์ชัน API
   * @returns Created credit term / เงื่อนไขการชำระเงินที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('creditTerm.create'))
  @Serialize(CreditTermMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new credit term',
    description: 'Defines a new payment term (e.g., Net 30, Net 60, COD) with its due date calculation rules. Once created, the credit term can be assigned to vendors for invoice payment scheduling.',
    operationId: 'configCreditTerm_create',
    responses: { 201: { description: 'Credit term created successfully' } },
    'x-description-th': 'สร้างเงื่อนไขการชำระเงินใหม่',
  } as any)
  @ApiBody({ type: CreditTermCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: CreditTermCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configCreditTermService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a credit term
   * อัปเดตเงื่อนไขการชำระเงิน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Credit term ID / รหัสเงื่อนไขการชำระเงิน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Credit term update data / ข้อมูลสำหรับอัปเดตเงื่อนไขการชำระเงิน
   * @param version - API version / เวอร์ชัน API
   * @returns Updated credit term / เงื่อนไขการชำระเงินที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('creditTerm.update'))
  @Serialize(CreditTermMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a credit term',
    description: 'Modifies an existing payment term definition, such as adjusting the number of credit days or payment conditions. Changes affect future invoice due date calculations for vendors using this term.',
    operationId: 'configCreditTerm_update',
    responses: {
      200: { description: 'Credit term updated successfully' },
      404: { description: 'Credit term not found' },
    },
    'x-description-th': 'อัปเดตข้อมูลเงื่อนไขการชำระเงินที่มีอยู่',
  } as any)
  @ApiBody({ type: CreditTermUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CreditTermUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCreditTerm = {
      ...updateDto,
      id,
    };
    const result = await this.configCreditTermService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a credit term
   * ลบเงื่อนไขการชำระเงิน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Credit term ID / รหัสเงื่อนไขการชำระเงิน
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('creditTerm.delete'))
  @Serialize(CreditTermMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a credit term',
    description: 'Removes a payment term from active use. The term will no longer be assignable to vendors, but existing vendor agreements and historical invoices using this term are preserved.',
    operationId: 'configCreditTerm_delete',
    responses: {
      200: { description: 'Credit term deleted successfully' },
      404: { description: 'Credit term not found' },
    },
    'x-description-th': 'ลบเงื่อนไขการชำระเงินตาม ID',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configCreditTermService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
