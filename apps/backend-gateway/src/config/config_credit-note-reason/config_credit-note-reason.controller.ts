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
import { Config_CreditNoteReasonService } from './config_credit-note-reason.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  CreditNoteReasonCreateDto,
  CreditNoteReasonUpdateDto,
  IUpdateCreditNoteReason,
  EnrichAuditUsers,
  Serialize,
  CreditNoteReasonDetailResponseSchema,
  CreditNoteReasonListItemResponseSchema,
  CreditNoteReasonMutationResponseSchema,
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
import {
  CreditNoteReasonCreateRequestDto,
  CreditNoteReasonUpdateRequestDto,
} from './swagger/request';

@Controller('api/config/:bu_code/credit-note-reason')
@ApiTags('Config: Vendors')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_CreditNoteReasonController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_CreditNoteReasonController.name,
  );

  constructor(
    private readonly creditNoteReasonService: Config_CreditNoteReasonService,
  ) {
    super();
  }

  @Get(':id')
  @UseGuards(new AppIdGuard('creditNoteReason.findOne'))
  @Serialize(CreditNoteReasonDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a credit note reason by ID',
    description:
      'Retrieves a specific credit note reason configuration by its unique identifier.',
    operationId: 'configCreditNoteReason_findOne',
    'x-description-th': 'ดึงข้อมูลเหตุผลใบลดหนี้รายการเดียวตาม ID',
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteReasonService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Get()
  @UseGuards(new AppIdGuard('creditNoteReason.findAll'))
  @Serialize(CreditNoteReasonListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all credit note reasons',
    description:
      'Lists all configurable reasons for issuing vendor credit notes (e.g., damaged goods, short delivery, quality issues).',
    operationId: 'configCreditNoteReason_findAll',
    'x-description-th': 'แสดงรายการเหตุผลใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  @ApiUserFilterQueries()
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
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
  @Serialize(CreditNoteReasonMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a credit note reason',
    description:
      'Creates a new reason that can be selected when issuing vendor credit notes.',
    operationId: 'configCreditNoteReason_create',
    'x-description-th': 'สร้างเหตุผลใบลดหนี้ใหม่',
  } as any)
  @ApiBody({ type: CreditNoteReasonCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: CreditNoteReasonCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteReasonService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  @Put(':id')
  @UseGuards(new AppIdGuard('creditNoteReason.update'))
  @Serialize(CreditNoteReasonMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a credit note reason (full replacement)',
    description:
      'Fully replaces a credit note reason configuration.',
    operationId: 'configCreditNoteReason_update',
    'x-description-th': 'อัปเดตข้อมูลเหตุผลใบลดหนี้ที่มีอยู่',
  } as any)
  @ApiBody({ type: CreditNoteReasonUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CreditNoteReasonUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCreditNoteReason = {
      ...updateDto,
      id,
    };
    const result = await this.creditNoteReasonService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Patch(':id')
  @UseGuards(new AppIdGuard('creditNoteReason.patch'))
  @Serialize(CreditNoteReasonMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Partially update a credit note reason',
    description:
      'Partially updates specific fields of a credit note reason configuration.',
    operationId: 'configCreditNoteReason_patch',
    'x-description-th': 'อัปเดตข้อมูลเหตุผลใบลดหนี้บางส่วน',
  } as any)
  @ApiBody({ type: CreditNoteReasonUpdateRequestDto })
  async patch(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: CreditNoteReasonUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateCreditNoteReason = {
      ...updateDto,
      id,
    };
    const result = await this.creditNoteReasonService.patch(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  @Delete(':id')
  @UseGuards(new AppIdGuard('creditNoteReason.delete'))
  @Serialize(CreditNoteReasonMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a credit note reason',
    description:
      'Soft-deletes a credit note reason. Historical records using this reason are preserved.',
    operationId: 'configCreditNoteReason_delete',
    'x-description-th': 'ลบเหตุผลใบลดหนี้ตาม ID',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.creditNoteReasonService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
