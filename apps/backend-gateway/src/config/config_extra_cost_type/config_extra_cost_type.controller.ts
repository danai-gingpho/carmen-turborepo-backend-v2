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
import { Config_ExtraCostTypeService } from './config_extra_cost_type.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  ExtraCostTypeCreateDto,
  ExtraCostTypeUpdateDto,
  IUpdateExtraCostType,
  Serialize,
  EnrichAuditUsers,
  ExtraCostTypeDetailResponseSchema,
  ExtraCostTypeListItemResponseSchema,
  ExtraCostTypeMutationResponseSchema,
} from '@/common';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ExtraCostTypeCreateRequest, ExtraCostTypeUpdateRequest } from './swagger/request';

@ApiTags('Config: Tax & Cost Types')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/extra-cost-type')
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_ExtraCostTypeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_ExtraCostTypeController.name,
  );

  constructor(
    private readonly configExtraCostTypeService: Config_ExtraCostTypeService,
  ) {
    super();
  }

  /**
   * Retrieves a specific extra cost type definition (e.g., shipping, insurance, customs duty)
   * ค้นหาประเภทค่าใช้จ่ายเพิ่มเติมเดียวตาม ID (เช่น ค่าจัดส่ง ประกันภัย ภาษีศุลกากร)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติม
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('extraCostType.findOne'))
  @Serialize(ExtraCostTypeDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Get an extra cost type by ID', description: 'Retrieves a specific extra cost type definition (e.g., shipping, insurance, customs duty) used to categorize additional charges on procurement documents beyond product prices.', operationId: 'configExtraCostType_findOne', 'x-description-th': 'ดึงข้อมูลประเภทค่าใช้จ่ายเพิ่มเติมรายการเดียวตาม ID' } as any)
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
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configExtraCostTypeService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Lists all configured extra cost categories for procurement
   * ค้นหาประเภทค่าใช้จ่ายเพิ่มเติมทั้งหมดสำหรับการจัดซื้อ เช่น ค่าขนส่ง ค่าจัดการ ค่าประกันภัย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('extraCostType.findAll'))
  @Serialize(ExtraCostTypeListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all extra cost types', description: 'Returns all configured extra cost categories for procurement. These types are used when adding supplementary charges (e.g., freight, handling, insurance) to purchase orders and goods received notes.', operationId: 'configExtraCostType_findAll', 'x-description-th': 'แสดงรายการประเภทค่าใช้จ่ายเพิ่มเติมทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
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
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configExtraCostTypeService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Defines a new category for additional procurement costs
   * สร้างประเภทค่าใช้จ่ายเพิ่มเติมใหม่สำหรับการจัดซื้อ (เช่น ค่าจัดส่ง ค่าศุลกากร ค่าจัดการ)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('extraCostType.create'))
  @Serialize(ExtraCostTypeMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Create a new extra cost type', description: 'Defines a new category for additional procurement costs (e.g., shipping, customs, handling fees). Once created, it can be used to add supplementary charges to purchase orders.', operationId: 'configExtraCostType_create', 'x-description-th': 'สร้างประเภทค่าใช้จ่ายเพิ่มเติมใหม่' } as any)
  @ApiBody({ type: ExtraCostTypeCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: ExtraCostTypeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configExtraCostTypeService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Modifies an existing extra cost type definition
   * อัปเดตประเภทค่าใช้จ่ายเพิ่มเติมที่มีอยู่ เช่น เปลี่ยนชื่อหรือจัดหมวดหมู่ใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติม
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('extraCostType.update'))
  @Serialize(ExtraCostTypeMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Update an extra cost type', description: 'Modifies an existing extra cost type definition, such as renaming or reclassifying the cost category. Changes apply to future procurement documents.', operationId: 'configExtraCostType_update', 'x-description-th': 'อัปเดตข้อมูลประเภทค่าใช้จ่ายเพิ่มเติมที่มีอยู่' } as any)
  @ApiBody({ type: ExtraCostTypeUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: ExtraCostTypeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateExtraCostType = {
      ...updateDto,
      id,
    };
    const result = await this.configExtraCostTypeService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Removes an extra cost type from active use
   * ลบประเภทค่าใช้จ่ายเพิ่มเติมออกจากการใช้งาน บันทึกในอดีตยังคงอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Extra cost type ID / รหัสประเภทค่าใช้จ่ายเพิ่มเติม
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('extraCostType.delete'))
  @Serialize(ExtraCostTypeMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Delete an extra cost type', description: 'Removes an extra cost type from active use. It will no longer appear as an option for adding charges to procurement documents, but historical records are preserved.', operationId: 'configExtraCostType_delete', 'x-description-th': 'ลบประเภทค่าใช้จ่ายเพิ่มเติมตาม ID' } as any)
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
      Config_ExtraCostTypeController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configExtraCostTypeService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
