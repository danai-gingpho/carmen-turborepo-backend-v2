/**
 * Codemod — apply the shared comment-logic refactor described in
 * `docs/design-comment-logic.md` to every remaining `<prefix>-comment` module
 * in `apps/backend-gateway/src/application/`.
 *
 * For each module:
 *  1. Parses the existing controller to extract identifiers (className, urlPrefix,
 *     parentRoute, parentId, ApiTags, cmd service-name).
 *  2. Generates new controller, service, dto, upload-with-files dto from
 *     templates, preserving per-module identifiers.
 *  3. Skips modules already refactored in the canonical set.
 *
 * Run with:
 *   bun run scripts/apply-comment-logic/run.ts            # dry-run (default)
 *   bun run scripts/apply-comment-logic/run.ts --apply    # write changes
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const repoRoot = join(import.meta.dir, '..', '..');
const gatewayApp = join(repoRoot, 'apps', 'backend-gateway', 'src', 'application');
const APPLY = process.argv.includes('--apply');

// All comment modules (including the 4 canonical) are now generated from this
// template so they share `findAllByParentId`, multipart shapes, S3-rollback
// flows, and the `attachments: { add, remove }` payload. Module-specific
// `cmdServiceName` (e.g., physical-count-detail-comment uses
// `service: 'physical-count'`) is preserved by parsing the existing service
// file.
const ALREADY_DONE = new Set<string>([]);

interface ModuleInfo {
  folder: string;            // e.g., 'purchase-order-comment'
  prefix: string;            // same as folder
  parentRoute: string;       // e.g., 'purchase-order'
  parentIdName: string;      // e.g., 'purchase_order_id'
  className: string;         // e.g., 'PurchaseOrderCommentController'
  serviceClassName: string;  // e.g., 'PurchaseOrderCommentService'
  serviceProp: string;       // e.g., 'purchaseOrderCommentService'
  permissionPrefix: string;  // e.g., 'purchaseOrderComment'
  cmdServiceName: string;    // e.g., 'purchase-order-comment'
  apiTags: string;           // e.g., 'Procurement: Purchase Orders'
  detailVariant: boolean;    // true if folder ends with -detail-comment
}

function detect(folder: string): ModuleInfo | null {
  const ctrlPath = join(gatewayApp, folder, `${folder}.controller.ts`);
  const svcPath = join(gatewayApp, folder, `${folder}.service.ts`);
  if (!existsSync(ctrlPath) || !existsSync(svcPath)) return null;

  const ctrl = readFileSync(ctrlPath, 'utf-8');
  const svc = readFileSync(svcPath, 'utf-8');

  // Try the OLD URL pattern first (`/:parent_route/:parent_id/comments`),
  // then fall back to the NEW pattern (`/<comment-prefix>/:parent_id`)
  // for modules that have already been refactored.
  let parentRoute: string;
  let parentIdName: string;
  const oldFindAll = ctrl.match(/@Get\(':bu_code\/([^/]+)\/:([a-z_0-9]+)\/comments'\)/);
  if (oldFindAll) {
    parentRoute = oldFindAll[1];
    parentIdName = oldFindAll[2];
  } else {
    const newFindAll = ctrl.match(
      new RegExp(`@Get\\(':bu_code\\/${folder}\\/:([a-z_0-9]+)'\\)`),
    );
    if (!newFindAll) return null;
    parentIdName = newFindAll[1];
    parentRoute = folder.replace(/-comment$/, '');
  }

  const classMatch = ctrl.match(/export class (\w+CommentController)/);
  if (!classMatch) return null;
  const className = classMatch[1];

  const serviceClassName = className.replace('Controller', 'Service');
  const serviceProp = serviceClassName[0].toLowerCase() + serviceClassName.slice(1);
  const permissionPrefix = serviceProp.replace(/Service$/, '');

  const apiTagsMatch = ctrl.match(/@ApiTags\('([^']+)'\)/);
  const apiTags = apiTagsMatch ? apiTagsMatch[1] : 'Comments';

  const cmdServiceMatch = svc.match(
    new RegExp(`cmd:\\s*'${folder}\\.[^']+'\\s*,\\s*service:\\s*'([^']+)'`),
  );
  const cmdServiceName = cmdServiceMatch ? cmdServiceMatch[1] : folder;

  return {
    folder,
    prefix: folder,
    parentRoute,
    parentIdName,
    className,
    serviceClassName,
    serviceProp,
    permissionPrefix,
    cmdServiceName,
    apiTags,
    detailVariant: folder.endsWith('-detail-comment'),
  };
}

function buildController(m: ModuleInfo): string {
  return `import {
  BadRequestException,
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ${m.serviceClassName} } from './${m.folder}.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  UploadCommentWithFilesBodySchema,
  UploadCommentWithFilesDto,
} from './dto/upload-comment-with-files.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiVersionMinRequest, ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { PermissionGuard } from 'src/auth/guards/permission.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  Update${stripController(m.className)}Dto,
  Update${stripController(m.className)}BodySchema,
  AddAttachmentsDto,
} from './dto/${m.folder}.dto';

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

@Controller('api')
@ApiTags('${m.apiTags}')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, PermissionGuard)
@ApiBearerAuth()
export class ${m.className} {
  private readonly logger: BackendLogger = new BackendLogger(
    ${m.className}.name,
  );

  constructor(
    private readonly ${m.serviceProp}: ${m.serviceClassName},
  ) {}

  @Get(':bu_code/${m.prefix}/:${m.parentIdName}')
  @UseGuards(new AppIdGuard('${m.permissionPrefix}.findAll'))
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all comments for a ${m.parentRoute}',
    operationId: 'findAll${stripController(m.className)}s',
    responses: {
      200: { description: 'Comments retrieved successfully' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async findAllByParentId(
    @Param('bu_code') bu_code: string,
    @Param('${m.parentIdName}', new ParseUUIDPipe({ version: '4' })) ${m.parentIdName}: string,
    @Req() req: Request,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    return this.${m.serviceProp}.findAllByParentId(
      ${m.parentIdName},
      user_id,
      bu_code,
      paginate,
      version,
    );
  }

  @Patch(':bu_code/${m.prefix}/:id')
  @UseGuards(new AppIdGuard('${m.permissionPrefix}.update'))
  @UseInterceptors(FilesInterceptor('files'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a ${m.parentRoute} comment with attachment add/remove',
    operationId: 'update${stripController(m.className)}',
    responses: {
      200: { description: 'Comment updated successfully' },
      400: { description: 'Validation failed' },
      502: { description: 'File service upstream failure' },
    },
  } as any)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: Update${stripController(m.className)}Dto })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() rawBody: Record<string, unknown>,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    const parsed = Update${stripController(m.className)}BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parsed.error.errors,
      });
    }
    const body = parsed.data as {
      message?: string | null;
      type?: 'user' | 'system';
      remove_attachments?: string[];
    };

    if (files.length > MAX_FILES) {
      throw new BadRequestException(
        \`Too many files (max \${MAX_FILES}, received \${files.length})\`,
      );
    }
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          \`File "\${f.originalname}" exceeds max size of \${MAX_FILE_SIZE_BYTES} bytes\`,
        );
      }
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.mimetype)) {
        throw new BadRequestException(
          \`File "\${f.originalname}" has unsupported mime type "\${f.mimetype}"\`,
        );
      }
    }

    const removeTokens = body.remove_attachments ?? [];
    const hasMessage =
      typeof body.message === 'string' && body.message.trim().length > 0;
    const hasType = typeof body.type === 'string';
    if (!hasMessage && !hasType && files.length === 0 && removeTokens.length === 0) {
      throw new BadRequestException(
        'At least one of \\\`message\\\`, \\\`type\\\`, \\\`files\\\`, or \\\`remove_attachments\\\` must be provided',
      );
    }

    const { user_id } = ExtractRequestHeader(req);
    return this.${m.serviceProp}.update(
      id,
      {
        message: body.message ?? undefined,
        type: body.type,
        addFiles: files,
        removeFileTokens: removeTokens,
      },
      user_id,
      bu_code,
      version,
    );
  }

  @Delete(':bu_code/${m.prefix}/:id')
  @UseGuards(new AppIdGuard('${m.permissionPrefix}.delete'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a ${m.parentRoute} comment',
    operationId: 'delete${stripController(m.className)}',
    responses: {
      200: { description: 'Comment deleted successfully' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    const { user_id } = ExtractRequestHeader(req);
    return this.${m.serviceProp}.delete(id, user_id, bu_code, version);
  }

  @Post(':bu_code/${m.prefix}/:id/attachment')
  @UseGuards(new AppIdGuard('${m.permissionPrefix}.addAttachment'))
  @UseInterceptors(FilesInterceptor('files'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Add attachments to a ${m.parentRoute} comment',
    operationId: 'addAttachmentsTo${stripController(m.className)}',
    responses: {
      200: { description: 'Attachments added successfully' },
      400: { description: 'Validation failed' },
      502: { description: 'File service upstream failure' },
    },
  } as any)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: AddAttachmentsDto })
  @HttpCode(HttpStatus.OK)
  async addAttachment(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    if (files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }
    if (files.length > MAX_FILES) {
      throw new BadRequestException(
        \`Too many files (max \${MAX_FILES}, received \${files.length})\`,
      );
    }
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          \`File "\${f.originalname}" exceeds max size of \${MAX_FILE_SIZE_BYTES} bytes\`,
        );
      }
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.mimetype)) {
        throw new BadRequestException(
          \`File "\${f.originalname}" has unsupported mime type "\${f.mimetype}"\`,
        );
      }
    }

    const { user_id } = ExtractRequestHeader(req);
    return this.${m.serviceProp}.addAttachments(
      id,
      files,
      user_id,
      bu_code,
      version,
    );
  }

  @Delete(':bu_code/${m.prefix}/:id/attachment/:fileToken')
  @UseGuards(new AppIdGuard('${m.permissionPrefix}.removeAttachment'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Remove an attachment from a ${m.parentRoute} comment',
    operationId: 'removeAttachmentFrom${stripController(m.className)}',
    responses: {
      200: { description: 'Attachment removed successfully' },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async removeAttachment(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('fileToken') fileToken: string,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    const { user_id } = ExtractRequestHeader(req);
    return this.${m.serviceProp}.removeAttachment(id, fileToken, user_id, bu_code, version);
  }

  @Post(':bu_code/${m.prefix}/:${m.parentIdName}')
  @UseGuards(new AppIdGuard('${m.permissionPrefix}.createWithFiles'))
  @UseInterceptors(FilesInterceptor('files'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a ${m.parentRoute} comment with file uploads',
    operationId: 'create${stripController(m.className)}WithFiles',
    responses: {
      201: { description: 'Comment created with attachments' },
      400: { description: 'Validation failed' },
      502: { description: 'File service upstream failure' },
    },
  } as any)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadCommentWithFilesDto })
  @HttpCode(HttpStatus.CREATED)
  async createWithFiles(
    @Param('bu_code') bu_code: string,
    @Param('${m.parentIdName}', new ParseUUIDPipe({ version: '4' }))
    ${m.parentIdName}: string,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() rawBody: Record<string, unknown>,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'createWithFiles',
        bu_code,
        ${m.parentIdName},
        file_count: files.length,
      },
      ${m.className}.name,
    );
    const parsed = UploadCommentWithFilesBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parsed.error.errors,
      });
    }
    const body = parsed.data as {
      message?: string | null;
      type?: 'user' | 'system';
    };
    if (files.length > MAX_FILES) {
      throw new BadRequestException(
        \`Too many files (max \${MAX_FILES}, received \${files.length})\`,
      );
    }
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          \`File "\${f.originalname}" exceeds max size of \${MAX_FILE_SIZE_BYTES} bytes\`,
        );
      }
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.mimetype)) {
        throw new BadRequestException(
          \`File "\${f.originalname}" has unsupported mime type "\${f.mimetype}"\`,
        );
      }
    }

    const hasMessage =
      typeof body.message === 'string' && body.message.trim().length > 0;
    if (!hasMessage && files.length === 0) {
      throw new BadRequestException(
        'At least one of \\\`message\\\` or \\\`files\\\` must be provided',
      );
    }

    const { user_id } = ExtractRequestHeader(req);
    return this.${m.serviceProp}.createWithFiles(
      files,
      { ...body, ${m.parentIdName} },
      user_id,
      bu_code,
      version,
    );
  }
}
`;
}

function stripController(className: string): string {
  return className.replace('Controller', '');
}

function buildService(m: ModuleInfo): string {
  const cmdAllByParent = `${m.prefix}.find-all-by-${m.parentRoute}-id`;
  return `import {
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

export interface UploadedAttachment {
  fileName: string;
  fileToken: string;
  fileUrl: string;
  contentType: string;
  size: number;
}

@Injectable()
export class ${m.serviceClassName} {
  private readonly logger: BackendLogger = new BackendLogger(
    ${m.serviceClassName}.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly businessService: ClientProxy,
    @Inject('FILE_SERVICE') private readonly fileService: ClientProxy,
  ) {}

  async findAllByParentId(
    ${m.parentIdName}: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: '${cmdAllByParent}', service: '${m.cmdServiceName}' },
      { ${m.parentIdName}, user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.successWithPaginate(response.data, response.paginate);
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
          ${m.serviceClassName}.name,
        );
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
        const firstReason = (failures[0] as PromiseRejectedResult).reason;
        const msg = firstReason instanceof Error ? firstReason.message : String(firstReason);
        throw new BadGatewayException(\`File upload failed: \${msg}\`);
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
          ${m.serviceClassName}.name,
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
      { cmd: '${m.prefix}.update', service: '${m.cmdServiceName}' },
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
          ${m.serviceClassName}.name,
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
    return ResponseLib.success(response.data);
  }

  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const findRes: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: '${m.prefix}.find-by-id', service: '${m.cmdServiceName}' },
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
          ${m.serviceClassName}.name,
        );
      }
    }

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: '${m.prefix}.delete', service: '${m.cmdServiceName}' },
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
        ${m.serviceClassName}.name,
      );
      await Promise.all(
        uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
      );
      const firstReason = (failures[0] as PromiseRejectedResult).reason;
      const msg = firstReason instanceof Error ? firstReason.message : String(firstReason);
      throw new BadGatewayException(\`File upload failed: \${msg}\`);
    }

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: '${m.prefix}.add-attachment', service: '${m.cmdServiceName}' },
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
        ${m.serviceClassName}.name,
      );
      await Promise.all(
        uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
      );
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }
    return ResponseLib.success(response.data);
  }

  async removeAttachment(
    id: string,
    fileToken: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: '${m.prefix}.remove-attachment', service: '${m.cmdServiceName}' },
      { id, fileToken, user_id, bu_code, version, ...getGatewayRequestContext() },
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

  async createWithFiles(
    files: Express.Multer.File[],
    dto: {
      ${m.parentIdName}: string;
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
            ${m.parentIdName}: dto.${m.parentIdName},
            uploaded_count: uploaded.length,
            failed_count: failures.length,
          },
          ${m.serviceClassName}.name,
        );
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
        const firstReason = (failures[0] as PromiseRejectedResult).reason;
        const msg = firstReason instanceof Error ? firstReason.message : String(firstReason);
        throw new BadGatewayException(\`File upload failed: \${msg}\`);
      }
    }

    const data = {
      ${m.parentIdName}: dto.${m.parentIdName},
      message: dto.message ?? null,
      type: dto.type ?? 'user',
      attachments: uploaded,
    };

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: '${m.prefix}.create', service: '${m.cmdServiceName}' },
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
            ${m.parentIdName}: dto.${m.parentIdName},
            uploaded_count: uploaded.length,
            create_status: response.response.status,
          },
          ${m.serviceClassName}.name,
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
    return ResponseLib.created(response.data);
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
      fileUrl: '',
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
          ${m.serviceClassName}.name,
        );
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(
        { function: 'deleteFile', fileToken, error: (err as Error).message },
        ${m.serviceClassName}.name,
      );
      return false;
    }
  }
}
`;
}

function buildDto(m: ModuleInfo): string {
  const baseName = stripController(m.className); // e.g., PurchaseOrderComment
  return `import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const AttachmentSchema = z.object({
  fileName: z.string(),
  fileToken: z.string(),
  fileUrl: z.string().optional(),
  contentType: z.string(),
  size: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Multipart body schema for PATCH update.
 * - \`message\` and \`type\` are plain text fields.
 * - \`remove_attachments\` is sent as a JSON-encoded string array of fileTokens
 *   (multipart cannot carry nested JSON natively).
 * - New files arrive via the \`files\` field (handled by FilesInterceptor).
 */
