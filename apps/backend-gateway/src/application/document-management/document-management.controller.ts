import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentManagementService } from './document-management.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  Result,
  ErrorCode,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';

@Controller('api/:bu_code/documents')
@ApiTags('Documents: File Management')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class DocumentManagementController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    DocumentManagementController.name,
  );

  constructor(
    private readonly documentManagementService: DocumentManagementService,
  ) {
    super();
  }

  /**
   * Upload a document to file storage
   * อัปโหลดเอกสารไปยังที่จัดเก็บไฟล์
   * @param file - File to upload / ไฟล์ที่จะอัปโหลด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Uploaded document metadata / ข้อมูลเมตาของเอกสารที่อัปโหลด
   */
  @Post('upload')
  @UseGuards(new AppIdGuard('documents.upload'))
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload a document',
    description: 'Uploads a procurement-related document (e.g., vendor invoices, contracts, delivery receipts) to secure storage for attachment to purchase orders, GRNs, or other transaction records.',
    'x-description-th': 'อัปโหลดเอกสารใหม่',
    operationId: 'uploadDocument',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  } as any)
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'uploadDocument',
        fileName: file?.originalname,
        bu_code,
      },
      DocumentManagementController.name,
    );

    if (!file) {
      const result = Result.error('No file provided', ErrorCode.INVALID_ARGUMENT);
      this.respond(res, result);
      return;
    }

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.uploadDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      user_id,
      bu_code,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * List all documents in the business unit
   * ค้นหารายการเอกสารทั้งหมดในหน่วยธุรกิจ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @returns Paginated list of documents / รายการเอกสารแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('documents.list'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List documents',
    description: 'Lists all uploaded procurement documents for the business unit with pagination, enabling staff to search and browse stored invoices, contracts, and delivery receipts.',
    'x-description-th': 'แสดงรายการเอกสารทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'listDocuments',
  })
  @ApiUserFilterQueries()
  async listDocuments(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'listDocuments',
        bu_code,
        query,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.documentManagementService.listDocuments(
      bu_code,
      user_id,
      paginate,
    );
    this.respond(res, result);
  }

  /**
   * Download a document by file token
   * ดาวน์โหลดเอกสารตาม file token
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Document content / เนื้อหาเอกสาร
   */
  @Get(':filetoken')
  @UseGuards(new AppIdGuard('documents.get'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get document by token',
    description: 'Downloads a specific procurement document by its unique file token, used to view attached invoices, contracts, or delivery receipts linked to transaction records.',
    'x-description-th': 'ดึงข้อมูลเอกสารรายการเดียวตาม file token',
    operationId: 'getDocument',
  } as any)
  async getDocument(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.getDocument(fileToken, user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * Download a document as raw binary stream
   * ดาวน์โหลดเอกสารเป็น binary stream
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Raw binary file body / เนื้อหาไฟล์ binary ดิบ
   */
  @Get(':filetoken/download')
  @UseGuards(new AppIdGuard('documents.download'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Download document binary',
    description:
      'Streams the raw binary content of a procurement document for direct browser viewing or download (images, PDFs). Unlike the JSON-wrapped variant, this returns the file body with proper Content-Type/Content-Disposition headers.',
    'x-description-th': 'ดาวน์โหลดไฟล์ binary โดยตรง สำหรับเปิดดูในเบราว์เซอร์',
    operationId: 'downloadDocument',
  } as any)
  async downloadDocument(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'downloadDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.downloadDocument(
      fileToken,
      user_id,
      bu_code,
    );

    if (!result.isOk()) {
      this.respond(res, result);
      return;
    }

    const { buffer, contentType, fileName, size } = result.value;
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': size,
    });
    res.send(buffer);
  }

  /**
   * Get document metadata without downloading content
   * ดึงข้อมูลเมตาของเอกสารโดยไม่ดาวน์โหลดเนื้อหา
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Document metadata / ข้อมูลเมตาเอกสาร
   */
  @Get(':filetoken/info')
  @UseGuards(new AppIdGuard('documents.info'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get document info',
    description: 'Retrieves metadata (file name, type, size, upload date) for a procurement document without downloading the file content, useful for display in document listing views.',
    'x-description-th': 'ดึงข้อมูลเมตาของเอกสารโดยไม่ดาวน์โหลดเนื้อหา',
    operationId: 'getDocumentInfo',
  } as any)
  async getDocumentInfo(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDocumentInfo',
        fileToken,
        bu_code,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.getDocumentInfo(
      fileToken,
      user_id,
      bu_code,
    );
    this.respond(res, result);
  }

  /**
   * Generate a presigned URL for secure document access
   * สร้าง presigned URL สำหรับเข้าถึงเอกสารอย่างปลอดภัย
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param expirySeconds - URL expiry in seconds / เวลาหมดอายุ URL เป็นวินาที
   * @returns Presigned URL / Presigned URL
   */
  @Get(':filetoken/presigned-url')
  @UseGuards(new AppIdGuard('documents.presignedUrl'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get presigned URL',
    description: 'Generates a time-limited presigned URL for secure, direct access to a procurement document, enabling browser-based viewing or sharing without exposing permanent storage credentials.',
    'x-description-th': 'สร้าง presigned URL สำหรับเข้าถึงเอกสารอย่างปลอดภัย',
    operationId: 'getPresignedUrl',
  })
  @ApiQuery({ name: 'expirySeconds', required: false, type: Number })
  async getPresignedUrl(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('expirySeconds') expirySeconds?: string,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getPresignedUrl',
        fileToken,
        bu_code,
        expirySeconds,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const expiry = expirySeconds ? parseInt(expirySeconds) : undefined;
    const result = await this.documentManagementService.getPresignedUrl(
      fileToken,
      user_id,
      bu_code,
      expiry,
    );
    this.respond(res, result);
  }

  /**
   * Delete a document from storage
   * ลบเอกสารจากที่จัดเก็บ
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Delete result / ผลลัพธ์การลบ
   */
  @Delete(':filetoken')
  @UseGuards(new AppIdGuard('documents.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Permanently removes a procurement document from storage, used when files were uploaded in error or are no longer relevant to the associated transaction.',
    'x-description-th': 'ลบเอกสารตาม file token',
    operationId: 'deleteDocument',
  } as any)
  async deleteDocument(
    @Param('filetoken') fileToken: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.documentManagementService.deleteDocument(
      fileToken,
      user_id,
      bu_code,
    );
    this.respond(res, result);
  }
}
