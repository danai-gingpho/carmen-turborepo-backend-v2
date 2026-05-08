import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  Param,
  Req,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_ProductLocationService } from './config_product-location.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from 'src/common/http/base-http-controller';

@Controller('api/config/:bu_code/product/location')
@ApiTags('Config: Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_ProductLocationController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ProductLocationController.name,
  );

  constructor(
    private readonly config_productLocationService: Config_ProductLocationService,
  ) {
    super();
  }

  /**
   * ค้นหารายการ product_location ตาม product_id
   * @param productId - Product ID / รหัสสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns รายการ product_location ที่ผูกกับสินค้า พร้อม location_code, location_name, product_code, product_name, product_local_name, product_sku
   */
  @Get(':productId')
  @UseGuards(new AppIdGuard('productLocation.getLocationsByProductId'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get product-location mappings by product ID',
    description: 'Retrieves all product-location records for a specific product, including location_code, location_name, product_code, product_name, product_local_name, product_sku, and quantity settings (min/max/reorder/par).',
    operationId: 'configProductLocation_findByProductId',
    'x-description-th': 'ดึงข้อมูลสินค้าตามสถานที่โดยใช้รหัสสินค้า',
  } as any)
  async getLocationsByProductId(
    @Param('productId') productId: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getLocationsByProductId',
        productId,
        version,
      },
      Config_ProductLocationController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_productLocationService.getLocationsByProductId(
      productId,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
