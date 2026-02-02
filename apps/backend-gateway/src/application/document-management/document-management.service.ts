import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

@Injectable()
export class DocumentManagementService {
  private readonly logger: BackendLogger = new BackendLogger(
    DocumentManagementService.name,
  );

  constructor(
    @Inject('FILE_SERVICE')
    private readonly fileService: ClientProxy,
  ) {}

  async uploadDocument(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'uploadDocument',
        fileName,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const fileBase64 = fileBuffer.toString('base64');

    const res: Observable<any> = this.fileService.send(
      { cmd: 'file.upload', service: 'files' },
      {
        fileName,
        mimeType,
        buffer: fileBase64,
        bu_code,
        user_id,
      },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async getDocument(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const res: Observable<any> = this.fileService.send(
      { cmd: 'file.get', service: 'files' },
      { fileToken, user_id, bu_code },
    );

    const response = await firstValueFrom(res);

    if (!response.success) {
      return Result.error(response.message, httpStatusToErrorCode(response.status));
    }

    return Result.ok(response.data);
  }

  async getDocumentInfo(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getDocumentInfo',
        fileToken,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const res: Observable<any> = this.fileService.send(
      { cmd: 'file.info', service: 'files' },
      { fileToken, user_id, bu_code },
    );

    const response = await firstValueFrom(res);

    if (!response.success) {
      return Result.error(response.message, httpStatusToErrorCode(response.status));
    }

    return Result.ok(response.data);
  }

  async deleteDocument(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'deleteDocument',
        fileToken,
        bu_code,
      },
      DocumentManagementService.name,
    );

    const res: Observable<any> = this.fileService.send(
      { cmd: 'file.delete', service: 'files' },
      { fileToken, user_id, bu_code },
    );

    const response = await firstValueFrom(res);

    if (!response.success) {
      return Result.error(response.message, httpStatusToErrorCode(response.status));
    }

    return Result.ok(response.data);
  }

  async listDocuments(
    bu_code: string,
    user_id: string,
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'listDocuments',
        bu_code,
        paginate,
      },
      DocumentManagementService.name,
    );

    const res: Observable<any> = this.fileService.send(
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
        advance: paginate.advance ? JSON.stringify(paginate.advance) : undefined,
      },
    );

    const response = await firstValueFrom(res);

    if (!response.success) {
      return Result.error(response.message, httpStatusToErrorCode(response.status));
    }

    return Result.ok({ data: response.data, paginate: response.meta });
  }

  async getPresignedUrl(
    fileToken: string,
    user_id: string,
    bu_code: string,
    expirySeconds?: number,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getPresignedUrl',
        fileToken,
        bu_code,
        expirySeconds,
      },
      DocumentManagementService.name,
    );

    const res: Observable<any> = this.fileService.send(
      { cmd: 'file.presigned-url', service: 'files' },
      {
        fileToken,
        user_id,
        bu_code,
        expirySeconds: expirySeconds || 3600,
      },
    );

    const response = await firstValueFrom(res);

    if (!response.success) {
      return Result.error(response.message, httpStatusToErrorCode(response.status));
    }

    return Result.ok(response.data);
  }
}
