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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Config_PriceListService } from './config_price-list.service';
import {
  PriceListCreateDto,
  PriceListUpdateDto,
  BaseHttpController,
  Result,
  ErrorCode,
  EnrichAuditUsers,
} from '@/common';
import {
  IPaginate,
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ConfigPriceListCreateRequestDto, ConfigPriceListUpdateRequestDto } from './swagger/request';

@Controller('api/config/:bu_code/price-list')
@ApiTags('Config: Price Lists')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_PriceListController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_PriceListController.name,
  );

  constructor(
    private readonly configPriceListService: Config_PriceListService,
  ) {
    super();
  }

  /**
   * Bulk imports vendor price lists from an Excel file for efficient multi-supplier pricing updates
   * นำเข้ารายการราคาจากผู้ขายจำนวนมากจากไฟล์ Excel สำหรับการอัปเดตราคาจากหลายซัพพลายเออร์
   * @param createConfigPriceListDto - Price list data from Excel / ข้อมูลรายการราคาจาก Excel
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Post('upload-excel')
  @UseGuards(new AppIdGuard('priceList.uploadExcel'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload price list from Excel',
    description: 'Bulk imports vendor price lists from an Excel file, enabling administrators to efficiently update product pricing from multiple suppliers for procurement cost control.',
    operationId: 'configPriceList_uploadExcel',
    responses: { 201: { description: 'Price list uploaded successfully' } },
    'x-description-th': 'อัปโหลดรายการราคาจากไฟล์ Excel',
  } as any)
  @ApiBody({ type: ConfigPriceListCreateRequestDto })
  async uploadExcel(
    @Body() createConfigPriceListDto: PriceListCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'uploadExcel',
        createConfigPriceListDto,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `uploadExcel config-price-list ${createConfigPriceListDto} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.uploadExcel(
      createConfigPriceListDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Exports a vendor price list to Excel format for offline review and cost analysis
   * ส่งออกรายการราคาผู้ขายเป็นรูปแบบ Excel สำหรับการตรวจสอบและวิเคราะห์ต้นทุนแบบออฟไลน์
   * @param id - Price list ID / รหัสรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id/download-excel')
  @UseGuards(new AppIdGuard('priceList.downloadExcel'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Download price list as Excel',
    description: 'Exports a vendor price list to Excel format for offline review, comparison, or sharing with stakeholders for procurement cost analysis and budget planning.',
    operationId: 'configPriceList_downloadExcel',
    responses: { 200: { description: 'Price list Excel downloaded successfully' } },
    'x-description-th': 'ดาวน์โหลดรายการราคาเป็นไฟล์ Excel',
  } as any)
  async downloadExcel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'downloadExcel',
        id,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `downloadExcel config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.downloadExcel(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Creates a new vendor price list with product-level pricing details
   * สร้างรายการราคาผู้ขายใหม่พร้อมรายละเอียดราคาระดับสินค้า
   * @param createConfigPriceListDto - Price list creation data / ข้อมูลสำหรับสร้างรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('priceList.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new price list',
    description: 'Creates a new vendor price list with product-level pricing details. Price lists are used during purchase order creation to automatically populate agreed vendor prices for cost control.',
    operationId: 'configPriceList_create',
    responses: { 201: { description: 'Price list created successfully' } },
    'x-description-th': 'สร้างรายการราคาใหม่',
  } as any)
  @ApiBody({ type: ConfigPriceListCreateRequestDto })
  async create(
    @Body() createConfigPriceListDto: PriceListCreateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        data: JSON.stringify(createConfigPriceListDto),
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configPriceListService.create(
      createConfigPriceListDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Lists all vendor price lists for comparing supplier pricing
   * ค้นหารายการราคาทั้งหมดของผู้ขายสำหรับเปรียบเทียบราคาซัพพลายเออร์
   * @param query - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและตัวกรอง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('priceList.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all price lists',
    description: 'Returns all vendor price lists configured for the business unit. Used by procurement staff to compare supplier pricing and manage cost agreements across vendors.',
    operationId: 'configPriceList_findAll',
    responses: { 200: { description: 'Price lists retrieved successfully' } },
    'x-description-th': 'แสดงรายการราคาทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  async findAll(
    @Query() query: IPaginateQuery,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query) as IPaginate;
    this.logger.log(
      `findAll config-price-list ${user_id} ${bu_code} ${paginate} ${version}`,
    );
    const result = await this.configPriceListService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieves a specific vendor price list with all line-item pricing details
   * ค้นหารายการราคาเดียวตาม ID พร้อมรายละเอียดราคาสินค้าทั้งหมด
   * @param id - Price list ID / รหัสรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('priceList.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a price list by ID',
    description: 'Retrieves a specific vendor price list with all its line-item pricing details. Used to review agreed product prices from a particular vendor for procurement decisions.',
    operationId: 'configPriceList_findOne',
    responses: { 200: { description: 'Price list retrieved successfully' } },
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
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `findOne config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Modifies an existing vendor price list such as updating product prices or validity dates
   * อัปเดตรายการราคาผู้ขายที่มีอยู่ เช่น การอัปเดตราคาสินค้าหรือวันที่มีผลบังคับใช้
   * @param id - Price list ID / รหัสรายการราคา
   * @param updateConfigPriceListDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('priceList.update'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a price list',
    description: 'Modifies an existing vendor price list, such as updating product prices, validity dates, or adding new product lines. Updated prices are used in subsequent purchase order creation.',
    operationId: 'configPriceList_update',
    responses: { 200: { description: 'Price list updated successfully' } },
    'x-description-th': 'อัปเดตข้อมูลรายการราคาที่มีอยู่',
  } as any)
  @ApiBody({ type: ConfigPriceListUpdateRequestDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateConfigPriceListDto: PriceListUpdateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateConfigPriceListDto,
        version,
      },
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `update config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.update(
      id,
      updateConfigPriceListDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Removes a vendor price list from the system
   * ลบรายการราคาผู้ขายออกจากระบบ บันทึกการจัดซื้อในอดีตไม่ได้รับผลกระทบ
   * @param id - Price list ID / รหัสรายการราคา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('priceList.remove'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a price list',
    description: 'Removes a vendor price list from the system. The price list will no longer be used for automated pricing in purchase orders, but historical procurement records are unaffected.',
    operationId: 'configPriceList_delete',
    responses: { 200: { description: 'Price list deleted successfully' } },
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
      Config_PriceListController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    this.logger.log(
      `remove config-price-list ${id} ${user_id} ${bu_code} ${version}`,
    );
    const result = await this.configPriceListService.remove(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Bulk imports vendor price list data from a CSV file
   * นำเข้าข้อมูลรายการราคาจำนวนมากจากไฟล์ CSV แถวที่ไม่ถูกต้องจะถูกข้ามและรายงาน
   * @param file - CSV file upload / ไฟล์ CSV ที่อัปโหลด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   */
  @Post('import-csv')
  @UseGuards(new AppIdGuard('priceList.importCsv'))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Import price lists from CSV',
    description: 'Bulk imports vendor price list data from a CSV file, creating or updating price lists and their line items. Invalid rows are skipped and reported, enabling efficient mass updates of procurement pricing.',
    operationId: 'configPriceList_importCsv',
    responses: { 201: { description: 'Price list CSV imported successfully' } },
    'x-description-th': 'นำเข้ารายการราคาจากไฟล์ CSV',
  } as any)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file containing price list data',
        },
      },
      required: ['file'],
    },
  })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'importCsv',
        fileName: file?.originalname,
        fileSize: file?.size,
        version,
      },
      Config_PriceListController.name,
    );

    if (!file) {
      const result = Result.error('No file provided', ErrorCode.INVALID_ARGUMENT);
      this.respond(res, result);
      return;
    }

    // Validate file type
    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const result = Result.error(
        `Invalid file type: ${file.mimetype}. Please upload a CSV file.`,
        ErrorCode.INVALID_ARGUMENT
      );
      this.respond(res, result);
      return;
    }

    const { user_id } = ExtractRequestHeader(req);
    const csvContent = file.buffer.toString('utf-8');

    this.logger.log(
      `importCsv config-price-list ${file.originalname} ${user_id} ${bu_code} ${version}`,
    );

    const result = await this.configPriceListService.importCsv(
      csvContent,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }
}
