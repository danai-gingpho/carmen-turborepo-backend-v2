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
import { Config_ProductsService } from './config_products.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductCreateRequestDto, ProductUpdateRequestDto } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  IUpdateProduct,
  ProductCreateDto,
  ProductUpdateDto,
  Serialize,
  EnrichAuditUsers,
  ProductDetailResponseSchema,
  ProductListItemResponseSchema,
  ProductItemGroupResponseSchema,
  ProductMutationResponseSchema,
  BaseHttpController,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/products')
@ApiTags('Config: Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_ProductsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductsController.name,
  );

  constructor(
    private readonly config_productsService: Config_ProductsService,
  ) {
    super();
  }

  /**
   * Get a product by ID
   * ค้นหาสินค้าเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Product ID / รหัสสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Product detail / รายละเอียดสินค้า
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('product.findOne'))
  @Serialize(ProductDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a product by ID',
    description: 'Retrieves the complete details of a product from the master catalog, including SKU, description, category, and unit of measure configurations used across procurement and inventory.',
    operationId: 'configProducts_findOne',
    responses: { 200: { description: 'Product retrieved successfully' } },
    'x-description-th': 'ดึงข้อมูลสินค้ารายการเดียวตาม ID',
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Get all products with pagination
   * ค้นหารายการสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of products / รายการสินค้าพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('product.findAll'))
  @Serialize(ProductListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all products',
    description: 'Returns a paginated list of all products in the master catalog. Used by administrators to browse and manage SKUs, ingredients, and supplies available for procurement and inventory operations.',
    operationId: 'configProducts_findAll',
    responses: { 200: { description: 'Products retrieved successfully' } },
    'x-description-th': 'แสดงรายการสินค้าทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
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
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );

    this.respond(res, result);
  }

  /**
   * Get product item group by product ID
   * ค้นหากลุ่มสินค้าตามรหัสสินค้า
   * @param id - Product ID / รหัสสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Product item group detail / รายละเอียดกลุ่มสินค้า
   */
  @Get('item-group/:id')
  @UseGuards(new AppIdGuard('product.findItemGroup'))
  @Serialize(ProductItemGroupResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product item group by ID',
    description: 'Retrieves the item group classification for a specific product, which determines how the product is grouped for reporting, procurement analysis, and inventory categorization.',
    operationId: 'configProducts_findItemGroup',
    responses: { 200: { description: 'Product item group retrieved successfully' } },
    'x-description-th': 'ดึงข้อมูลกลุ่มรายการสินค้าตาม ID',
  } as any)
  async findItemGroup(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findItemGroup',
        id,
        version,
      },
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.findItemGroup(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  // @Get('by-item-group-id/:id')
  // async getByItemsGroup(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
  //   this.logger.debug({
  //     file: ProductsController.name,
  //     function: this.getByItemsGroup.name,
  //   });
  //   // return this.productsService.getByItemsGroup(id);
  // }

  // @Get('order-unit/:id')
  // async getOrderUnitByProductId(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
  //   this.logger.debug({
  //     file: ProductsController.name,
  //     function: this.getOrderUnitByProductId.name,
  //   });
  //   // return this.productsService.getOrderUnitByProductId(id);
  // }

  // @Get('ingredient-unit/:id')
  // async getIngredientUnitByProductId(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
  //   this.logger.debug({
  //     file: ProductsController.name,
  //     function: this.getIngredientUnitByProductId.name,
  //   });
  //   // return this.productsService.getIngredientUnitByProductId(id);
  // }

  /**
   * Create a new product
   * สร้างสินค้าใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Product creation data / ข้อมูลสำหรับสร้างสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Created product / สินค้าที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('product.create'))
  @Serialize(ProductMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Adds a new product to the master catalog with its SKU, description, category, and unit definitions. The product becomes available for use in purchase requests, purchase orders, and inventory transactions.',
    operationId: 'configProducts_create',
    responses: { 201: { description: 'Product created successfully' } },
    'x-description-th': 'สร้างสินค้าใหม่',
  } as any)
  @ApiBody({ type: ProductCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a product
   * อัปเดตสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product ID / รหัสสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Product update data / ข้อมูลสำหรับอัปเดตสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated product / สินค้าที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('product.update'))
  @Serialize(ProductMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a product',
    description: 'Modifies an existing product in the master catalog, such as updating its description, category assignment, or unit configurations. Changes affect all future procurement and inventory transactions referencing this product.',
    operationId: 'configProducts_update',
    responses: { 200: { description: 'Product updated successfully' } },
    'x-description-th': 'อัปเดตข้อมูลสินค้าที่มีอยู่',
  } as any)
  @ApiBody({ type: ProductUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProduct = {
      ...updateDto,
      id,
    };
    const result = await this.config_productsService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a product
   * ลบสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product ID / รหัสสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('product.delete'))
  @Serialize(ProductMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Soft-deletes a product from the master catalog. The product will no longer be available for new procurement or inventory transactions, but historical records referencing it are preserved.',
    operationId: 'configProducts_delete',
    responses: { 200: { description: 'Product deleted successfully' } },
    'x-description-th': 'ลบสินค้าตาม ID',
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
      Config_ProductsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
