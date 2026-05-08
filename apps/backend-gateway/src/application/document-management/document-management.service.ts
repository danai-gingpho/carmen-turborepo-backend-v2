import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class DocumentManagementService {
  private readonly logger: BackendLogger = new BackendLogger(
    DocumentManagementService.name,
  );

  constructor(
    @Inject('FILE_SERVICE')
    private readonly fileService: ClientProxy,
  ) {}

  /**
   * Upload a document to file storage via the file microservice
   * อัปโหลดเอกสารไปยังที่จัดเก็บไฟล์ผ่านไมโครเซอร์วิสไฟล์
   * @param fileBuffer - File binary content / เนื้อหาไบนารีของไฟล์
   * @param fileName - Original file name / ชื่อไฟล์ต้นฉบับ
   * @param mimeType - File MIME type / ประเภท MIME ของไฟล์
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Uploaded document metadata / ข้อมูลเมตาของเอกสารที่อัปโหลด
   */
  async uploadDocument(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'uploadDocument',
        fileName,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const fileBase64 = fileBuffer.toString('base64');

    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.upload', service: 'files' },
      {
        fileName,
        mimeType,
        buffer: fileBase64,
        bu_code,
        user_id, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res) as any;

    if (!response.success) {
      return Result.error(
        response.response?.message ?? response.message,
        httpStatusToErrorCode(response.response?.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Download a document by file token
   * ดาวน์โหลดเอกสารตาม file token
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Document content / เนื้อหาเอกสาร
   */
  async getDocument(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.get', service: 'files' },
      { fileToken, user_id, bu_code, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res) as any;

    if (!response.success) {
      return Result.error(response.response?.message ?? response.message, httpStatusToErrorCode(response.response?.status));
    }

    return Result.ok(response.data);
  }

  /**
   * Get document metadata without downloading content
   * ดึงข้อมูลเมตาของเอกสารโดยไม่ดาวน์โหลดเนื้อหา
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Document metadata / ข้อมูลเมตาเอกสาร
   */
  async getDocumentInfo(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getDocumentInfo',
        fileToken,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.info', service: 'files' },
      { fileToken, user_id, bu_code, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res) as any;

    if (!response.success) {
      return Result.error(response.response?.message ?? response.message, httpStatusToErrorCode(response.response?.status));
    }

    return Result.ok(response.data);
  }

  /**
   * Delete a document from storage
   * ลบเอกสารจากที่จัดเก็บ
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Delete result / ผลลัพธ์การลบ
   */
  async deleteDocument(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'deleteDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.delete', service: 'files' },
      { fileToken, user_id, bu_code, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res) as any;

    if (!response.success) {
      return Result.error(response.response?.message ?? response.message, httpStatusToErrorCode(response.response?.status));
    }

    return Result.ok(response.data);
  }

  /**
   * List all documents in the business unit with pagination
   * ค้นหารายการเอกสารทั้งหมดในหน่วยธุรกิจแบบแบ่งหน้า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of documents / รายการเอกสารแบบแบ่งหน้า
   */
  async listDocuments(
    bu_code: string,
    user_id: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'listDocuments',
        bu_code,
        paginate,
      },
      DocumentManagementService.name,
    );

    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.list', service: 'files' },
      {
        bu_code,
        user_id,
        page: String(paginate.page),
        perpage: String(paginate.perpage),
        search: paginate.search,
        searchfields: paginate.searchfields?.join(','),
        sort: paginate.sort?.join(','),
        filter: paginate.filter ? JSON.stringify(paginate.filter) : undefined,
        advance: paginate.advance ? JSON.stringify(paginate.advance) : undefined, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res) as any;

    if (!response.success) {
      return Result.error(response.response?.message ?? response.message, httpStatusToErrorCode(response.response?.status));
    }

    return Result.ok({ data: response.data, paginate: response.meta });
  }

  /**
   * Generate a presigned URL for secure document access
   * สร้าง presigned URL สำหรับเข้าถึงเอกสารอย่างปลอดภัย
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param expirySeconds - URL expiry in seconds / เวลาหมดอายุ URL เป็นวินาที
   * @returns Presigned URL / Presigned URL
   */
  async getPresignedUrl(
    fileToken: string,
    user_id: string,
    bu_code: string,
    expirySeconds?: number,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'getPresignedUrl',
        fileToken,
        bu_code,
        expirySeconds,
      },
      DocumentManagementService.name,
    );

    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.presigned-url', service: 'files' },
      {
        fileToken,
        user_id,
        bu_code,
        expirySeconds: expirySeconds || 3600, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res) as any;

    if (!response.success) {
      return Result.error(response.response?.message ?? response.message, httpStatusToErrorCode(response.response?.status));
    }

    return Result.ok(response.data);
  }

  /**
   * Download a document and return the decoded binary buffer.
   * ดาวน์โหลดเอกสารและคืนค่า binary buffer
   * @param fileToken - Unique file token / โทเค็นไฟล์เฉพาะ
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Decoded buffer with content metadata / buffer ที่ถอดรหัสแล้วพร้อมข้อมูลไฟล์
   */
  async downloadDocument(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<
    Result<{ buffer: Buffer; contentType: string; fileName: string; size: number }>
  > {
    this.logger.debug(
      {
        function: 'downloadDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.get', service: 'files' },
      { fileToken, user_id, bu_code, ...getGatewayRequestContext() },
    );

    const response = (await firstValueFrom(res)) as any;

    if (!response.success) {
      return Result.error(
        response.response?.message ?? response.message,
        httpStatusToErrorCode(response.response?.status),
      );
    }

    const data = response.data ?? {};
    const buffer = Buffer.from(String(data.buffer ?? ''), 'base64');

    return Result.ok({
      buffer,
      contentType: data.mimeType ?? 'application/octet-stream',
      fileName: data.fileName ?? fileToken,
      size: typeof data.size === 'number' ? data.size : buffer.length,
    });
  }
}
