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
import { TaxProfileService } from './tax-profile.service';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import {
  IPaginateQuery,
  PaginateQuery,
} from 'src/shared-dto/paginate.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiOperation } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  TaxProfileDetailResponseSchema,
  TaxProfileListItemResponseSchema,
} from '@/common';

@Controller('api/:bu_code/tax-profile')
@ApiTags('Config: Tax & Cost Types')
@ApiHeaderRequiredXAppId()
@ApiBearerAuth()
@UseGuards(KeycloakGuard)
export class TaxProfileController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    TaxProfileController.name,
  );

  constructor(
    private readonly taxProfileService: TaxProfileService,
  ) {
    super();
  }

  /**
   * Find a tax profile by ID
   * ค้นหาโปรไฟล์ภาษีรายการเดียวตาม ID
   * @param id - Tax profile ID / รหัสโปรไฟล์ภาษี
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Tax profile details / รายละเอียดโปรไฟล์ภาษี
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('taxProfile.findOne'))
  @Serialize(TaxProfileDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a tax profile by ID',
    description: 'Retrieves a specific tax configuration profile including VAT rates, withholding tax rules, and tax calculation parameters applied to procurement transactions and vendor invoices.',
    operationId: 'findOneTaxProfile',
    responses: {
      200: { description: 'Tax profile retrieved successfully' },
      404: { description: 'Tax profile not found' },
    },
    'x-description-th': 'ดึงข้อมูลโปรไฟล์ภาษีรายการเดียวตาม ID',
  } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
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
      TaxProfileController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.taxProfileService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all tax profiles in the business unit
   * ค้นหารายการโปรไฟล์ภาษีทั้งหมดในหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of tax profiles / รายการโปรไฟล์ภาษีแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('taxProfile.findAll'))
  @Serialize(TaxProfileListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all tax profiles',
    description: 'Lists all tax configuration profiles available in the business unit, including VAT rates and withholding tax settings used for calculating taxes on purchase orders and vendor payments.',
    operationId: 'findAllTaxProfiles',
    responses: {
      200: { description: 'Tax profiles retrieved successfully' },
    },
    'x-description-th': 'แสดงรายการโปรไฟล์ภาษีทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
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
      TaxProfileController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.taxProfileService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }
}
