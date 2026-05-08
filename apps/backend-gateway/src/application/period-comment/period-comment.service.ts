import {
  BadGatewayException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { ResponseLib } from 'src/libs/response.lib';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
import {
  buildDocumentDownloadUrl,
  fillCommentAttachmentUrls,
} from 'src/common/helpers/document-download-url';

export interface UploadedAttachment {
  fileName: string;
  fileToken: string;
  fileUrl: string;
  contentType: string;
  size: number;
}

@Injectable()
export class PeriodCommentService {
  private readonly logger: BackendLogger = new BackendLogger(
    PeriodCommentService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly businessService: ClientProxy,
    @Inject('FILE_SERVICE') private readonly fileService: ClientProxy,
  ) {}

  async findAllByParentId(
    period_id: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'period-comment.find-all-by-period-id', service: 'period-comment' },
      { period_id, user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.successWithPaginate(
      fillCommentAttachmentUrls(response.data, bu_code),
      response.paginate,
    );
  }

  async update(
    id: string,
    dto: {
      message?: string | null;
      type?: 'user' | 'system';
      addFiles?: Express.Multer.File[];
      removeFileTokens?: string[];
    },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const addFiles = dto.addFiles ?? [];
    const removeTokens = dto.removeFileTokens ?? [];

    const uploaded: UploadedAttachment[] = [];
    if (addFiles.length > 0) {
      const settled = await Promise.allSettled(
        addFiles.map((f) => this.uploadFile(f, user_id, bu_code)),
      );
      const failures = settled.filter((s) => s.status === 'rejected');
      const successes = settled.filter(
        (s): s is PromiseFulfilledResult<UploadedAttachment> => s.status === 'fulfilled',
      );
      uploaded.push(...successes.map((s) => s.value));

      if (failures.length > 0) {
        this.logger.warn(
          {
            function: 'update',
            phase: 'upload-rollback',
            bu_code,
            comment_id: id,
            uploaded_count: uploaded.length,
            failed_count: failures.length,
          },
          PeriodCommentService.name,
        );
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
        const firstReason = (failures[0] as PromiseRejectedResult).reason;
        const msg = firstReason instanceof Error ? firstReason.message : String(firstReason);
        throw new BadGatewayException(`File upload failed: ${msg}`);
      }
    }

    if (removeTokens.length > 0) {
      const results = await Promise.all(
        removeTokens.map((tok) => this.deleteFile(tok, user_id, bu_code)),
      );
      const failedTokens = removeTokens.filter((_, i) => !results[i]);
      if (failedTokens.length > 0) {
        this.logger.warn(
          {
            function: 'update',
            phase: 's3-delete-partial',
            bu_code,
            comment_id: id,
            failed_count: failedTokens.length,
            failed_tokens: failedTokens,
          },
          PeriodCommentService.name,
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.message !== undefined) data.message = dto.message;
    if (dto.type !== undefined) data.type = dto.type;
    if (uploaded.length > 0 || removeTokens.length > 0) {
      data.attachments = {
        add: uploaded,
        remove: removeTokens,
      };
    }

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'period-comment.update', service: 'period-comment' },
      { id, data, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      if (uploaded.length > 0) {
        this.logger.warn(
          {
            function: 'update',
            phase: 'update-rollback',
            bu_code,
            comment_id: id,
            uploaded_count: uploaded.length,
            update_status: response.response.status,
          },
          PeriodCommentService.name,
        );
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
      }
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.success(fillCommentAttachmentUrls(response.data, bu_code));
  }

  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const findRes: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'period-comment.find-by-id', service: 'period-comment' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const findResponse = await firstValueFrom(findRes);
    if (findResponse.response.status !== HttpStatus.OK) {
      return Result.error(
        findResponse.response.message,
        httpStatusToErrorCode(findResponse.response.status),
      );
    }

    const attachments = ((findResponse.data as { attachments?: Array<{ fileToken?: string }> } | undefined)?.attachments ?? [])
      .map((a) => a?.fileToken)
      .filter((t): t is string => typeof t === 'string' && t.length > 0);

    if (attachments.length > 0) {
      const results = await Promise.all(
        attachments.map((fileToken) => this.deleteFile(fileToken, user_id, bu_code)),
      );
      const failedTokens = attachments.filter((_, i) => !results[i]);
      if (failedTokens.length > 0) {
        this.logger.warn(
          {
            function: 'delete',
            phase: 's3-delete-partial',
            bu_code,
            comment_id: id,
            failed_count: failedTokens.length,
            failed_tokens: failedTokens,
          },
          PeriodCommentService.name,
        );
      }
    }

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'period-comment.delete', service: 'period-comment' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.success(response.data);
  }

  async addAttachments(
    id: string,
    files: Express.Multer.File[],
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const settled = await Promise.allSettled(
      files.map((f) => this.uploadFile(f, user_id, bu_code)),
    );
    const failures = settled.filter((s) => s.status === 'rejected');
    const successes = settled.filter(
      (s): s is PromiseFulfilledResult<UploadedAttachment> => s.status === 'fulfilled',
    );
    const uploaded: UploadedAttachment[] = successes.map((s) => s.value);

    if (failures.length > 0) {
      this.logger.warn(
        {
          function: 'addAttachments',
          phase: 'upload-rollback',
          bu_code,
          comment_id: id,
          uploaded_count: uploaded.length,
          failed_count: failures.length,
        },
        PeriodCommentService.name,
      );
      await Promise.all(
        uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
      );
      const firstReason = (failures[0] as PromiseRejectedResult).reason;
      const msg = firstReason instanceof Error ? firstReason.message : String(firstReason);
      throw new BadGatewayException(`File upload failed: ${msg}`);
    }

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'period-comment.add-attachment', service: 'period-comment' },
      {
        id,
        attachments: uploaded,
        user_id,
        bu_code,
        version,
        ...getGatewayRequestContext(),
      },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      this.logger.warn(
        {
          function: 'addAttachments',
          phase: 'business-rollback',
          bu_code,
          comment_id: id,
          uploaded_count: uploaded.length,
          add_status: response.response.status,
        },
        PeriodCommentService.name,
      );
      await Promise.all(
        uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
      );
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.success(fillCommentAttachmentUrls(response.data, bu_code));
  }

  async removeAttachment(
    id: string,
    fileToken: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'period-comment.remove-attachment', service: 'period-comment' },
      { id, fileToken, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.success(fillCommentAttachmentUrls(response.data, bu_code));
  }

  async createWithFiles(
    files: Express.Multer.File[],
    dto: {
      period_id: string;
      message?: string | null;
      type?: 'user' | 'system';
    },
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const uploaded: UploadedAttachment[] = [];

    if (files.length > 0) {
      const settled = await Promise.allSettled(
        files.map((f) => this.uploadFile(f, user_id, bu_code)),
      );
      const failures = settled.filter((s) => s.status === 'rejected');
      const successes = settled.filter(
        (s): s is PromiseFulfilledResult<UploadedAttachment> => s.status === 'fulfilled',
      );
      uploaded.push(...successes.map((s) => s.value));

      if (failures.length > 0) {
        this.logger.warn(
          {
            function: 'createWithFiles',
            phase: 'upload-rollback',
            bu_code,
            period_id: dto.period_id,
            uploaded_count: uploaded.length,
            failed_count: failures.length,
          },
          PeriodCommentService.name,
        );
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
        const firstReason = (failures[0] as PromiseRejectedResult).reason;
        const msg = firstReason instanceof Error ? firstReason.message : String(firstReason);
        throw new BadGatewayException(`File upload failed: ${msg}`);
      }
    }

    const data = {
      period_id: dto.period_id,
      message: dto.message ?? null,
      type: dto.type ?? 'user',
      attachments: uploaded,
    };

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'period-comment.create', service: 'period-comment' },
      { data, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      if (uploaded.length > 0) {
        this.logger.warn(
          {
            function: 'createWithFiles',
            phase: 'create-rollback',
            bu_code,
            period_id: dto.period_id,
            uploaded_count: uploaded.length,
            create_status: response.response.status,
          },
          PeriodCommentService.name,
        );
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
      }
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.created(fillCommentAttachmentUrls(response.data, bu_code));
  }

  async uploadFile(
    file: Express.Multer.File,
    user_id: string,
    bu_code: string,
  ): Promise<UploadedAttachment> {
    const payload = {
      fileName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer.toString('base64'),
      bu_code,
      user_id,
      ...getGatewayRequestContext(),
    };
    const res: Observable<MicroserviceResponse> = this.fileService.send(
      { cmd: 'file.upload', service: 'files' },
      payload,
    );
    const response = (await firstValueFrom(res)) as any;
    if (!response.success) {
      const msg = response.response?.message ?? 'File upload failed';
      throw new BadGatewayException(msg);
    }
    const data = response.data as
      | {
          fileToken?: string;
          objectName?: string;
          originalName?: string;
          contentType?: string;
          size?: number;
        }
      | undefined;
    return {
      fileName: data?.originalName ?? file.originalname,
      fileToken: String(data?.fileToken ?? ''),
      fileUrl: buildDocumentDownloadUrl(bu_code, String(data?.fileToken ?? '')),
      contentType: data?.contentType ?? file.mimetype,
      size: typeof data?.size === 'number' ? data.size : file.size,
    };
  }

  async deleteFile(
    fileToken: string,
    user_id: string,
    bu_code: string,
  ): Promise<boolean> {
    try {
      const res: Observable<MicroserviceResponse> = this.fileService.send(
        { cmd: 'file.delete', service: 'files' },
        { fileToken, user_id, bu_code, ...getGatewayRequestContext() },
      );
      const response = (await firstValueFrom(res)) as any;
      if (!response.success) {
        this.logger.warn(
          {
            function: 'deleteFile',
            fileToken,
            reason: response.response?.message,
          },
          PeriodCommentService.name,
        );
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(
        { function: 'deleteFile', fileToken, error: (err as Error).message },
        PeriodCommentService.name,
      );
      return false;
    }
  }
}
