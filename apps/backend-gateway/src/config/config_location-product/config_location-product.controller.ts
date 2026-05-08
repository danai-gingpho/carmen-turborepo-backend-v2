import {
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_LocationProductService } from './config_location-product.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
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
import { BaseHttpController } from 'src/common/http/base-http-controller';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';

@Controller('api/config/:bu_code/location-product')
@ApiTags('Config: Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_LocationProductController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_LocationProductController.name,
  );

  constructor(
    private readonly config_locationProductService: Config_LocationProductService,
  ) {
    super();
  }

  /**
   * ค้นหา location ทั้งหมดพร้อม products ในแต่ละ location
   */
  @Get()
  @UseGuards(new AppIdGuard('locationProduct.getProductByLocationId'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all locations with their products (paginated)',
    description: 'Retrieves active locations with their assigned products, including category hierarchy, current stock, par level, need qty, and stock status. Paginated by location. Supports search by product name/code/sku and location name/code, and filter by category_id (item group).',
    operationId: 'configLocationProduct_findAll',
    'x-description-th': 'แสดงรายการสถานที่ตามสินค้าทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  async findAllLocationsWithProducts(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
    @Query('search') search?: string,
    @Query('category_id') category_id?: string,
  ): Promise<void> {
    this.logger.debug(
      { function: 'findAllLocationsWithProducts', version, search, category_id, query },
      Config_LocationProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_locationProductService.findAllLocationsWithProducts(
      user_id,
      bu_code,
      paginate,
      version,
      search,
      category_id,
    );
    this.respond(res, result);
  }

  /**
   * ค้นหารายการ product_location ตาม location_id
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param locationId - Location ID / รหัสสถานที่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns รายการ product_location ที่ผูกกับสถานที่ พร้อม product_code, product_name, product_local_name, product_sku, location_code, location_name
   */
  @Get(':locationId')
  @UseGuards(new AppIdGuard('locationProduct.getProductByLocationId'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get product-location mappings by location ID',
    description: 'Retrieves paginated product-location records for a specific location, including product_code, product_name, product_local_name, product_sku, inventory_unit_id, inventory_unit_name.',
    operationId: 'configLocationProduct_findByLocationId',
    'x-description-th': 'ดึงข้อมูลสถานที่ตามสินค้าโดยใช้รหัสสถานที่',
  } as any)
  async getProductByLocationId(
    @Req() req: Request,
    @Res() res: Response,
    @Param('locationId') locationId: string,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getProductByLocationId',
        locationId,
        version,
        query,
      },
      Config_LocationProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_locationProductService.getProductByLocationId(
      locationId,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * เปรียบเทียบ 2 สถานที่ แสดงสินค้าที่อยู่ในทั้ง 2 สถานที่
   */
  @Get('products/:location_1/:location_2')
  @UseGuards(new AppIdGuard('locationProduct.compare'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Compare products between two locations',
    description: 'Returns paginated products that exist in both locations (intersection).',
    operationId: 'configLocationProduct_compareProducts',
    'x-description-th': 'เปรียบเทียบสินค้าระหว่าง 2 สถานที่ แสดงเฉพาะสินค้าที่อยู่ในทั้ง 2 สถานที่',
  } as any)
  @ApiParam({ name: 'location_1', description: 'First location UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiParam({ name: 'location_2', description: 'Second location UUID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  async compareLocations(
    @Req() req: Request,
    @Res() res: Response,
    @Param('location_1') location_1: string,
    @Param('location_2') location_2: string,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'compareLocations', location_1, location_2, version, query },
      Config_LocationProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_locationProductService.compareLocations(
      location_1,
      location_2,
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Refresh denormalized fields ใน tb_product_location
   * อัปเดต location_code, location_name, product_name, product_code, product_local_name, product_sku
   * โดยดึงค่าจริงจาก tb_product และ tb_location ผ่าน product_id และ location_id
   */
  @Post('refresh')
  @UseGuards(new AppIdGuard('locationProduct.refresh'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh product-location denormalized fields',
    description: 'Regenerates location_code, location_name, product_name, product_code, product_local_name, product_sku in tb_product_location by looking up actual values from tb_product and tb_location using product_id and location_id.',
    operationId: 'configLocationProduct_refresh',
    'x-description-th': 'รีเฟรชข้อมูล denormalized ของสถานที่ตามสินค้า',
  } as any)
  async refreshProductLocations(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
  ): Promise<void> {
    this.logger.debug(
      { function: 'refreshProductLocations' },
      Config_LocationProductController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_locationProductService.refreshProductLocations(
      user_id,
      bu_code,
    );
    this.respond(res, result);
  }
}
