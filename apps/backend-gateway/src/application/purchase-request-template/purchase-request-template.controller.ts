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
import { PurchaseRequestTemplateService } from './purchase-request-template.service';
import { CreatePurchaseRequestTemplateDto } from './dto/purchase-requesr-template.dto';
import { UpdatePurchaseRequestTemplateDto } from './dto/update-purchase-request-template.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';

import {
  BaseHttpController,
  EnrichAuditUsers,
} from '@/common';

@Controller('api/:bu_code/purchase-request-template')
@ApiTags('Procurement: Purchase Requests')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PurchaseRequestTemplateController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestTemplateController.name,
  );

  constructor(
    private readonly purchaseRequestTemplateService: PurchaseRequestTemplateService,
  ) {
    super();
  }

  /**
   * List all purchase request templates in the business unit
   * ค้นหารายการทั้งหมดของเทมเพลตใบขอซื้อในหน่วยธุรกิจ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of templates / รายการเทมเพลตแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all purchase request templates',
    description: 'Lists all reusable purchase request templates available in the business unit, such as recurring weekly kitchen supply orders or standard housekeeping stock replenishments, enabling quick creation of routine procurement requests.',
    operationId: 'findAllPurchaseRequestTemplates',
    responses: {
      200: { description: 'Templates retrieved successfully' },
    },
    'x-description-th': 'แสดงรายการเทมเพลตใบขอซื้อที่ใช้ซ้ำได้ทั้งหมดในหน่วยธุรกิจ เช่น การสั่งซื้อวัตถุดิบครัวประจำสัปดาห์หรือการเติมสต็อกแม่บ้าน ช่วยให้สร้างคำขอจัดซื้อประจำได้รวดเร็ว',
  } as any)
  async getPurchaseRequestTemplate(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getPurchaseRequestTemplate',
        query,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    const result = await this.purchaseRequestTemplateService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieve a purchase request template by ID
   * ค้นหารายการเดียวตาม ID ของเทมเพลตใบขอซื้อ
   * @param id - Template ID / รหัสเทมเพลต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Template details / รายละเอียดเทมเพลต
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a purchase request template by ID',
    description: 'Retrieves a specific purchase request template with its predefined item list and quantities, allowing users to review or use the template for creating a new procurement request.',
    operationId: 'findOnePurchaseRequestTemplate',
    responses: {
      200: { description: 'Template retrieved successfully' },
      404: { description: 'Template not found' },
    },
    'x-description-th': 'ดึงเทมเพลตใบขอซื้อเฉพาะพร้อมรายการสินค้าและจำนวนที่กำหนดไว้ล่วงหน้า ช่วยให้ผู้ใช้ตรวจสอบหรือใช้เทมเพลตสำหรับสร้างคำขอจัดซื้อใหม่',
  } as any)
  async getPurchaseRequestTemplateById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getPurchaseRequestTemplateById',
        id,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    const result = await this.purchaseRequestTemplateService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new purchase request template
   * สร้างเทมเพลตใบขอซื้อใหม่
   * @param createPurchaseRequestTemplateDto - Template creation data / ข้อมูลสำหรับสร้างเทมเพลต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created template / เทมเพลตที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new purchase request template',
    description: 'Creates a new reusable purchase request template with a predefined set of items and quantities, streamlining repetitive procurement tasks such as weekly kitchen supply orders or periodic maintenance material requests.',
    operationId: 'createPurchaseRequestTemplate',
    responses: {
      201: { description: 'Template created successfully' },
      400: { description: 'Bad request' },
    },
    'x-description-th': 'สร้างเทมเพลตใบขอซื้อใหม่ที่ใช้ซ้ำได้พร้อมรายการสินค้าและจำนวนที่กำหนดไว้ล่วงหน้า ช่วยลดขั้นตอนการจัดซื้อซ้ำ เช่น การสั่งซื้อวัตถุดิบครัวประจำสัปดาห์',
  } as any)
  @ApiBody({ type: CreatePurchaseRequestTemplateDto })
  async createPurchaseRequestTemplate(
    @Body() createPurchaseRequestTemplateDto: CreatePurchaseRequestTemplateDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'createPurchaseRequestTemplate',
        createPurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestTemplateService.create(
      createPurchaseRequestTemplateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing purchase request template
   * อัปเดตเทมเพลตใบขอซื้อที่มีอยู่
   * @param id - Template ID / รหัสเทมเพลต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updatePurchaseRequestTemplateDto - Updated template data / ข้อมูลเทมเพลตที่อัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated template / เทมเพลตที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.update'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a purchase request template',
    description: 'Modifies an existing purchase request template to adjust the predefined item list, quantities, or template name, keeping reusable procurement templates aligned with current ordering needs.',
    operationId: 'updatePurchaseRequestTemplate',
    responses: {
      200: { description: 'Template updated successfully' },
      404: { description: 'Template not found' },
    },
    'x-description-th': 'แก้ไขเทมเพลตใบขอซื้อที่มีอยู่เพื่อปรับรายการสินค้า จำนวน หรือชื่อเทมเพลต ช่วยให้เทมเพลตการจัดซื้อที่ใช้ซ้ำสอดคล้องกับความต้องการสั่งซื้อปัจจุบัน',
  } as any)
  @ApiBody({ type: UpdatePurchaseRequestTemplateDto })
  async updatePurchaseRequestTemplate(
    @Param('bu_code') bu_code: string,
    @Body() updatePurchaseRequestTemplateDto: UpdatePurchaseRequestTemplateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updatePurchaseRequestTemplate',
        updatePurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestTemplateService.update(
      id,
      updatePurchaseRequestTemplateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a purchase request template
   * ลบเทมเพลตใบขอซื้อ
   * @param id - Template ID / รหัสเทมเพลต
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('purchaseRequestTemplate.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a purchase request template',
    description: 'Removes a reusable purchase request template that is no longer needed, preventing staff from using outdated or discontinued item sets for new procurement requests.',
    operationId: 'deletePurchaseRequestTemplate',
    responses: {
      200: { description: 'Template deleted successfully' },
      404: { description: 'Template not found' },
    },
    'x-description-th': 'ลบเทมเพลตใบขอซื้อที่ไม่จำเป็นอีกต่อไป ป้องกันไม่ให้พนักงานใช้ชุดสินค้าที่ล้าสมัยหรือยกเลิกแล้วสำหรับคำขอจัดซื้อใหม่',
  } as any)
  async deletePurchaseRequestTemplate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deletePurchaseRequestTemplate',
        id,
        version,
      },
      PurchaseRequestTemplateController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.purchaseRequestTemplateService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
