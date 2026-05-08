import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController } from '@/common';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { Config_AppConfigService } from './config_app_config.service';

interface AppConfigUpsertBody {
  value: unknown;
}

@ApiTags('Config: System')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/app-config')
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_AppConfigController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_AppConfigController.name,
  );

  constructor(private readonly appConfigService: Config_AppConfigService) {
    super();
  }

  /**
   * List all application config entries for a business unit
   * แสดงรายการ application config ทั้งหมดของหน่วยธุรกิจ
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List application config entries for a BU',
    description:
      'Returns all tb_application_config rows for the business unit. Sensitive fields (e.g. SMTP password) are masked.',
    operationId: 'configAppConfig_list',
    'x-description-th': 'แสดงรายการ tb_application_config ทั้งหมดของหน่วยธุรกิจ (mask password)',
  } as any)
  async list(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
  ): Promise<void> {
    this.logger.debug({ function: 'list', bu_code }, Config_AppConfigController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.appConfigService.list(bu_code, user_id);
    this.respond(res, result);
  }

  /**
   * Get a single application config entry by key
   * ดู application config รายการเดียวตาม key
   */
  @Get(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get application config entry by key',
    description: 'Returns one tb_application_config row by key. Sensitive fields are masked.',
    operationId: 'configAppConfig_get',
    'x-description-th': 'ดู tb_application_config รายการเดียวตาม key',
  } as any)
  async get(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('key') key: string,
  ): Promise<void> {
    this.logger.debug({ function: 'get', bu_code, key }, Config_AppConfigController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.appConfigService.get(bu_code, user_id, key);
    this.respond(res, result);
  }

  /**
   * Create or update an application config entry
   * สร้างหรืออัปเดต application config
   */
  @Put(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update application config entry',
    description:
      'Upserts a tb_application_config row by key. For key="report_email", the SMTP password is automatically encrypted before storage.',
    operationId: 'configAppConfig_upsert',
    'x-description-th': 'สร้าง/อัปเดต tb_application_config — auto encrypt password',
  } as any)
  @ApiBody({
    description: 'Config value (JSON). Schema depends on key.',
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'object',
          example: {
            smtp: {
              host: 'smtp.gmail.com',
              port: 587,
              username: 'noreply@example.com',
              password: 'app-password-here',
              from: 'noreply@example.com',
              enabled: true,
            },
            recipients: ['admin@example.com'],
            cc: [],
            subject_prefix: '[Carmen]',
          },
        },
      },
      required: ['value'],
    },
  })
  async upsert(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('key') key: string,
    @Body() body: AppConfigUpsertBody,
  ): Promise<void> {
    this.logger.debug({ function: 'upsert', bu_code, key }, Config_AppConfigController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.appConfigService.upsert(bu_code, user_id, key, body?.value);
    this.respond(res, result);
  }

  /**
   * Soft-delete an application config entry
   * ลบ application config (soft delete)
   */
  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete application config entry',
    description: 'Soft-deletes a tb_application_config row by key (sets deleted_at).',
    operationId: 'configAppConfig_delete',
    'x-description-th': 'ลบ tb_application_config (soft delete)',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('key') key: string,
  ): Promise<void> {
    this.logger.debug({ function: 'delete', bu_code, key }, Config_AppConfigController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.appConfigService.delete(bu_code, user_id, key);
    this.respond(res, result);
  }

  /**
   * List signature candidates for a doc type (users with approval authority
   * drawn from the BU's tb_workflow, excluding requestors/creators).
   * ดึงรายชื่อผู้ลงนามที่มีสิทธิ์อนุมัติจาก tb_workflow ตามประเภทเอกสาร
   */
  @Get('signature-candidates/:doc_type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List signature candidates for a document type',
    description:
      'Returns deduplicated users assigned to approval stages in tb_workflow for the given doc_type (pr | po | sr). Used by frontend signature config select.',
    operationId: 'configAppConfig_signatureCandidates',
    'x-description-th': 'รายชื่อ user ที่มีสิทธิ์ลงนาม (จาก workflow) ใช้กับ select บนฟอร์ม signature config',
  } as any)
  async signatureCandidates(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('doc_type') doc_type: string,
  ): Promise<void> {
    this.logger.debug(
      { function: 'signatureCandidates', bu_code, doc_type },
      Config_AppConfigController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.appConfigService.signatureCandidates(
      bu_code,
      user_id,
      doc_type,
    );
    this.respond(res, result);
  }

  /**
   * Send a test email using the current report_email config
   * ส่งเมลทดสอบโดยใช้ config ปัจจุบัน
   */
  @Post('test-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send test email using current report_email config',
    description:
      'Sends a test email through the normal BU notification flow (load config → decrypt → send) so the result mirrors production behavior.',
    operationId: 'configAppConfig_testEmail',
    'x-description-th': 'ส่งเมลทดสอบด้วย config ปัจจุบัน',
  } as any)
  async testEmail(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
  ): Promise<void> {
    this.logger.debug({ function: 'testEmail', bu_code }, Config_AppConfigController.name);
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.appConfigService.testEmail(bu_code, user_id);
    this.respond(res, result);
  }
}
