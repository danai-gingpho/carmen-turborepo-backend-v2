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
import { Config_AdjustmentTypeService } from './config_adjustment-type.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  AdjustmentTypeDetailResponseSchema,
  AdjustmentTypeListItemResponseSchema,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  AdjustmentTypeCreateDto,
  AdjustmentTypeUpdateDto,
  IUpdateAdjustmentType,
} from './dto/adjustment-type.dto';
import {
  AdjustmentTypeCreateRequest,
  AdjustmentTypeUpdateRequest,
} from './swagger/request';

@Controller('api/config/:bu_code/adjustment-type')
@ApiTags('Config: Tax & Cost Types')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_AdjustmentTypeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_AdjustmentTypeController.name,
  );

  constructor(
    private readonly config_adjustmentTypeService: Config_AdjustmentTypeService,
  ) {
    super();
  }

  /**
   * Retrieves a specific inventory adjustment type
   * ค้นหาประเภทการปรับสต๊อกเดียวตาม ID (เช่น เสียหาย แตกหัก สูญหาย)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Adjustment type ID / รหัสประเภทการปรับสต๊อก
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('adjustment-type.findOne'))
  @Serialize(AdjustmentTypeDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Get an adjustment type by ID', description: 'Retrieves a specific inventory adjustment type definition (e.g., spoilage, breakage, theft, expiration). Adjustment types categorize the reason for inventory quantity changes outside normal operations.', operationId: 'configAdjustmentType_findOne', 'x-description-th': 'ดึงข้อมูลประเภทการปรับปรุงรายการเดียวตาม ID' } as any)
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
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_adjustmentTypeService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Lists all configured inventory adjustment type categories
   * ค้นหาประเภทการปรับสต๊อกทั้งหมดที่ใช้ในการบันทึกความคลาดเคลื่อนของสต๊อก
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('adjustment-type.findAll'))
  @Serialize(AdjustmentTypeListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all adjustment types', description: 'Returns all configured inventory adjustment type categories. These types are used when recording inventory adjustments to classify the reason for stock discrepancies.', operationId: 'configAdjustmentType_findAll', 'x-description-th': 'แสดงรายการประเภทการปรับปรุงทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
  @ApiUserFilterQueries()
  @ApiQuery({ name: 'type', required: false, enum: ['stock-in', 'stock-out'], description: 'Filter by adjustment type: stock-in or stock-out' })
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('type') type?: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        type,
        version,
      },
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    // Map type query param: stock-in → STOCK_IN, stock-out → STOCK_OUT
    if (type) {
      const typeMap: Record<string, string> = {
        'stock-in': 'STOCK_IN',
        'stock-out': 'STOCK_OUT',
      };
      const mappedType = typeMap[type.toLowerCase()] || type;
      paginate.filter = { ...paginate.filter, type: mappedType };
    }

    const result = await this.config_adjustmentTypeService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Defines a new inventory adjustment category
   * สร้างประเภทการปรับสต๊อกใหม่ (เช่น เสียหาย แตกหัก สูญหาย) สำหรับเจ้าหน้าที่คลังสินค้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('adjustment-type.create'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new adjustment type', description: 'Defines a new inventory adjustment category (e.g., spoilage, breakage, theft). Once created, warehouse staff can select this type when recording inventory discrepancies.', operationId: 'configAdjustmentType_create', 'x-description-th': 'สร้างประเภทการปรับปรุงใหม่' } as any)
  @ApiBody({ type: AdjustmentTypeCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: AdjustmentTypeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_adjustmentTypeService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Modifies an existing inventory adjustment type definition
   * อัปเดตประเภทการปรับสต๊อกที่มีอยู่ เช่น เปลี่ยนชื่อหรือจัดหมวดหมู่ใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Adjustment type ID / รหัสประเภทการปรับสต๊อก
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('adjustment-type.update'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an adjustment type', description: 'Modifies an existing inventory adjustment type definition, such as renaming or updating its classification. Changes apply to all future inventory adjustment records.', operationId: 'configAdjustmentType_update', 'x-description-th': 'อัปเดตข้อมูลประเภทการปรับปรุงที่มีอยู่' } as any)
  @ApiBody({ type: AdjustmentTypeUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: AdjustmentTypeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateAdjustmentType = {
      ...updateDto,
      id,
    };
    const result = await this.config_adjustmentTypeService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Removes an inventory adjustment type from active use
   * ลบประเภทการปรับสต๊อกออกจากการใช้งาน บันทึกในอดีตยังคงอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Adjustment type ID / รหัสประเภทการปรับสต๊อก
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('adjustment-type.delete'))
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an adjustment type', description: 'Removes an inventory adjustment type from active use. Historical adjustment records using this type are preserved, but it will no longer appear as an option for new adjustments.', operationId: 'configAdjustmentType_delete', 'x-description-th': 'ลบประเภทการปรับปรุงตาม ID' } as any)
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
      Config_AdjustmentTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_adjustmentTypeService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
