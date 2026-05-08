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
import { CreditTermService } from './credit-term.service';
import {
  BaseHttpController,
  Serialize,
  EnrichAuditUsers,
  CreditTermDetailResponseSchema,
  CreditTermListItemResponseSchema,
} from '@/common';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/credit-term')
@ApiTags('Config: Vendors')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class CreditTermController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditTermController.name,
  );
  constructor(private readonly creditTermService: CreditTermService) {
    super();
  }

  /**
   * List all credit terms with pagination
   * ค้นหาเงื่อนไขการชำระเงินทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated credit term list / รายการเงื่อนไขการชำระเงินแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('creditTerm.findAll'))
  @Serialize(CreditTermListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiOperation({
    summary: 'Get all credit terms',
    description: 'Lists all available vendor payment terms (e.g., Net 30, Net 60, COD), used when setting up vendor agreements and calculating payment due dates on purchase orders.',
    operationId: 'findAllCreditTerms',
    'x-description-th': 'แสดงรายการเงื่อนไขการชำระเงินทั้งหมดที่ใช้งานได้ (เช่น Net 30, Net 60, COD) ใช้เมื่อตั้งค่าสัญญาผู้ขายและคำนวณวันครบกำหนดชำระเงินในใบสั่งซื้อ',
  } as any)
  @ApiUserFilterQueries()
  @ApiVersionMinRequest()
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
      CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditTermService.findAll(user_id, bu_code, query, version);
    this.respond(res, result);
  }

  /**
   * Get a credit term by ID
   * ค้นหาเงื่อนไขการชำระเงินเดียวตาม ID
   * @param id - Credit term ID / รหัสเงื่อนไขการชำระเงิน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Credit term details / รายละเอียดเงื่อนไขการชำระเงิน
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('creditTerm.findOne'))
  @Serialize(CreditTermDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiOperation({
    summary: 'Get a credit term by id',
    description: 'Retrieves the details of a specific payment term including its code, name, and number of days, used when reviewing or assigning vendor payment conditions.',
    operationId: 'findOneCreditTerm',
    'x-description-th': 'ดึงรายละเอียดของเงื่อนไขการชำระเงินเฉพาะ รวมถึงรหัส ชื่อ และจำนวนวัน ใช้เมื่อตรวจสอบหรือกำหนดเงื่อนไขการชำระเงินให้ผู้ขาย',
  } as any)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      CreditTermController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditTermService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
