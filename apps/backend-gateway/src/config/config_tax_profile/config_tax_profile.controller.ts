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
import { Config_TaxProfileService } from './config_tax_profile.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { TaxProfileCreateRequest, TaxProfileUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  TaxProfileCreateDto,
  TaxProfileUpdateDto,
  IUpdateTaxProfile,
  Serialize,
  EnrichAuditUsers,
  TaxProfileDetailResponseSchema,
  TaxProfileListItemResponseSchema,
  TaxProfileMutationResponseSchema,
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

@ApiTags('Config: Tax & Cost Types')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/tax-profile')
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_TaxProfileController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_TaxProfileController.name,
  );
  constructor(
    private readonly configTaxProfileService: Config_TaxProfileService,
  ) {
    super();
  }

  /**
   * Get a tax profile by ID
   * ค้นหาโปรไฟล์ภาษีเดียวตาม ID
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Tax profile ID / รหัสโปรไฟล์ภาษี
   * @param version - API version / เวอร์ชัน API
   * @returns Tax profile detail / รายละเอียดโปรไฟล์ภาษี
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('taxProfile.findOne'))
  @Serialize(TaxProfileDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a tax profile by ID', description: 'Retrieves a specific tax rate configuration (e.g., VAT 7%, withholding tax 3%) used to calculate taxes on procurement documents and vendor invoices.', operationId: 'configTaxProfile_findOne', 'x-description-th': 'ดึงข้อมูลโปรไฟล์ภาษีรายการเดียวตาม ID' } as any)
  async findOne(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configTaxProfileService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all tax profiles with pagination
   * ค้นหารายการโปรไฟล์ภาษีทั้งหมดพร้อมการแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of tax profiles / รายการโปรไฟล์ภาษีพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('taxProfile.findAll'))
  @Serialize(TaxProfileListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all tax profiles', description: 'Returns all tax rate configurations for the business unit. Tax profiles are applied to procurement documents to automatically calculate VAT, withholding tax, and other applicable taxes.', operationId: 'configTaxProfile_findAll', 'x-description-th': 'แสดงรายการโปรไฟล์ภาษีทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configTaxProfileService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new tax profile
   * สร้างโปรไฟล์ภาษีใหม่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param createDto - Tax profile creation data / ข้อมูลสำหรับสร้างโปรไฟล์ภาษี
   * @param version - API version / เวอร์ชัน API
   * @returns Created tax profile / โปรไฟล์ภาษีที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('taxProfile.create'))
  @Serialize(TaxProfileMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Create a new tax profile', description: 'Defines a new tax rate configuration with its percentage and calculation rules. Once created, the tax profile can be applied to purchase orders and vendor invoices for automated tax computation.', operationId: 'configTaxProfile_create', 'x-description-th': 'สร้างโปรไฟล์ภาษีใหม่' } as any)
  @ApiBody({ type: TaxProfileCreateRequest })
  async create(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: TaxProfileCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configTaxProfileService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a tax profile
   * อัปเดตโปรไฟล์ภาษี
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Tax profile ID / รหัสโปรไฟล์ภาษี
   * @param updateDto - Tax profile update data / ข้อมูลสำหรับอัปเดตโปรไฟล์ภาษี
   * @param version - API version / เวอร์ชัน API
   * @returns Updated tax profile / โปรไฟล์ภาษีที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('taxProfile.update'))
  @Serialize(TaxProfileMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Patch a tax profile', description: 'Partially updates an existing tax rate configuration, such as adjusting the percentage or calculation method. Changes affect tax calculations on future procurement documents.', operationId: 'configTaxProfile_patch', 'x-description-th': 'อัปเดตข้อมูลโปรไฟล์ภาษีที่มีอยู่' } as any)
  @ApiBody({ type: TaxProfileUpdateRequest })
  async update(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDto: TaxProfileUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateTaxProfile = {
      ...updateDto,
      id: id,
    };
    const result = await this.configTaxProfileService.update(
      id,
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a tax profile
   * ลบโปรไฟล์ภาษี
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Tax profile ID / รหัสโปรไฟล์ภาษี
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('taxProfile.delete'))
  @Serialize(TaxProfileMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Delete a tax profile', description: 'Removes a tax rate configuration from active use. It will no longer be selectable for new procurement documents, but historical tax calculations are preserved.', operationId: 'configTaxProfile_delete', 'x-description-th': 'ลบโปรไฟล์ภาษีตาม ID' } as any)
  async delete(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_TaxProfileController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configTaxProfileService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
