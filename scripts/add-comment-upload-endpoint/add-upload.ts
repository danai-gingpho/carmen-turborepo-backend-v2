#!/usr/bin/env bun
/**
 * Adds POST :bu_code/<comment-module>/upload endpoints to every
 * application/*-comment module in backend-gateway, mirroring the
 * existing physical-count-detail-comment implementation.
 *
 * For each module the script:
 *   1. Writes dto/upload-comment-with-files.dto.ts (overwrites if exists).
 *   2. Patches the controller: imports + constants + upload method.
 *   3. Patches the service: imports + FILE_SERVICE inject + UploadedAttachment + createWithFiles/uploadFile/deleteFile.
 *   4. Patches the module: registers FILE_SERVICE alongside BUSINESS_SERVICE.
 *
 * The script is idempotent — re-running skips modules already migrated.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';

const APP_DIR = join(
  __dirname,
  '..',
  '..',
  'apps',
  'backend-gateway',
  'src',
  'application',
);

const SKIP = new Set<string>(['physical-count-detail-comment']);

interface ModuleInfo {
  dir: string;
  moduleName: string; // kebab e.g. currency-comment
  parentRes: string; // kebab e.g. currency
  parentId: string; // snake e.g. currency_id
  pascal: string; // PascalCase e.g. CurrencyComment
  camel: string; // camelCase e.g. currencyComment
  serviceClass: string; // CurrencyCommentService
  serviceMember: string; // currencyCommentService
  controllerClass: string; // CurrencyCommentController
}

const kebabToPascal = (s: string) =>
  s
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');

const kebabToCamel = (s: string) => {
  const p = kebabToPascal(s);
  return p[0].toLowerCase() + p.slice(1);
};

const collectModules = (): ModuleInfo[] => {
  const dirs = readdirSync(APP_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith('-comment'))
    .map((d) => d.name)
    .sort();

  const modules: ModuleInfo[] = [];
  for (const moduleName of dirs) {
    if (SKIP.has(moduleName)) continue;
    const dir = join(APP_DIR, moduleName);
    const dtoPath = join(dir, 'dto', `${moduleName}.dto.ts`);
    if (!existsSync(dtoPath)) {
      console.warn(`SKIP ${moduleName}: missing ${dtoPath}`);
      continue;
    }
    const dtoText = readFileSync(dtoPath, 'utf8');
    const m = dtoText.match(/([a-z_]+_id):\s*z\.string\(\)\.uuid\(\)/);
    if (!m) {
      console.warn(`SKIP ${moduleName}: no parent_id uuid in DTO`);
      continue;
    }
    const parentId = m[1];
    const parentRes = moduleName.replace(/-comment$/, '');
    const pascal = kebabToPascal(moduleName);
    const camel = kebabToCamel(moduleName);
    modules.push({
      dir,
      moduleName,
      parentRes,
      parentId,
      pascal,
      camel,
      serviceClass: `${pascal}Service`,
      serviceMember: `${camel}Service`,
      controllerClass: `${pascal}Controller`,
    });
  }
  return modules;
};

const dtoTemplate = (m: ModuleInfo) => `import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const UploadCommentWithFilesBodySchema = z.object({
  ${m.parentId}: z.string().uuid(),
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
  @ApiProperty({
    description: 'The ID of the ${m.parentRes}',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  ${m.parentId}: string;

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

// ---- Controller patch ----------------------------------------------------

const ensureNamedImport = (
  source: string,
  fromModule: string,
  names: string[],
): string => {
  const importRe = new RegExp(
    `import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${fromModule.replace(
      /[/.]/g,
      (c) => '\\' + c,
    )}['"]\\s*;`,
    'm',
  );
  const m = source.match(importRe);
  if (m) {
    const existing = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...existing, ...names])).sort();
    const block = `import {\n  ${merged.join(',\n  ')},\n} from '${fromModule}';`;
    return source.replace(importRe, block);
  }
  // No existing import — add at top after other imports
  const insertAfter = source.match(/^(import [^\n]*;\s*\n)+/m);
  const block = `import { ${names.join(', ')} } from '${fromModule}';\n`;
  if (insertAfter) {
    const idx = insertAfter.index! + insertAfter[0].length;
    return source.slice(0, idx) + block + source.slice(idx);
  }
  return block + source;
};

const controllerUploadConstants = `const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;

`;

const controllerUploadMethod = (m: ModuleInfo) => `
  @Post(':bu_code/${m.moduleName}/upload')
  @UseGuards(new AppIdGuard('${m.camel}.createWithFiles'))
  @UseInterceptors(FilesInterceptor('files'))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a ${m.parentRes} comment with file uploads',
    operationId: 'create${m.pascal}WithFiles',
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
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() rawBody: Record<string, unknown>,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    const parsed = UploadCommentWithFilesBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid request body',
        errors: parsed.error.errors,
      });
    }
    const body = parsed.data as {
      ${m.parentId}: string;
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
        'At least one of \`message\` or \`files\` must be provided',
      );
    }

    const { user_id } = ExtractRequestHeader(req);
    return this.${m.serviceMember}.createWithFiles(
      files,
      body,
      user_id,
      bu_code,
      version,
    );
  }
`;

const patchController = (m: ModuleInfo) => {
  const file = join(m.dir, `${m.moduleName}.controller.ts`);
  let src = readFileSync(file, 'utf8');
  if (src.includes('createWithFiles')) {
    console.log(`  controller already migrated: ${m.moduleName}`);
    return;
  }

  src = ensureNamedImport(src, '@nestjs/common', [
    'BadRequestException',
    'UploadedFiles',
    'UseInterceptors',
  ]);
  src = ensureNamedImport(src, '@nestjs/swagger', ['ApiBody', 'ApiConsumes']);
  src = ensureNamedImport(src, '@nestjs/platform-express', ['FilesInterceptor']);
  src = ensureNamedImport(src, './dto/upload-comment-with-files.dto', [
    'UploadCommentWithFilesBodySchema',
    'UploadCommentWithFilesDto',
  ]);

  // Add constants block before the @Controller decorator if not present
  if (!src.includes('MAX_FILE_SIZE_BYTES')) {
    src = src.replace(/(@Controller\(['"]api['"]\))/, (_, p1) => `${controllerUploadConstants}${p1}`);
  }

  // Insert upload method before final closing brace of the class.
  // Find the class block and insert before its terminating '}'.
  const classRe = new RegExp(
    `(export class ${m.controllerClass}[\\s\\S]*?)\\n\\}\\s*$`,
    'm',
  );
  if (!classRe.test(src)) {
    throw new Error(`Could not locate ${m.controllerClass} block in ${file}`);
  }
  src = src.replace(classRe, `$1${controllerUploadMethod(m)}}\n`);

  writeFileSync(file, src);
  console.log(`  patched controller: ${m.moduleName}`);
};

// ---- Service patch -------------------------------------------------------

const serviceMethods = (m: ModuleInfo) => `
  async createWithFiles(
    files: Express.Multer.File[],
    dto: {
      ${m.parentId}: string;
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
        (s): s is PromiseFulfilledResult<UploadedAttachment> =>
          s.status === 'fulfilled',
      );

      uploaded.push(...successes.map((s) => s.value));

      if (failures.length > 0) {
        this.logger.warn(
          {
            function: 'createWithFiles',
            phase: 'upload-rollback',
            bu_code,
            ${m.parentId}: dto.${m.parentId},
            uploaded_count: uploaded.length,
            failed_count: failures.length,
          },
          ${m.serviceClass}.name,
        );
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
        const firstReason = (failures[0] as PromiseRejectedResult).reason;
        const msg =
          firstReason instanceof Error ? firstReason.message : String(firstReason);
        throw new BadGatewayException(\`File upload failed: \${msg}\`);
      }
    }

    const data = {
      ${m.parentId}: dto.${m.parentId},
      message: dto.message ?? null,
      type: dto.type ?? 'user',
      attachments: uploaded,
    };

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: '${m.moduleName}.create', service: '${m.moduleName}' },
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
            ${m.parentId}: dto.${m.parentId},
            uploaded_count: uploaded.length,
            create_status: response.response.status,
          },
          ${m.serviceClass}.name,
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
          ${m.serviceClass}.name,
        );
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(
        { function: 'deleteFile', fileToken, error: (err as Error).message },
        ${m.serviceClass}.name,
      );
      return false;
    }
  }
`;

const uploadedAttachmentInterface = `export interface UploadedAttachment {
  fileName: string;
  fileToken: string;
  fileUrl: string;
  contentType: string;
  size: number;
}

`;

const patchService = (m: ModuleInfo) => {
  const file = join(m.dir, `${m.moduleName}.service.ts`);
  let src = readFileSync(file, 'utf8');
  if (src.includes('createWithFiles')) {
    console.log(`  service already migrated: ${m.moduleName}`);
    return;
  }

  src = ensureNamedImport(src, '@nestjs/common', [
    'BadGatewayException',
    'HttpStatus',
    'Inject',
    'Injectable',
  ]);

  // Add UploadedAttachment interface before @Injectable() if missing.
  if (!src.includes('UploadedAttachment')) {
    src = src.replace(/(@Injectable\(\))/, `${uploadedAttachmentInterface}$1`);
  }

  // Add FILE_SERVICE inject. Match the constructor's BUSINESS_SERVICE inject and
  // append a second inject if not already present.
  if (!src.includes("'FILE_SERVICE'")) {
    // Two formats observed:
    //   @Inject('BUSINESS_SERVICE') private readonly businessService: ClientProxy
    //   @Inject('BUSINESS_SERVICE')\n    private readonly businessService: ClientProxy
    src = src.replace(
      /(@Inject\(\s*'BUSINESS_SERVICE'\s*\)\s*(?:\n\s*)?private readonly businessService:\s*ClientProxy)(\s*,?)(\s*\)\s*\{\s*\}\s*)/,
      (_match, p1, _p2, p3) =>
        `${p1},\n    @Inject('FILE_SERVICE') private readonly fileService: ClientProxy,${p3}`,
    );
  }

  // Insert new methods before final closing brace of class.
  const classRe = new RegExp(
    `(export class ${m.serviceClass}[\\s\\S]*?)\\n\\}\\s*$`,
    'm',
  );
  if (!classRe.test(src)) {
    throw new Error(`Could not locate ${m.serviceClass} block in ${file}`);
  }
  src = src.replace(classRe, `$1${serviceMethods(m)}}\n`);

  writeFileSync(file, src);
  console.log(`  patched service: ${m.moduleName}`);
};

// ---- Module patch --------------------------------------------------------

const patchModule = (m: ModuleInfo) => {
  const file = join(m.dir, `${m.moduleName}.module.ts`);
  let src = readFileSync(file, 'utf8');
  if (src.includes("'FILE_SERVICE'")) {
    console.log(`  module already migrated: ${m.moduleName}`);
    return;
  }

  // Replace the array passed to ClientsModule.register with one that includes both
  // BUSINESS_SERVICE and FILE_SERVICE entries.
  const replacement = `ClientsModule.register([
      {
        name: 'BUSINESS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
      {
        name: 'FILE_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.FILE_SERVICE_HOST,
          port: Number(envConfig.FILE_SERVICE_TCP_PORT),
        },
      },
    ])`;

  const re = /ClientsModule\.register\(\s*\[[\s\S]*?\]\s*\)/m;
  if (!re.test(src)) {
    throw new Error(`No ClientsModule.register in ${file}`);
  }
  src = src.replace(re, replacement);

  writeFileSync(file, src);
  console.log(`  patched module: ${m.moduleName}`);
};

// ---- Driver --------------------------------------------------------------

const main = () => {
  const modules = collectModules();
  console.log(`Found ${modules.length} comment modules to migrate.`);
  for (const m of modules) {
    console.log(`> ${m.moduleName} (parent_id=${m.parentId})`);
    const dtoFile = join(m.dir, 'dto', 'upload-comment-with-files.dto.ts');
    writeFileSync(dtoFile, dtoTemplate(m));
    console.log(`  wrote dto: ${basename(dtoFile)}`);
    patchController(m);
    patchService(m);
    patchModule(m);
  }
  console.log('Done.');
};

main();
