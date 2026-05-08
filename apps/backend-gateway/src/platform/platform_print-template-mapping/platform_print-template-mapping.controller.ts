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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import {
  CreateMappingPayload,
  Platform_PrintTemplateMappingService,
  UpdateMappingPayload,
} from './platform_print-template-mapping.service';

@ApiTags('Platform: Print Template Mapping')
@ApiHeaderRequiredXAppId()
@Controller('api-system/print-template-mapping')
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_PrintTemplateMappingController {
  private readonly logger = new BackendLogger(
    Platform_PrintTemplateMappingController.name,
  );

  constructor(
    private readonly svc: Platform_PrintTemplateMappingService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List print-template mappings',
    description:
      'Returns every mapping between a document_type (PR/PO/SR/...) and a tb_report_template, joined with the template name and audit display names.',
    operationId: 'platformPrintTemplateMapping_findAll',
    tags: ['Platform Admin', 'Print Template Mapping'],
    'x-description-th': 'แสดงรายการการ mapping เอกสาร (PR/PO/SR/...) กับ report template',
  } as any)
  @ApiQuery({ name: 'document_type', required: false, type: 'string' })
  @ApiQuery({ name: 'active_only', required: false, type: 'boolean' })
  async findAll(
    @Res() res: Response,
    @Query('document_type') documentType?: string,
    @Query('active_only') activeOnly?: string,
  ): Promise<void> {
    const data = await this.svc.findAll(documentType, activeOnly === 'true');
    res.status(HttpStatus.OK).json({ success: true, ...data });
  }

  @Get('document-types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List supported document types',
    description: 'Canonical enum of document types the print pipeline knows about.',
    operationId: 'platformPrintTemplateMapping_listDocumentTypes',
    tags: ['Platform Admin', 'Print Template Mapping'],
    'x-description-th': 'แสดงรายชื่อชนิดเอกสารที่ระบบรองรับ (PR / PO / SR / ฯลฯ)',
  } as any)
  async listDocumentTypes(@Res() res: Response): Promise<void> {
    const data = await this.svc.listDocumentTypes();
    res.status(HttpStatus.OK).json({ success: true, ...data });
  }

  @Get('resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve the active mapping for a document type + business unit',
    description:
      'Used by the print pipeline at runtime to decide which report template to render for a given document. Honours allow/deny business-unit lists and is_default ordering.',
    operationId: 'platformPrintTemplateMapping_resolve',
    tags: ['Platform Admin', 'Print Template Mapping'],
    'x-description-th': 'หาตัว mapping ที่จะใช้ตอนพิมพ์เอกสารชนิดนี้ใน BU นี้',
  } as any)
  @ApiQuery({ name: 'document_type', required: true, type: 'string' })
  @ApiQuery({ name: 'bu_code', required: false, type: 'string' })
  async resolve(
    @Res() res: Response,
    @Query('document_type') documentType: string,
    @Query('bu_code') buCode?: string,
  ): Promise<void> {
    const data = await this.svc.resolve(documentType, buCode);
    res.status(HttpStatus.OK).json({ success: true, data });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a print-template mapping by ID',
    operationId: 'platformPrintTemplateMapping_findOne',
    tags: ['Platform Admin', 'Print Template Mapping'],
    'x-description-th': 'ดู mapping ตาม ID',
  } as any)
  async findOne(
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    const data = await this.svc.findOne(id);
    res.status(HttpStatus.OK).json({ success: true, data });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a print-template mapping',
    operationId: 'platformPrintTemplateMapping_create',
    tags: ['Platform Admin', 'Print Template Mapping'],
    'x-description-th': 'สร้าง mapping ใหม่ระหว่างชนิดเอกสารกับ report template',
  } as any)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: CreateMappingPayload,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const data = await this.svc.create({ ...body, user_id });
    res.status(HttpStatus.CREATED).json({ success: true, data });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a print-template mapping',
    operationId: 'platformPrintTemplateMapping_update',
    tags: ['Platform Admin', 'Print Template Mapping'],
    'x-description-th': 'แก้ไข mapping',
  } as any)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateMappingPayload,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const data = await this.svc.update(id, { ...body, user_id });
    res.status(HttpStatus.OK).json({ success: true, data });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete a print-template mapping',
    operationId: 'platformPrintTemplateMapping_delete',
    tags: ['Platform Admin', 'Print Template Mapping'],
    'x-description-th': 'ลบ mapping (soft delete)',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const data = await this.svc.delete(id, user_id);
    res.status(HttpStatus.OK).json({ success: true, ...data });
  }
}