export const Update${baseName}BodySchema = z.object({
  message: z.string().max(4000).optional().nullable(),
  type: z.enum(['user', 'system']).optional(),
  remove_attachments: z
    .preprocess((v) => {
      if (typeof v !== 'string') return v;
      const trimmed = v.trim();
      if (trimmed === '') return undefined;
      try {
        return JSON.parse(trimmed);
      } catch {
        return v;
      }
    }, z.array(z.string().min(1)).optional())
    .optional(),
});

export type Update${baseName}Body = z.infer<typeof Update${baseName}BodySchema>;

export class Update${baseName}Dto {
  @ApiPropertyOptional({
    description: 'Updated comment message (≤ 4000 chars)',
    example: 'Updated comment',
    nullable: true,
  })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'Comment type',
    enum: ['user', 'system'],
  })
  type?: 'user' | 'system';

  @ApiPropertyOptional({
    description:
      'JSON-encoded string array of fileTokens to remove, e.g. \\\`["tok-1","tok-2"]\\\`',
    example: '["tok-1","tok-2"]',
  })
  remove_attachments?: string;

  @ApiPropertyOptional({
    description:
      'New attachments to add (0–10 files). Allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf. Max 10 MB each.',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files?: unknown[];
}

export class Update${baseName}BodyDto extends createZodDto(
  Update${baseName}BodySchema,
) {}

/**
 * Swagger-only DTO for POST \`:id/attachment\` (multipart/form-data).
 * Runtime validation: count/size/mime checks performed in the controller.
 */
export class AddAttachmentsDto {
  @ApiPropertyOptional({
    description:
      'Attachments to add (1–10 files). Allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf. Max 10 MB each.',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files?: unknown[];
}
`;
}

function buildUploadDto(m: ModuleInfo): string {
  return `import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const UploadCommentWithFilesBodySchema = z.object({
  message: z.string().max(4000).optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
});

export type UploadCommentWithFilesBody = z.infer<typeof UploadCommentWithFilesBodySchema>;

export class UploadCommentWithFilesBodyDto extends createZodDto(
  UploadCommentWithFilesBodySchema,
) {}

/**
 * Swagger-only DTO describing the multipart/form-data shape.
 * Not used for runtime validation (the Zod schema above handles body fields,
 * and the FilesInterceptor handles \`files\`).
 */
export class UploadCommentWithFilesDto {
  @ApiPropertyOptional({
    description: 'Comment message (≤ 4000 chars). Required if no files.',
    example: 'Comment message',
    nullable: true,
  })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'Comment type',
    enum: ['user', 'system'],
    default: 'user',
  })
  type?: 'user' | 'system';

  @ApiPropertyOptional({
    description:
      'Attachments (0–10 files). Allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf. Max 10 MB each.',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files?: unknown[];
}
`;
}

// --- main ---
const folders = readdirSync(gatewayApp, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith('-comment'))
  .map((d) => d.name)
  .filter((n) => !ALREADY_DONE.has(n))
  .sort();

console.log(`Found ${folders.length} comment modules to process${APPLY ? ' (APPLY mode)' : ' (dry-run)'}`);
const failed: Array<{ folder: string; reason: string }> = [];

for (const folder of folders) {
  const info = detect(folder);
  if (!info) {
    failed.push({ folder, reason: 'failed to detect module info' });
    continue;
  }

  const ctrlPath = join(gatewayApp, folder, `${folder}.controller.ts`);
  const svcPath = join(gatewayApp, folder, `${folder}.service.ts`);
  const dtoPath = join(gatewayApp, folder, 'dto', `${folder}.dto.ts`);
  const uploadDtoPath = join(gatewayApp, folder, 'dto', 'upload-comment-with-files.dto.ts');

  const newCtrl = buildController(info);
  const newSvc = buildService(info);
  const newDto = buildDto(info);
  const newUploadDto = buildUploadDto(info);

  console.log(
    `  [${APPLY ? 'WRITE' : 'PREVIEW'}] ${folder}  parent=${info.parentRoute}/${info.parentIdName}  cmdSvc=${info.cmdServiceName}`,
  );

  if (APPLY) {
    writeFileSync(ctrlPath, newCtrl);
    writeFileSync(svcPath, newSvc);
    writeFileSync(dtoPath, newDto);
    if (existsSync(uploadDtoPath)) writeFileSync(uploadDtoPath, newUploadDto);
  }
}

if (failed.length > 0) {
  console.log('\nFailed to detect:');
  for (const f of failed) console.log(`  - ${f.folder}: ${f.reason}`);
}
console.log(`\nDone. ${folders.length - failed.length} modules ${APPLY ? 'rewritten' : 'previewed'}.`);
