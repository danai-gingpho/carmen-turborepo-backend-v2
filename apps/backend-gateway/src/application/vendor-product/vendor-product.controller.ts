import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { VendorProductService } from './vendor-product.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  EnrichAuditUsers,
} from '@/common';

@Controller('api/:bu_code/vendor-product')
@ApiTags('Procurement: Vendor Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class VendorProductController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorProductController.name,
  );

  constructor(private readonly vendorProductService: VendorProductService) {
    super();
  }

  /**
   * Get a specific vendor-product mapping by ID
   * ค้นหารายการสินค้าผู้ขายเดียวตาม ID
   * @param id - Vendor product ID / รหัสสินค้าผู้ขาย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Vendor product details / รายละเอียดสินค้าผู้ขาย
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('vendorProduct.findOne'))
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get vendor product by ID',
    description: 'Retrieves a specific vendor-product mapping including the vendor\'s pricing, lead time, and supply terms for a particular product, used for procurement decision-making and purchase order generation.',
    operationId: 'getVendorProductById',
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
        description: 'Vendor product retrieved successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
    'x-description-th': 'ดึงข้อมูลสินค้าของผู้ขายรายการเดียวตาม ID',
  } as any)
  @HttpCode(HttpStatus.OK)
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
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * List all vendor-product mappings for the business unit
   * ค้นหารายการสินค้าผู้ขายทั้งหมดของหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of vendor products / รายการสินค้าผู้ขาย
   */
  @Get()
  @UseGuards(new AppIdGuard('vendorProduct.findAll'))
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all vendor products',
    description: 'Lists all vendor-product mappings within the business unit, showing which products each vendor supplies along with pricing information, enabling procurement staff to compare vendor offerings.',
    operationId: 'getAllVendorProducts',
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
        description: 'Vendor products retrieved successfully',
      },
      404: {
        description: 'Vendor products not found',
      },
    },
    'x-description-th': 'แสดงรายการสินค้าของผู้ขายทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.findAll(user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Create a new vendor-product mapping
   * สร้างการผูกสินค้ากับผู้ขายใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created vendor product / สินค้าผู้ขายที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('vendorProduct.create'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a vendor product',
    description: 'Creates a new vendor-product mapping, registering that a specific vendor supplies a particular product with its pricing and supply terms for use in procurement operations.',
    operationId: 'createVendorProduct',
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
        description: 'Vendor product created successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
    'x-description-th': 'สร้างสินค้าของผู้ขายใหม่',
  } as any)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.create(user_id, bu_code, version);
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing vendor-product mapping
   * อัปเดตการผูกสินค้ากับผู้ขายที่มีอยู่
   * @param id - Vendor product ID / รหัสสินค้าผู้ขาย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated vendor product / สินค้าผู้ขายที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('vendorProduct.update'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a vendor product',
    description: 'Updates a vendor-product mapping to reflect changes in pricing, supply terms, or availability, keeping vendor catalog information current for accurate procurement.',
    operationId: 'updateVendorProduct',
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
        description: 'Vendor product updated successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลสินค้าของผู้ขายที่มีอยู่',
  } as any)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.update(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a vendor-product mapping by ID
   * ลบการผูกสินค้ากับผู้ขายตาม ID
   * @param id - Vendor product ID / รหัสสินค้าผู้ขาย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('vendorProduct.delete'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a vendor product',
    description: 'Removes a vendor-product mapping when a vendor no longer supplies a particular product, preventing it from appearing in procurement workflows and purchase order creation.',
    operationId: 'deleteVendorProduct',
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
        description: 'Vendor product deleted successfully',
      },
      404: {
        description: 'Vendor product not found',
      },
    },
    'x-description-th': 'ลบสินค้าของผู้ขายตาม ID',
  } as any)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      VendorProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.vendorProductService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
