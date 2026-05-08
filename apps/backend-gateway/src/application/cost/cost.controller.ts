import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CostService } from './cost.service';
import { BaseHttpController } from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import {
  ProductCostEstimateResponseDto,
  LastReceivingResponseDto,
} from './swagger/response';

@Controller('api')
@ApiTags('Inventory: Cost')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class CostController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(CostController.name);

  constructor(private readonly costService: CostService) {
    super();
  }

  /**
   * Estimate FIFO deduction cost for a product at a location
   * ประมาณต้นทุนการตัดสต็อก FIFO พร้อมรายละเอียดต่อ lot
   */
  @Get(':bu_code/cost/product/:product_id/location/:location_id/qty/:qty')
  @UseGuards(new AppIdGuard('product.cost-estimate'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Estimate FIFO deduction cost for a product at a location',
    description:
      'Returns FIFO cost breakdown for deducting the given qty of a product from a specific location. Each entry in lots describes how much was pulled from which lot and at what cost.',
    operationId: 'getProductCostEstimate',
    'x-description-th': 'ประมาณต้นทุนการตัดสต็อกแบบ FIFO พร้อมรายละเอียดต่อ lot',
  } as any)
  @ApiResponse({ status: 200, description: 'Cost estimate retrieved successfully', type: ProductCostEstimateResponseDto })
  @ApiResponse({ status: 404, description: 'Product or location not found' })
  async getProductCostEstimate(
    @Param('bu_code') bu_code: string,
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Param('location_id', new ParseUUIDPipe({ version: '4' })) location_id: string,
    @Param('qty') qty: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const quantity = Number(qty);
    this.logger.debug(
      { function: 'getProductCostEstimate', product_id, location_id, quantity, version },
      CostController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.costService.getProductCostEstimate(
      product_id,
      location_id,
      quantity,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get latest receiving transaction for a product
   * ค้นหาธุรกรรมรับเข้าล่าสุดเพื่อตรวจสอบต้นทุนล่าสุด
   */
  @Get(':bu_code/cost/product/:product_id/last-receiving')
  @UseGuards(new AppIdGuard('product.last-receiving'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get last receiving transaction for a product',
    description:
      'Returns the most recent inbound inventory transaction (good_received_note or stock_in) for a product so the caller can check last received cost.',
    operationId: 'getLastReceiving',
    'x-description-th': 'ดึงธุรกรรมรับเข้าล่าสุดของสินค้าเพื่อตรวจสอบต้นทุนล่าสุด',
  } as any)
  @ApiResponse({ status: 200, description: 'Last receiving transaction retrieved successfully', type: LastReceivingResponseDto })
  @ApiResponse({ status: 404, description: 'No receiving transaction found for this product' })
  async getLastReceiving(
    @Param('bu_code') bu_code: string,
    @Param('product_id', new ParseUUIDPipe({ version: '4' })) product_id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'getLastReceiving', product_id, version },
      CostController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.costService.getLastReceiving(product_id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
