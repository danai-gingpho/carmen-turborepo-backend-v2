import {
  Body,
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
import { Config_ProductCategoryService } from './config_product-category.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductCategoryCreateRequest, ProductCategoryUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateProductCategory,
  ProductCategoryCreateDto,
  ProductCategoryUpdateDto,
  Serialize,
  EnrichAuditUsers,
  ProductCategoryDetailResponseSchema,
  ProductCategoryListItemResponseSchema,
  ProductCategoryMutationResponseSchema,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/products/category')
@ApiTags('Config: Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_ProductCategoryController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductCategoryController.name,
  );

  constructor(
    private readonly config_productCategoryService: Config_ProductCategoryService,
  ) {
    super();
  }

  /**
   * Retrieve a product category by ID
   * ค้นหารายการเดียวตาม ID ของหมวดหมู่สินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product category ID / รหัสหมวดหมู่สินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product category detail / รายละเอียดหมวดหมู่สินค้า
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('productCategory.findOne'))
  @Serialize(ProductCategoryDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a product category by ID', description: 'Retrieves a specific product category used to classify products in the master catalog (e.g., Fresh Produce, Dry Goods, Beverages, Cleaning Supplies). Categories form the top level of the product classification hierarchy.', operationId: 'configProductCategory_findOne', 'x-description-th': 'ดึงข้อมูลหมวดหมู่สินค้ารายการเดียวตาม ID' } as any)
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
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productCategoryService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all product categories with pagination
   * ค้นหารายการทั้งหมดของหมวดหมู่สินค้าพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of product categories / รายการหมวดหมู่สินค้าแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('productCategory.findAll'))
  @Serialize(ProductCategoryListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({ summary: 'Get all product categories', description: 'Returns all product categories configured for the business unit. Categories provide the primary classification for organizing the product catalog and generating procurement reports by product type.', operationId: 'configProductCategory_findAll', 'x-description-th': 'แสดงรายการหมวดหมู่สินค้าทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
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
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productCategoryService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new product category
   * สร้างหมวดหมู่สินค้าใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Product category creation data / ข้อมูลสำหรับสร้างหมวดหมู่สินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Created product category / หมวดหมู่สินค้าที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('productCategory.create'))
  @Serialize(ProductCategoryMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product category', description: 'Defines a new top-level product category for classifying items in the master catalog. Sub-categories can then be created under this category for more granular classification.', operationId: 'configProductCategory_create', 'x-description-th': 'สร้างหมวดหมู่สินค้าใหม่' } as any)
  @ApiBody({ type: ProductCategoryCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductCategoryCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productCategoryService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing product category
   * อัปเดตหมวดหมู่สินค้าที่มีอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product category ID / รหัสหมวดหมู่สินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Product category update data / ข้อมูลสำหรับอัปเดตหมวดหมู่สินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated product category / หมวดหมู่สินค้าที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('productCategory.update'))
  @Serialize(ProductCategoryMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a product category', description: 'Modifies an existing product category, such as renaming it or adjusting its display order. Changes affect how products are organized in the catalog and categorized in procurement reports.', operationId: 'configProductCategory_update', 'x-description-th': 'อัปเดตข้อมูลหมวดหมู่สินค้าที่มีอยู่' } as any)
  @ApiBody({ type: ProductCategoryUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductCategoryUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProductCategory = {
      ...updateDto,
      id,
    };
    const result = await this.config_productCategoryService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a product category by ID
   * ลบหมวดหมู่สินค้าตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product category ID / รหัสหมวดหมู่สินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('productCategory.delete'))
  @Serialize(ProductCategoryMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product category', description: 'Removes a product category from the classification hierarchy. Products currently assigned to this category should be reassigned before deletion.', operationId: 'configProductCategory_delete', 'x-description-th': 'ลบหมวดหมู่สินค้าตาม ID' } as any)
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
      Config_ProductCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productCategoryService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
