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
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_DeliveryPointService } from './config_delivery-point.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  DeliveryPointCreateDto,
  DeliveryPointUpdateDto,
  IUpdateDeliveryPoint,
  Serialize,
  EnrichAuditUsers,
  DeliveryPointResponseSchema,
  DeliveryPointDetailResponseSchema,
  DeliveryPointListItemResponseSchema,
} from '@/common';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { DeliveryPointCreateRequest, DeliveryPointUpdateRequest } from './swagger/request';

@Controller('api/config/:bu_code/delivery-point')
@ApiTags('Config: Locations')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_DeliveryPointController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_DeliveryPointController.name,
  );

  constructor(
    private readonly deliveryPointService: Config_DeliveryPointService,
  ) {
    super();
  }

  /**
   * Retrieves a specific delivery point where vendors deliver goods
   * ค้นหาจุดรับสินค้าเดียวตาม ID ที่ผู้ขายส่งสินค้ามายังสถานที่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Delivery point ID / รหัสจุดรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('delivery-point.findOne'))
  @Serialize(DeliveryPointDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a delivery point by ID',
    description: 'Retrieves a specific delivery point where vendors deliver goods to the property. Delivery points are used in purchase orders to specify the exact receiving location for vendor shipments.',
    operationId: 'configDeliveryPoint_findOne',
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
        description: 'The unique identifier of the delivery point',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Delivery point retrieved successfully',
      },
      404: {
        description: 'Delivery point not found',
      },
    },
    'x-description-th': 'ดึงข้อมูลจุดส่งมอบสินค้ารายการเดียวตาม ID',
  } as any)
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
      Config_DeliveryPointController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.deliveryPointService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Lists all delivery points at the property for vendor shipments
   * ค้นหาจุดรับสินค้าทั้งหมดที่สถานที่ (เช่น ท่าเทียบ ทางเข้าหลังอาคาร ประตูครัว)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('delivery-point.findAll'))
  @Serialize(DeliveryPointListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all delivery points',
    description: 'Returns all delivery points configured for the property. These represent physical locations (e.g., loading dock, back entrance, kitchen door) where vendors can deliver goods.',
    operationId: 'configDeliveryPoint_findAll',
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
        description: 'Delivery points retrieved successfully',
      },
      404: {
        description: 'Delivery points not found',
      },
    },
    'x-description-th': 'แสดงรายการจุดส่งมอบสินค้าทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  @ApiUserFilterQueries()
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
      Config_DeliveryPointController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.deliveryPointService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Defines a new delivery location at the property for vendor shipments
   * สร้างจุดรับสินค้าใหม่ที่สถานที่สำหรับการจัดส่งจากผู้ขาย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('delivery-point.create'))
  @Serialize(DeliveryPointResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new delivery point',
    description: 'Defines a new delivery location at the property where vendors can deliver goods. Once created, it can be specified in purchase orders to direct vendor shipments.',
    operationId: 'configDeliveryPoint_create',
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
        description: 'Delivery point created successfully',
      },
    },
    'x-description-th': 'สร้างจุดส่งมอบสินค้าใหม่',
  } as any)
  @ApiBody({ type: DeliveryPointCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: DeliveryPointCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_DeliveryPointController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.deliveryPointService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Fully updates an existing delivery point configuration
   * อัปเดตการกำหนดค่าจุดรับสินค้าที่มีอยู่ทั้งหมด เช่น ชื่อ ที่อยู่ หรือเวลาทำการ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Delivery point ID / รหัสจุดรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('delivery-point.update'))
  @Serialize(DeliveryPointResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a delivery point',
    description: 'Modifies an existing delivery point configuration, such as updating its name, address, or operating hours. Changes affect how future purchase orders reference this delivery location.',
    operationId: 'configDeliveryPoint_update',
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
        description: 'The unique identifier of the delivery point',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Delivery point updated successfully',
      },
      404: {
        description: 'Delivery point not found',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลจุดส่งมอบสินค้าที่มีอยู่',
  } as any)
  @ApiBody({ type: DeliveryPointUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: DeliveryPointUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_DeliveryPointController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateDeliveryPoint = {
      ...updateDto,
      id,
    };
    const result = await this.deliveryPointService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Partially updates specific fields of a delivery point
   * อัปเดตบางฟิลด์ของจุดรับสินค้า เช่น เปิด/ปิดสถานะการใช้งาน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Delivery point ID / รหัสจุดรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Partial update data / ข้อมูลสำหรับอัปเดตบางส่วน
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('delivery-point.patch'))
  @Serialize(DeliveryPointResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Partially update a delivery point',
    description: 'Partially updates specific fields of a delivery point without replacing the entire record. Useful for toggling active status or making minor adjustments.',
    operationId: 'configDeliveryPoint_patch',
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
        description: 'The unique identifier of the delivery point',
        schema: {
          type: 'string',
          format: 'uuid',
        },
      },
    ],
    responses: {
      200: {
        description: 'Delivery point updated successfully',
      },
      404: {
        description: 'Delivery point not found',
      },
    },
    'x-description-th': 'อัปเดตบางฟิลด์ของจุดส่งมอบสินค้า',
  } as any)
  @ApiBody({ type: DeliveryPointUpdateRequest })
  async patch(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: DeliveryPointUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'patch',
        id,
        updateDto,
        version,
      },
      Config_DeliveryPointController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateDeliveryPoint = {
      ...updateDto,
      id,
    };
    const result = await this.deliveryPointService.patch(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Removes a delivery point from active use
   * ลบจุดรับสินค้าออกจากการใช้งาน บันทึกการจัดซื้อในอดีตยังคงอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Delivery point ID / รหัสจุดรับสินค้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('delivery-point.delete'))
  @Serialize(DeliveryPointResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a delivery point',
    description: 'Removes a delivery point from active use. It will no longer be selectable in new purchase orders, but historical procurement records referencing this delivery point are preserved.',
    operationId: 'configDeliveryPoint_delete',
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
        description: 'Delivery point deleted successfully',
      },
    },
    'x-description-th': 'ลบจุดส่งมอบสินค้าตาม ID',
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
      Config_DeliveryPointController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.deliveryPointService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
