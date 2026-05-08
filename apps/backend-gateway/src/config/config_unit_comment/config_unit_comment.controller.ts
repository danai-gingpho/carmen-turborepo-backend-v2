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
import { Config_UnitCommentService as Config_UnitCommentService } from './config_unit_comment.service';
import { BaseHttpController, EnrichAuditUsers } from '@/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnitCommentCreateRequest, UnitCommentUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { UnitCommentCreateDto, UnitCommentUpdateDto } from 'src/common/dto/unit-comment/unit-comment.dto';

@Controller('api/config/:bu_code/unit-comment')
@ApiTags('Config: Units')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_UnitCommentController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_UnitCommentController.name,
  );
  constructor(
    private readonly configUnitCommentService: Config_UnitCommentService,
  ) {
    super();
  }

  /**
   * Get a unit comment by ID
   * ค้นหาความคิดเห็นหน่วยเดียวตาม ID
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Unit comment ID / รหัสความคิดเห็นหน่วย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Unit comment detail / รายละเอียดความคิดเห็นหน่วย
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('unitComment.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Get a unit comment by ID', description: 'Retrieves a specific predefined comment/note template associated with unit operations. These standardized comments streamline data entry for inventory and procurement transactions.', operationId: 'configUnitComment_findOne', 'x-description-th': 'ดึงข้อมูลหมายเหตุหน่วยนับรายการเดียวตาม ID' } as any)
  async findOne(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_UnitCommentController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUnitCommentService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all unit comments with pagination
   * ค้นหารายการความคิดเห็นหน่วยทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of unit comments / รายการความคิดเห็นหน่วยพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('unitComment.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({ summary: 'Get all unit comments', description: 'Returns all predefined comment templates for unit-related operations. These reusable notes help standardize remarks on procurement and inventory documents.', operationId: 'configUnitComment_findAll', 'x-description-th': 'แสดงรายการหมายเหตุหน่วยนับทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_UnitCommentController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configUnitCommentService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new unit comment
   * สร้างความคิดเห็นหน่วยใหม่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Unit comment creation data / ข้อมูลสำหรับสร้างความคิดเห็นหน่วย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Created unit comment / ความคิดเห็นหน่วยที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('unitComment.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Create a new unit comment', description: 'Defines a new predefined comment template for unit-related operations. Users can quickly select these standardized notes when processing inventory or procurement transactions.', operationId: 'configUnitComment_create', 'x-description-th': 'สร้างหมายเหตุหน่วยนับใหม่' } as any)
  @ApiBody({ type: UnitCommentCreateRequest })
  async create(
    @Param('bu_code') bu_code: string,
    @Body() createDto: UnitCommentCreateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_UnitCommentController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUnitCommentService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a unit comment
   * อัปเดตความคิดเห็นหน่วย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Unit comment ID / รหัสความคิดเห็นหน่วย
   * @param updateDto - Unit comment update data / ข้อมูลสำหรับอัปเดตความคิดเห็นหน่วย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated unit comment / ความคิดเห็นหน่วยที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('unitComment.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Update a unit comment', description: 'Modifies an existing predefined comment template. Changes are reflected in the comment options available for future transactions.', operationId: 'configUnitComment_update', 'x-description-th': 'อัปเดตข้อมูลหมายเหตุหน่วยนับที่มีอยู่' } as any)
  @ApiBody({ type: UnitCommentUpdateRequest })
  async update(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDto: UnitCommentUpdateDto,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_UnitCommentController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUnitCommentService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a unit comment
   * ลบความคิดเห็นหน่วย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Unit comment ID / รหัสความคิดเห็นหน่วย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('unitComment.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Delete a unit comment', description: 'Removes a predefined comment template from the available options. Historical transactions that used this comment are not affected.', operationId: 'configUnitComment_delete', 'x-description-th': 'ลบหมายเหตุหน่วยนับตาม ID' } as any)
  async remove(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_UnitCommentController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configUnitCommentService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
