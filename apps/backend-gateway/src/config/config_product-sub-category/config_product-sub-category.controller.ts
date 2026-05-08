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
import { Config_ProductSubCategoryService } from './config_product-sub-category.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductSubCategoryCreateRequest, ProductSubCategoryUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateProductSubCategory,
  ProductSubCategoryCreateDto,
  ProductSubCategoryUpdateDto,
  Serialize,
  EnrichAuditUsers,
  ProductSubCategoryDetailResponseSchema,
  ProductSubCategoryListItemResponseSchema,
  ProductSubCategoryMutationResponseSchema,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/products/sub-category')
@ApiTags('Config: Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_ProductSubCategoryController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductSubCategoryController.name,
  );

  constructor(
    private readonly config_productSubCategoryService: Config_ProductSubCategoryService,
  ) {
    super();
  }

  /**
   * Retrieve a product sub-category by ID
   * ค้นหารายการเดียวตาม ID ของหมวดหมู่ย่อยสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product sub-category ID / รหัสหมวดหมู่ย่อยสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product sub-category detail / รายละเอียดหมวดหมู่ย่อยสินค้า
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('productSubCategory.findOne'))
  @Serialize(ProductSubCategoryDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Get a product sub-category by ID', description: 'Retrieves a specific product sub-category that provides a second level of classification under a parent category (e.g., Dairy under Fresh Produce, Spirits under Beverages).', operationId: 'configProductSubCategory_findOne', 'x-description-th': 'ดึงข้อมูลหมวดหมู่ย่อยสินค้ารายการเดียวตาม ID' } as any)
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
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productSubCategoryService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all product sub-categories with pagination
   * ค้นหารายการทั้งหมดของหมวดหมู่ย่อยสินค้าพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of product sub-categories / รายการหมวดหมู่ย่อยสินค้าแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('productSubCategory.findAll'))
  @Serialize(ProductSubCategoryListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({ summary: 'Get all product sub-categories', description: 'Returns all product sub-categories configured for the business unit. Sub-categories provide granular classification within parent categories for detailed product organization and reporting.', operationId: 'configProductSubCategory_findAll', 'x-description-th': 'แสดงรายการหมวดหมู่ย่อยสินค้าทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
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
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productSubCategoryService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new product sub-category
   * สร้างหมวดหมู่ย่อยสินค้าใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Product sub-category creation data / ข้อมูลสำหรับสร้างหมวดหมู่ย่อยสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Created product sub-category / หมวดหมู่ย่อยสินค้าที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('productSubCategory.create'))
  @Serialize(ProductSubCategoryMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Create a new product sub-category', description: 'Defines a new product sub-category under an existing parent category. Products can then be assigned to this sub-category for more detailed classification and reporting.', operationId: 'configProductSubCategory_create', 'x-description-th': 'สร้างหมวดหมู่ย่อยสินค้าใหม่' } as any)
  @ApiBody({ type: ProductSubCategoryCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductSubCategoryCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productSubCategoryService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing product sub-category
   * อัปเดตหมวดหมู่ย่อยสินค้าที่มีอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product sub-category ID / รหัสหมวดหมู่ย่อยสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Product sub-category update data / ข้อมูลสำหรับอัปเดตหมวดหมู่ย่อยสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated product sub-category / หมวดหมู่ย่อยสินค้าที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('productSubCategory.update'))
  @Serialize(ProductSubCategoryMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Update a product sub-category', description: 'Modifies an existing product sub-category, such as renaming it or reassigning it to a different parent category. Changes affect product classification and reporting.', operationId: 'configProductSubCategory_update', 'x-description-th': 'อัปเดตข้อมูลหมวดหมู่ย่อยสินค้าที่มีอยู่' } as any)
  @ApiBody({ type: ProductSubCategoryUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductSubCategoryUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProductSubCategory = {
      ...updateDto,
      id,
    };
    const result = await this.config_productSubCategoryService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a product sub-category by ID
   * ลบหมวดหมู่ย่อยสินค้าตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product sub-category ID / รหัสหมวดหมู่ย่อยสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('productSubCategory.delete'))
  @Serialize(ProductSubCategoryMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Delete a product sub-category', description: 'Removes a product sub-category from the classification hierarchy. Products assigned to this sub-category should be reassigned before deletion.', operationId: 'configProductSubCategory_delete', 'x-description-th': 'ลบหมวดหมู่ย่อยสินค้าตาม ID' } as any)
  async remove(
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
      Config_ProductSubCategoryController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productSubCategoryService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
