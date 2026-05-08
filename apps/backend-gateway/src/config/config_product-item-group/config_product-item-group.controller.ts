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
import { Config_ProductItemGroupService } from './config_product-item-group.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ProductItemGroupCreateRequest, ProductItemGroupUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateProductItemGroup,
  ProductItemGroupCreateDto,
  ProductItemGroupUpdateDto,
  Serialize,
  EnrichAuditUsers,
  ProductItemGroupDetailResponseSchema,
  ProductItemGroupListItemResponseSchema,
  ProductItemGroupMutationResponseSchema,
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

@Controller('api/config/:bu_code/products/item-group')
@ApiTags('Config: Products')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_ProductItemGroupController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductItemGroupController.name,
  );

  constructor(
    private readonly config_productItemGroupService: Config_ProductItemGroupService,
  ) {
    super();
  }

  /**
   * Retrieve a product item group by ID
   * ค้นหารายการเดียวตาม ID ของกลุ่มสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product item group ID / รหัสกลุ่มสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Product item group detail / รายละเอียดกลุ่มสินค้า
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('productItemGroup.findOne'))
  @Serialize(ProductItemGroupDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a product item group by ID', description: 'Retrieves a specific product item group definition used to group products for procurement reporting and analysis (e.g., Food Items, Beverage Items, Operating Supplies).', operationId: 'configProductItemGroup_findOne', 'x-description-th': 'ดึงข้อมูลกลุ่มรายการสินค้ารายการเดียวตาม ID' } as any)
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
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productItemGroupService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all product item groups with pagination
   * ค้นหารายการทั้งหมดของกลุ่มสินค้าพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of product item groups / รายการกลุ่มสินค้าแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('productItemGroup.findAll'))
  @Serialize(ProductItemGroupListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({ summary: 'Get all product item groups', description: 'Returns all product item groups configured for the business unit. Item groups are used to classify products for aggregated procurement reporting, spend analysis, and inventory valuation.', operationId: 'configProductItemGroup_findAll', 'x-description-th': 'แสดงรายการกลุ่มรายการสินค้าทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
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
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_productItemGroupService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new product item group
   * สร้างกลุ่มสินค้าใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Product item group creation data / ข้อมูลสำหรับสร้างกลุ่มสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Created product item group / กลุ่มสินค้าที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('productItemGroup.create'))
  @Serialize(ProductItemGroupMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product item group', description: 'Defines a new product grouping for reporting and procurement analysis. Products assigned to this group will be aggregated together in spend reports and inventory summaries.', operationId: 'configProductItemGroup_create', 'x-description-th': 'สร้างกลุ่มรายการสินค้าใหม่' } as any)
  @ApiBody({ type: ProductItemGroupCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ProductItemGroupCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productItemGroupService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing product item group
   * อัปเดตกลุ่มสินค้าที่มีอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product item group ID / รหัสกลุ่มสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Product item group update data / ข้อมูลสำหรับอัปเดตกลุ่มสินค้า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated product item group / กลุ่มสินค้าที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('productItemGroup.update'))
  @Serialize(ProductItemGroupMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a product item group', description: 'Modifies an existing product item group, such as renaming it or adjusting its classification. Changes affect how products are grouped in procurement and inventory reports.', operationId: 'configProductItemGroup_update', 'x-description-th': 'อัปเดตข้อมูลกลุ่มรายการสินค้าที่มีอยู่' } as any)
  @ApiBody({ type: ProductItemGroupUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ProductItemGroupUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateProductItemGroup = {
      ...updateDto,
      id,
    };
    const result = await this.config_productItemGroupService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a product item group by ID
   * ลบกลุ่มสินค้าตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Product item group ID / รหัสกลุ่มสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('productItemGroup.delete'))
  @Serialize(ProductItemGroupMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product item group', description: 'Removes a product item group from the system. Products currently assigned to this group should be reassigned before deletion to maintain reporting accuracy.', operationId: 'configProductItemGroup_delete', 'x-description-th': 'ลบกลุ่มรายการสินค้าตาม ID' } as any)
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
      Config_ProductItemGroupController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productItemGroupService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
