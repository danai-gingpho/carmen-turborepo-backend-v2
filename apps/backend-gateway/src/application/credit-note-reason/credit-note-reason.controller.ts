import {
  Controller,
  HttpStatus,
  Get,
  HttpCode,
  Query,
  Req,
  Res,
  Body,
  UseGuards,
  Param,
  Post,
} from '@nestjs/common';
import { Response } from 'express';
import { CreditNoteReasonService } from './credit-note-reason.service';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
  Serialize,
} from '@/common';
import {
  CreditNoteReasonCreateDto,
  CreditNoteReasonMutationResponseSchema,
} from 'src/common/dto/credit-note-reason';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreditNoteReasonCreateRequestDto } from './swagger/request';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/credit-note-reason')
@ApiTags('Procurement: Credit Notes')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class CreditNoteReasonController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteReasonController.name,
  );

  constructor(
    private readonly creditNoteReasonService: CreditNoteReasonService,
  ) {
    super();
  }

  /**
   * List all credit note reasons with pagination
   * ค้นหาเหตุผลใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated credit note reason list / รายการเหตุผลใบลดหนี้แบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('creditNoteReason.findAll'))
  @ApiOperation({ summary: 'Get all credit note reasons' })
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all credit note reasons',
    description: 'Lists all configurable reasons for issuing vendor credit notes (e.g., damaged goods, short delivery, quality issues), used to populate reason dropdowns when creating credit notes.',
    operationId: 'findAllCreditNoteReasons',
    'x-description-th': 'แสดงรายการเหตุผลทั้งหมดสำหรับการออกใบลดหนี้ให้ผู้ขาย (เช่น สินค้าเสียหาย ส่งไม่ครบ ปัญหาด้านคุณภาพ) ใช้สำหรับแสดงตัวเลือกเหตุผลในดรอปดาวน์เมื่อสร้างใบลดหนี้',
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      CreditNoteReasonController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.creditNoteReasonService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  @Post()
  @UseGuards(new AppIdGuard('creditNoteReason.create'))
  @ApiOperation({
    summary: 'Create a credit note reason',
    description: 'Creates a new reason that can be selected when issuing vendor credit notes, such as damaged goods, short delivery, or quality issues.',
    operationId: 'createCreditNoteReason',
    responses: {
      201: { description: 'Credit note reason created successfully' },
      400: { description: 'Invalid request body' },
    },
    'x-description-th': 'สร้างเหตุผลใหม่สำหรับเลือกเมื่อออกใบลดหนี้ให้ผู้ขาย เช่น สินค้าเสียหาย ส่งไม่ครบ หรือปัญหาด้านคุณภาพ',
  } as any)
  @ApiBody({ type: CreditNoteReasonCreateRequestDto })
  @Serialize(CreditNoteReasonMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: CreditNoteReasonCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      CreditNoteReasonController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteReasonService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }
}
