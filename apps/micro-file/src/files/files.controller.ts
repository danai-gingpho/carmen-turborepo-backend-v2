import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Response } from 'express';
import { FilesService, IPaginate } from './files.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import {
  resSuccessWithData,
  resBadRequest,
  resNotFound,
  resInternalServerError,
  resSuccessWithPaginate,
} from '@/libs/res.error';

interface UploadFilePayload {
  fileName: string;
  mimeType: string;
  buffer: string; // base64 encoded
  folder?: string;
  bu_code?: string;
  user_id?: string;
  tenant_id?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface GetFilePayload {
  fileToken: string;
  user_id?: string;
  tenant_id?: string;
  bu_code?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface DeleteFilePayload {
  fileToken: string;
  user_id?: string;
  tenant_id?: string;
  bu_code?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface ListFilesPayload {
  page?: string;
  perpage?: string;
  search?: string;
  searchfields?: string;
  sort?: string;
  filter?: string;
  advance?: string;
  bu_code?: string;
  prefix?: string; // legacy support
  user_id?: string;
  tenant_id?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface PresignedUrlPayload {
  fileToken: string;
  expirySeconds?: number;
  user_id?: string;
  tenant_id?: string;
  bu_code?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface FileInfoPayload {
  fileToken: string;
  user_id?: string;
  tenant_id?: string;
  bu_code?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface AuditPayload {
  user_id?: string;
  tenant_id?: string;
  bu_code?: string;
  request_id?: string;
  ip_address?: string;
  user_agent?: string;
}

interface MinioError extends Error {
  code?: string;
}

@Controller('api/files')
export class FilesController {
  private readonly logger = new BackendLogger(FilesController.name);

  constructor(private readonly filesService: FilesService) {}

  /**
   * Create audit context from payload for logging
   * สร้าง audit context จาก payload สำหรับการบันทึก log
   * @param payload - Audit payload data / ข้อมูล payload สำหรับ audit
   * @returns Audit context object / อ็อบเจกต์ audit context
   */
  private createAuditContext(payload: AuditPayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  // ============================================
  // HTTP REST Endpoints
  // ============================================

  /**
   * Upload a file via HTTP REST endpoint
   * อัปโหลดไฟล์ผ่าน HTTP REST endpoint
   * @param file - Uploaded file / ไฟล์ที่อัปโหลด
   * @param buCode - Optional business unit code / รหัสหน่วยธุรกิจ (ถ้ามี)
   * @returns Upload result with file token / ผลลัพธ์การอัปโหลดพร้อม file token
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async httpUploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('bu_code') buCode?: string,
  ) {
    this.logger.debug(
      {
        function: 'httpUploadFile',
        fileName: file?.originalname,
        bu_code: buCode,
      },
      FilesController.name,
    );

    if (!file) {
      return resBadRequest('No file provided');
    }

    try {
      const result = await this.filesService.uploadFile(
        file,
        buCode || 'default',
      );
      return resSuccessWithData(result, 'File uploaded successfully');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Upload failed: ${err.message}`);
      return resInternalServerError('Failed to upload file');
    }
  }

  /**
   * List files with pagination via HTTP REST endpoint
   * ค้นหารายการไฟล์ทั้งหมดพร้อมการแบ่งหน้าผ่าน HTTP REST endpoint
   * @returns Paginated file list / รายการไฟล์แบบแบ่งหน้า
   */
  @Get('list')
  async httpListFiles(
    @Query('page') page?: string,
    @Query('perpage') perpage?: string,
    @Query('search') search?: string,
    @Query('searchfields') searchfields?: string,
    @Query('sort') sort?: string,
    @Query('filter') filter?: string,
    @Query('bu_code') buCode?: string,
  ) {
    this.logger.debug(
      {
        function: 'httpListFiles',
        page,
        perpage,
        bu_code: buCode,
      },
      FilesController.name,
    );

    try {
      const paginate: IPaginate = {
        page: Math.max(1, parseInt(page || '1')),
        perpage: Math.min(100, Math.max(1, parseInt(perpage || '10'))),
        search: search || '',
        searchfields: searchfields ? searchfields.split(',') : ['originalName'],
        sort: sort ? sort.split(',') : ['-lastModified'],
        filter: filter ? JSON.parse(filter) : {},
        advance: null,
        bu_code: buCode ? buCode.split(',') : [],
      };

      const result = await this.filesService.listFiles(paginate);

      return resSuccessWithPaginate(
        result.data,
        result.paginate.total,
        result.paginate.page,
        result.paginate.perpage,
        'Files retrieved successfully',
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`List files failed: ${err.message}`);
      return resInternalServerError('Failed to list files');
    }
  }

  /**
   * Get file information via HTTP REST endpoint
   * ค้นหารายการเดียวตาม ID ข้อมูลไฟล์ผ่าน HTTP REST endpoint
   * @param fileToken - Unique file token / token เฉพาะของไฟล์
   * @returns File information / ข้อมูลไฟล์
   */
  @Get('info/:filetoken')
  async httpGetFileInfo(@Param('filetoken') fileToken: string) {
    this.logger.debug(
      { function: 'httpGetFileInfo', fileToken },
      FilesController.name,
    );

    try {
      const fileInfo = await this.filesService.getFileInfo(fileToken);
      return resSuccessWithData(fileInfo, 'File info retrieved successfully');
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Get file info failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        return resNotFound('File not found');
      }
      return resInternalServerError('Failed to get file info');
    }
  }

  /**
   * Download a file via HTTP REST endpoint
   * ดาวน์โหลดไฟล์ผ่าน HTTP REST endpoint
   * @param fileToken - Unique file token / token เฉพาะของไฟล์
   * @param res - Express response object / อ็อบเจกต์ response ของ Express
   */
  @Get('download/:filetoken')
  async httpDownloadFile(
    @Param('filetoken') fileToken: string,
    @Res() res: Response,
  ) {
    this.logger.debug(
      { function: 'httpDownloadFile', fileToken },
      FilesController.name,
    );

    try {
      const fileData = await this.filesService.getFile(fileToken);

      res.set({
        'Content-Type': fileData.contentType,
        'Content-Disposition': fileData.contentDisposition,
        'Content-Length': fileData.size,
      });

      fileData.stream.pipe(res);
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Download file failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        res.status(HttpStatus.NOT_FOUND).json(resNotFound('File not found'));
      } else {
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(resInternalServerError('Failed to download file'));
      }
    }
  }

  /**
   * Get presigned URL for file download via HTTP REST endpoint
   * สร้าง presigned URL สำหรับดาวน์โหลดไฟล์ผ่าน HTTP REST endpoint
   * @param fileToken - Unique file token / token เฉพาะของไฟล์
   * @param expirySeconds - Optional expiry time in seconds / เวลาหมดอายุเป็นวินาที (ถ้ามี)
   * @returns Presigned URL with expiry info / presigned URL พร้อมข้อมูลการหมดอายุ
   */
  @Get('presigned-url/:filetoken')
  async httpGetPresignedUrl(
    @Param('filetoken') fileToken: string,
    @Query('expirySeconds') expirySeconds?: string,
  ) {
    this.logger.debug(
      { function: 'httpGetPresignedUrl', fileToken, expirySeconds },
      FilesController.name,
    );

    try {
      const expiry = parseInt(expirySeconds || '3600');
      const url = await this.filesService.getPresignedUrl(fileToken, expiry);

      return resSuccessWithData(
        {
          fileToken,
          url,
          expiresIn: expiry,
        },
        'Presigned URL generated successfully',
      );
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Get presigned URL failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        return resNotFound('File not found');
      }
      return resInternalServerError('Failed to generate presigned URL');
    }
  }

  /**
   * Delete a file via HTTP REST endpoint
   * ลบไฟล์ผ่าน HTTP REST endpoint
   * @param fileToken - Unique file token / token เฉพาะของไฟล์
   * @returns Deletion confirmation / การยืนยันการลบ
   */
  @Delete(':filetoken')
  async httpDeleteFile(@Param('filetoken') fileToken: string) {
    this.logger.debug(
      { function: 'httpDeleteFile', fileToken },
      FilesController.name,
    );

    try {
      await this.filesService.deleteFile(fileToken);
      return resSuccessWithData(
        { fileToken },
        'File deleted successfully',
      );
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Delete file failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        return resNotFound('File not found');
      }
      return resInternalServerError('Failed to delete file');
    }
  }

  // ============================================
  // TCP Microservice Message Patterns
  // ============================================

  /**
   * Upload a file via TCP microservice message
   * อัปโหลดไฟล์ผ่านข้อความ TCP microservice
   * @param payload - Upload file payload with base64 buffer / ข้อมูลอัปโหลดไฟล์พร้อม buffer แบบ base64
   * @returns Upload result with file token / ผลลัพธ์การอัปโหลดพร้อม file token
   */
  @MessagePattern({ cmd: 'file.upload', service: 'files' })
  async uploadFile(@Payload() payload: UploadFilePayload) {
    this.logger.debug(
      {
        function: 'uploadFile',
        fileName: payload.fileName,
        folder: payload.folder,
        bu_code: payload.bu_code,
      },
      FilesController.name,
    );

    if (!payload.buffer || !payload.fileName) {
      return resBadRequest('No file data provided');
    }

    try {
      const buffer = Buffer.from(payload.buffer, 'base64');
      const file = {
        originalname: payload.fileName,
        mimetype: payload.mimeType || 'application/octet-stream',
        buffer,
        size: buffer.length,
      } as Express.Multer.File;

      const auditContext = this.createAuditContext(payload);

      // Use bu_code if provided, otherwise fall back to folder
      const buCode = payload.bu_code || payload.folder || 'default';

      const result = await runWithAuditContext(auditContext, () =>
        this.filesService.uploadFile(file, buCode),
      );

      return resSuccessWithData(result, 'File uploaded successfully');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Upload failed: ${err.message}`);
      return resInternalServerError('Failed to upload file');
    }
  }

  /**
   * Get file content via TCP microservice message
   * ดึงเนื้อหาไฟล์ผ่านข้อความ TCP microservice
   * @param payload - Payload with file token / ข้อมูลพร้อม file token
   * @returns File data as base64 buffer / ข้อมูลไฟล์แบบ base64 buffer
   */
  @MessagePattern({ cmd: 'file.get', service: 'files' })
  async getFile(@Payload() payload: GetFilePayload) {
    this.logger.debug(
      { function: 'getFile', fileToken: payload.fileToken },
      FilesController.name,
    );

    if (!payload.fileToken) {
      return resBadRequest('File token is required');
    }

    try {
      const auditContext = this.createAuditContext(payload);
      const fileData = await runWithAuditContext(auditContext, () =>
        this.filesService.getFileBuffer(payload.fileToken),
      );

      return resSuccessWithData(
        {
          fileToken: payload.fileToken,
          fileName: fileData.originalName,
          mimeType: fileData.contentType,
          size: fileData.size,
          buffer: fileData.buffer.toString('base64'),
        },
        'File retrieved successfully',
      );
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Get file failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        return resNotFound('File not found');
      }
      return resInternalServerError('Failed to retrieve file');
    }
  }

  /**
   * Get file information via TCP microservice message
   * ค้นหารายการเดียวตาม ID ข้อมูลไฟล์ผ่านข้อความ TCP microservice
   * @param payload - Payload with file token / ข้อมูลพร้อม file token
   * @returns File information / ข้อมูลไฟล์
   */
  @MessagePattern({ cmd: 'file.info', service: 'files' })
  async getFileInfo(@Payload() payload: FileInfoPayload) {
    this.logger.debug(
      { function: 'getFileInfo', fileToken: payload.fileToken },
      FilesController.name,
    );

    if (!payload.fileToken) {
      return resBadRequest('File token is required');
    }

    try {
      const auditContext = this.createAuditContext(payload);
      const fileInfo = await runWithAuditContext(auditContext, () =>
        this.filesService.getFileInfo(payload.fileToken),
      );

      return resSuccessWithData(fileInfo, 'File info retrieved successfully');
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Get file info failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        return resNotFound('File not found');
      }
      return resInternalServerError('Failed to get file info');
    }
  }

  /**
   * Delete a file via TCP microservice message
   * ลบไฟล์ผ่านข้อความ TCP microservice
   * @param payload - Payload with file token / ข้อมูลพร้อม file token
   * @returns Deletion confirmation / การยืนยันการลบ
   */
  @MessagePattern({ cmd: 'file.delete', service: 'files' })
  async deleteFile(@Payload() payload: DeleteFilePayload) {
    this.logger.debug(
      { function: 'deleteFile', fileToken: payload.fileToken },
      FilesController.name,
    );

    if (!payload.fileToken) {
      return resBadRequest('File token is required');
    }

    try {
      const auditContext = this.createAuditContext(payload);
      await runWithAuditContext(auditContext, () =>
        this.filesService.deleteFile(payload.fileToken),
      );

      return resSuccessWithData(
        { fileToken: payload.fileToken },
        'File deleted successfully',
      );
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Delete file failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        return resNotFound('File not found');
      }
      return resInternalServerError('Failed to delete file');
    }
  }

  /**
   * List files with pagination via TCP microservice message
   * ค้นหารายการไฟล์ทั้งหมดพร้อมการแบ่งหน้าผ่านข้อความ TCP microservice
   * @param payload - Pagination and filter parameters / พารามิเตอร์การแบ่งหน้าและการกรอง
   * @returns Paginated file list / รายการไฟล์แบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'file.list', service: 'files' })
  async listFiles(@Payload() payload: ListFilesPayload) {
    this.logger.debug(
      {
        function: 'listFiles',
        page: payload?.page,
        perpage: payload?.perpage,
        bu_code: payload?.bu_code,
        prefix: payload?.prefix,
      },
      FilesController.name,
    );

    try {
      const auditContext = this.createAuditContext(payload);

      // Check if using legacy simple list (prefix only)
      if (payload?.prefix && !payload?.page) {
        const files = await runWithAuditContext(auditContext, () =>
          this.filesService.listFilesSimple(payload.prefix),
        );
        return resSuccessWithData(files, 'Files retrieved successfully');
      }

      // Parse IPaginate parameters
      const paginate: IPaginate = {
        page: Math.max(1, parseInt(payload?.page || '1')),
        perpage: Math.min(100, Math.max(1, parseInt(payload?.perpage || '10'))),
        search: payload?.search || '',
        searchfields: payload?.searchfields
          ? payload.searchfields.split(',')
          : ['originalName'],
        sort: payload?.sort ? payload.sort.split(',') : ['-lastModified'],
        filter: payload?.filter ? JSON.parse(payload.filter) : {},
        advance: payload?.advance ? JSON.parse(payload.advance) : null,
        bu_code: payload?.bu_code ? payload.bu_code.split(',') : [],
      };

      const result = await runWithAuditContext(auditContext, () =>
        this.filesService.listFiles(paginate),
      );

      return resSuccessWithPaginate(
        result.data,
        result.paginate.total,
        result.paginate.page,
        result.paginate.perpage,
        'Files retrieved successfully',
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(`List files failed: ${err.message}`);
      return resInternalServerError('Failed to list files');
    }
  }

  /**
   * Get presigned URL for file download via TCP microservice message
   * สร้าง presigned URL สำหรับดาวน์โหลดไฟล์ผ่านข้อความ TCP microservice
   * @param payload - Payload with file token and expiry / ข้อมูลพร้อม file token และเวลาหมดอายุ
   * @returns Presigned URL with expiry info / presigned URL พร้อมข้อมูลการหมดอายุ
   */
  @MessagePattern({ cmd: 'file.presigned-url', service: 'files' })
  async getPresignedUrl(@Payload() payload: PresignedUrlPayload) {
    this.logger.debug(
      {
        function: 'getPresignedUrl',
        fileToken: payload.fileToken,
        expirySeconds: payload.expirySeconds,
      },
      FilesController.name,
    );

    if (!payload.fileToken) {
      return resBadRequest('File token is required');
    }

    try {
      const expirySeconds = payload.expirySeconds || 3600;
      const auditContext = this.createAuditContext(payload);
      const url = await runWithAuditContext(auditContext, () =>
        this.filesService.getPresignedUrl(payload.fileToken, expirySeconds),
      );

      return resSuccessWithData(
        {
          fileToken: payload.fileToken,
          url,
          expiresIn: expirySeconds,
        },
        'Presigned URL generated successfully',
      );
    } catch (error) {
      const err = error as MinioError;
      this.logger.error(`Get presigned URL failed: ${err.message}`);
      if (
        err.code === 'NoSuchKey' ||
        err.code === 'NotFound' ||
        err.message === 'File not found'
      ) {
        return resNotFound('File not found');
      }
      return resInternalServerError('Failed to generate presigned URL');
    }
  }

  /**
   * Upload a file with folder prefix via TCP microservice message (legacy support)
   * อัปโหลดไฟล์พร้อม prefix โฟลเดอร์ผ่านข้อความ TCP microservice (รองรับแบบเก่า)
   * @param payload - Upload file payload with folder / ข้อมูลอัปโหลดไฟล์พร้อมโฟลเดอร์
   * @returns Upload result with file token / ผลลัพธ์การอัปโหลดพร้อม file token
   */
  @MessagePattern({ cmd: 'file.upload.legacy', service: 'files' })
  async uploadFileLegacy(
    @Payload() payload: UploadFilePayload & { folder?: string },
  ) {
    this.logger.debug(
      {
        function: 'uploadFileLegacy',
        fileName: payload.fileName,
        folder: payload.folder,
      },
      FilesController.name,
    );

    if (!payload.buffer || !payload.fileName) {
      return resBadRequest('No file data provided');
    }

    try {
      const buffer = Buffer.from(payload.buffer, 'base64');
      const file = {
        originalname: payload.fileName,
        mimetype: payload.mimeType || 'application/octet-stream',
        buffer,
        size: buffer.length,
      } as Express.Multer.File;

      const auditContext = this.createAuditContext(payload);
      const result = await runWithAuditContext(auditContext, () =>
        this.filesService.uploadFileWithFolder(file, payload.folder),
      );

      return resSuccessWithData(result, 'File uploaded successfully');
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Upload failed: ${err.message}`);
      return resInternalServerError('Failed to upload file');
    }
  }
}
