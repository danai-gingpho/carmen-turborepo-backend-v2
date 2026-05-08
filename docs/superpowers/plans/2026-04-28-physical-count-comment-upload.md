# Physical Count Detail Comment — Direct Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-request multipart endpoint that accepts a comment message + multiple attachment files (image/pdf), uploads files to MinIO via `micro-file`, and creates a `tb_physical_count_detail_comment` row, all in one HTTP call.

**Architecture:** Gateway-only change. Add a new `POST /api/{bu_code}/physical-count-detail-comment/upload` (multipart) handler that fans out file uploads to `FILE_SERVICE` over TCP in parallel, builds the `attachments[]` array, then forwards to the existing `BUSINESS_SERVICE` create command. Implements best-effort rollback (delete uploaded files) when comment creation fails. No DB schema, no `micro-business`, no `micro-file` changes.

**Tech Stack:** NestJS 10, TypeScript, `@nestjs/platform-express` (`FilesInterceptor`), `@nestjs/microservices` (TCP `ClientProxy`), `nestjs-zod` for body validation, Jest for tests, Bruno for API examples.

**Reference spec:** `docs/superpowers/specs/2026-04-28-physical-count-comment-upload-design.md`

---

## File Structure

**Create:**
- `apps/backend-gateway/src/application/physical-count-detail-comment/dto/upload-comment-with-files.dto.ts` — Zod body schema + Swagger DTO class for multipart shape
- `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.spec.ts` — service unit tests
- `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.spec.ts` — controller validation tests
- `apps/bruno/carmen-inventory/inventory/physical-count-detail-comment/01 - Create With Files.bru` — multipart request example

**Modify:**
- `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.module.ts` — register `FILE_SERVICE` client alongside `BUSINESS_SERVICE`
- `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts` — inject `FILE_SERVICE`, add `uploadFile`, `deleteFile`, `createWithFiles` methods
- `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.ts` — add `createWithFiles` endpoint with `FilesInterceptor`
- `apps/backend-gateway/src/application/physical-count-detail-comment/swagger/request.ts` — add `UploadCommentWithFilesRequest` swagger constant (if file follows the pattern)

---

## Constants Used Across Tasks

These values appear in multiple tasks. Keep them in sync:

```ts
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;
```

---

## Task 1: Register FILE_SERVICE in the module

**Files:**
- Modify: `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.module.ts`

- [ ] **Step 1: Replace module file with FILE_SERVICE client added**

Open `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.module.ts` and replace its contents with:

```ts
import { Module } from '@nestjs/common';
import { PhysicalCountDetailCommentService } from './physical-count-detail-comment.service';
import { PhysicalCountDetailCommentController } from './physical-count-detail-comment.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
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
    ]),
  ],
  controllers: [PhysicalCountDetailCommentController],
  providers: [PhysicalCountDetailCommentService],
})
export class PhysicalCountDetailCommentModule {}
```

- [ ] **Step 2: Confirm gateway type-checks**

Run: `cd apps/backend-gateway && bun run check-types`
Expected: PASS (no errors related to `FILE_SERVICE_HOST` / `FILE_SERVICE_TCP_PORT` — these already exist in `config.env.ts`).

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.module.ts
git commit -m "feat(gateway): register FILE_SERVICE in physical-count-detail-comment module"
```

---

## Task 2: DTO for multipart body

**Files:**
- Create: `apps/backend-gateway/src/application/physical-count-detail-comment/dto/upload-comment-with-files.dto.ts`

- [ ] **Step 1: Create the DTO file**

Create `apps/backend-gateway/src/application/physical-count-detail-comment/dto/upload-comment-with-files.dto.ts` with:

```ts
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const UploadCommentWithFilesBodySchema = z.object({
  physical_count_detail_id: z.string().uuid(),
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
 * and the FilesInterceptor handles `files`).
 */
export class UploadCommentWithFilesDto {
  @ApiProperty({
    description: 'The ID of the physical-count-detail',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  physical_count_detail_id: string;

  @ApiPropertyOptional({
    description: 'Comment message (≤ 4000 chars). Required if no files.',
    example: 'Damage on outer carton',
  })
  message?: string;

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
```

- [ ] **Step 2: Confirm type-check**

Run: `cd apps/backend-gateway && bun run check-types`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/src/application/physical-count-detail-comment/dto/upload-comment-with-files.dto.ts
git commit -m "feat(gateway): add UploadCommentWithFiles DTOs"
```

---

## Task 3: Service — `uploadFile` and `deleteFile` helpers (TDD)

**Files:**
- Create: `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.spec.ts`
- Modify: `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts`

- [ ] **Step 1: Create the spec with tests for both helpers (failing)**

Create `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.spec.ts` with:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { PhysicalCountDetailCommentService } from './physical-count-detail-comment.service';

const mockBusinessService = {
  send: jest.fn(),
  emit: jest.fn(),
};

const mockFileService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('PhysicalCountDetailCommentService', () => {
  let service: PhysicalCountDetailCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalCountDetailCommentService,
        { provide: 'BUSINESS_SERVICE', useValue: mockBusinessService },
        { provide: 'FILE_SERVICE', useValue: mockFileService },
      ],
    }).compile();

    service = module.get<PhysicalCountDetailCommentService>(
      PhysicalCountDetailCommentService,
    );
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('sends file.upload command with base64 buffer and returns mapped attachment', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({
          success: true,
          response: { status: 200 },
          data: {
            fileToken: 'tok-1',
            fileName: 'a.jpg',
            fileUrl: 'https://minio/a.jpg',
            contentType: 'image/jpeg',
            size: 123,
          },
        }),
      );

      const buf = Buffer.from('hello');
      const result = await service.uploadFile(
        {
          originalname: 'a.jpg',
          mimetype: 'image/jpeg',
          buffer: buf,
          size: buf.length,
        } as Express.Multer.File,
        'user-1',
        'HQ-001',
      );

      expect(mockFileService.send).toHaveBeenCalledWith(
        { cmd: 'file.upload', service: 'files' },
        expect.objectContaining({
          fileName: 'a.jpg',
          mimeType: 'image/jpeg',
          buffer: buf.toString('base64'),
          bu_code: 'HQ-001',
          user_id: 'user-1',
        }),
      );
      expect(result).toEqual({
        fileName: 'a.jpg',
        fileToken: 'tok-1',
        fileUrl: 'https://minio/a.jpg',
        contentType: 'image/jpeg',
        size: 123,
      });
    });

    it('throws when file service returns failure', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({ success: false, response: { status: 500, message: 'boom' } }),
      );
      await expect(
        service.uploadFile(
          {
            originalname: 'a.jpg',
            mimetype: 'image/jpeg',
            buffer: Buffer.from('x'),
            size: 1,
          } as Express.Multer.File,
          'user-1',
          'HQ-001',
        ),
      ).rejects.toThrow(/boom/);
    });
  });

  describe('deleteFile', () => {
    it('sends file.delete and resolves true on success', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({ success: true, response: { status: 200 } }),
      );
      const ok = await service.deleteFile('tok-1', 'user-1', 'HQ-001');
      expect(mockFileService.send).toHaveBeenCalledWith(
        { cmd: 'file.delete', service: 'files' },
        expect.objectContaining({ fileToken: 'tok-1', user_id: 'user-1', bu_code: 'HQ-001' }),
      );
      expect(ok).toBe(true);
    });

    it('resolves false on failure (best-effort)', async () => {
      mockFileService.send.mockReturnValueOnce(
        of({ success: false, response: { status: 500, message: 'nope' } }),
      );
      const ok = await service.deleteFile('tok-1', 'user-1', 'HQ-001');
      expect(ok).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `cd apps/backend-gateway && bunx jest physical-count-detail-comment.service.spec --no-coverage`
Expected: FAIL — "uploadFile is not a function" / "deleteFile is not a function".

- [ ] **Step 3: Add helpers to the service**

Open `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts` and replace its contents with:

```ts
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
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
export class PhysicalCountDetailCommentService {
  private readonly logger: BackendLogger = new BackendLogger(
    PhysicalCountDetailCommentService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly businessService: ClientProxy,
    @Inject('FILE_SERVICE') private readonly fileService: ClientProxy,
  ) {}

  async findById(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'physical-count-detail-comment.find-by-id', service: 'physical-count-detail-comment' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK)
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    return ResponseLib.success(response.data);
  }

  async findAllByPhysicalCountDetailId(
    physical_count_detail_id: string,
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'physical-count-detail-comment.find-all-by-physical-count-detail-id', service: 'physical-count-detail-comment' },
      { physical_count_detail_id, user_id, bu_code, paginate, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK)
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    return ResponseLib.successWithPaginate(response.data, response.paginate);
  }

  async create(
    data: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'physical-count-detail-comment.create', service: 'physical-count-detail-comment' },
      { data, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED)
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    return ResponseLib.created(response.data);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'physical-count-detail-comment.update', service: 'physical-count-detail-comment' },
      { id, data, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK)
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    return ResponseLib.success(response.data);
  }

  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'physical-count-detail-comment.delete', service: 'physical-count-detail-comment' },
      { id, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK)
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    return ResponseLib.success(response.data);
  }

  async addAttachment(
    id: string,
    attachment: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'physical-count-detail-comment.add-attachment', service: 'physical-count-detail-comment' },
      { id, attachment, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK)
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
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
      { cmd: 'physical-count-detail-comment.remove-attachment', service: 'physical-count-detail-comment' },
      { id, fileToken, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK)
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    return ResponseLib.success(response.data);
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
    const response = await firstValueFrom(res);
    if (!response.success) {
      const msg = response.response?.message ?? 'File upload failed';
      throw new Error(msg);
    }
    const data = response.data as Partial<UploadedAttachment> | undefined;
    return {
      fileName: data?.fileName ?? file.originalname,
      fileToken: String(data?.fileToken ?? ''),
      fileUrl: String(data?.fileUrl ?? ''),
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
      const response = await firstValueFrom(res);
      if (!response.success) {
        this.logger.warn(
          {
            function: 'deleteFile',
            fileToken,
            reason: response.response?.message,
          },
          PhysicalCountDetailCommentService.name,
        );
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(
        { function: 'deleteFile', fileToken, error: (err as Error).message },
        PhysicalCountDetailCommentService.name,
      );
      return false;
    }
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd apps/backend-gateway && bunx jest physical-count-detail-comment.service.spec --no-coverage`
Expected: PASS — both `uploadFile` describe blocks and both `deleteFile` describe blocks green.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.spec.ts
git commit -m "feat(gateway): add uploadFile/deleteFile helpers to physical-count-detail-comment service"
```

---

## Task 4: Service — `createWithFiles` orchestration (TDD)

**Files:**
- Modify: `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.spec.ts`
- Modify: `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts`

- [ ] **Step 1: Append the failing tests for `createWithFiles`**

Append the following describe block to `physical-count-detail-comment.service.spec.ts` (inside the top-level `describe('PhysicalCountDetailCommentService', …)` — i.e., before its closing `});`):

```ts
  describe('createWithFiles', () => {
    const mkFile = (name: string, mime = 'image/jpeg', size = 100) =>
      ({
        originalname: name,
        mimetype: mime,
        buffer: Buffer.from(name),
        size,
      }) as Express.Multer.File;

    const dto = {
      physical_count_detail_id: '11111111-1111-1111-1111-111111111111',
      message: 'damage',
      type: 'user' as const,
    };

    it('uploads files in parallel and creates comment, returns created result', async () => {
      mockFileService.send
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              fileToken: 'tok-1',
              fileName: 'a.jpg',
              fileUrl: 'u/a',
              contentType: 'image/jpeg',
              size: 1,
            },
          }),
        )
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              fileToken: 'tok-2',
              fileName: 'b.jpg',
              fileUrl: 'u/b',
              contentType: 'image/jpeg',
              size: 2,
            },
          }),
        );

      mockBusinessService.send.mockReturnValueOnce(
        of({
          success: true,
          response: { status: 201 },
          data: { id: 'c-1' },
        }),
      );

      const result = await service.createWithFiles(
        [mkFile('a.jpg'), mkFile('b.jpg')],
        dto,
        'user-1',
        'HQ-001',
        'latest',
      );

      expect(mockFileService.send).toHaveBeenCalledTimes(2);
      expect(mockBusinessService.send).toHaveBeenCalledWith(
        { cmd: 'physical-count-detail-comment.create', service: 'physical-count-detail-comment' },
        expect.objectContaining({
          data: expect.objectContaining({
            physical_count_detail_id: dto.physical_count_detail_id,
            message: 'damage',
            type: 'user',
            attachments: [
              expect.objectContaining({ fileToken: 'tok-1' }),
              expect.objectContaining({ fileToken: 'tok-2' }),
            ],
          }),
          user_id: 'user-1',
          bu_code: 'HQ-001',
        }),
      );
      // ResponseLib.created wraps data; just assert it returned something truthy
      expect(result).toBeDefined();
    });

    it('zero files + message: skips upload, calls create with empty attachments', async () => {
      mockBusinessService.send.mockReturnValueOnce(
        of({
          success: true,
          response: { status: 201 },
          data: { id: 'c-1' },
        }),
      );

      await service.createWithFiles([], dto, 'user-1', 'HQ-001', 'latest');

      expect(mockFileService.send).not.toHaveBeenCalled();
      expect(mockBusinessService.send).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: expect.objectContaining({ attachments: [] }),
        }),
      );
    });

    it('rolls back uploaded files when one upload fails', async () => {
      // first upload ok, second fails
      mockFileService.send
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              fileToken: 'tok-1',
              fileName: 'a.jpg',
              fileUrl: 'u/a',
              contentType: 'image/jpeg',
              size: 1,
            },
          }),
        )
        .mockReturnValueOnce(
          of({ success: false, response: { status: 500, message: 'boom' } }),
        )
        // delete call for tok-1
        .mockReturnValueOnce(
          of({ success: true, response: { status: 200 } }),
        );

      await expect(
        service.createWithFiles(
          [mkFile('a.jpg'), mkFile('b.jpg')],
          dto,
          'user-1',
          'HQ-001',
          'latest',
        ),
      ).rejects.toThrow();

      // expect a delete call with tok-1
      const deleteCall = mockFileService.send.mock.calls.find(
        ([pattern]) => pattern.cmd === 'file.delete',
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall[1]).toEqual(
        expect.objectContaining({ fileToken: 'tok-1' }),
      );

      expect(mockBusinessService.send).not.toHaveBeenCalled();
    });

    it('rolls back uploaded files when comment create fails', async () => {
      mockFileService.send
        .mockReturnValueOnce(
          of({
            success: true,
            response: { status: 200 },
            data: {
              fileToken: 'tok-1',
              fileName: 'a.jpg',
              fileUrl: 'u/a',
              contentType: 'image/jpeg',
              size: 1,
            },
          }),
        )
        .mockReturnValueOnce(
          of({ success: true, response: { status: 200 } }), // delete tok-1
        );

      mockBusinessService.send.mockReturnValueOnce(
        of({ success: false, response: { status: 404, message: 'not found' } }),
      );

      const result = await service.createWithFiles(
        [mkFile('a.jpg')],
        dto,
        'user-1',
        'HQ-001',
        'latest',
      );

      // result should be a Result.error (truthy object). assert delete happened.
      const deleteCall = mockFileService.send.mock.calls.find(
        ([pattern]) => pattern.cmd === 'file.delete',
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall[1]).toEqual(
        expect.objectContaining({ fileToken: 'tok-1' }),
      );
      expect(result).toBeDefined();
    });
  });
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `cd apps/backend-gateway && bunx jest physical-count-detail-comment.service.spec --no-coverage`
Expected: FAIL — `service.createWithFiles is not a function`.

- [ ] **Step 3: Add `createWithFiles` to the service**

Open `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts` and add this method inside the class (e.g. after `removeAttachment`, before the closing `}`):

```ts
  async createWithFiles(
    files: Express.Multer.File[],
    dto: {
      physical_count_detail_id: string;
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
        // rollback any successful uploads
        await Promise.all(
          uploaded.map((a) => this.deleteFile(a.fileToken, user_id, bu_code)),
        );
        const firstReason = (failures[0] as PromiseRejectedResult).reason;
        const msg =
          firstReason instanceof Error ? firstReason.message : String(firstReason);
        throw new Error(`File upload failed: ${msg}`);
      }
    }

    const data = {
      physical_count_detail_id: dto.physical_count_detail_id,
      message: dto.message ?? null,
      type: dto.type ?? 'user',
      attachments: uploaded,
    };

    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'physical-count-detail-comment.create', service: 'physical-count-detail-comment' },
      { data, user_id, bu_code, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      // rollback uploaded files since the comment row was not created
      if (uploaded.length > 0) {
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
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `cd apps/backend-gateway && bunx jest physical-count-detail-comment.service.spec --no-coverage`
Expected: PASS — all 4 `createWithFiles` cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.spec.ts
git commit -m "feat(gateway): add createWithFiles to physical-count-detail-comment service"
```

---

## Task 5: Controller — multipart endpoint with validation

**Files:**
- Modify: `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.ts`

- [ ] **Step 1: Add imports**

In `physical-count-detail-comment.controller.ts`, locate the import block at the top and replace the `@nestjs/common` and `@nestjs/swagger` imports plus the local DTO import with:

```ts
import {
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';
```

And add this DTO import alongside the existing `dto/physical-count-detail-comment.dto` import:

```ts
import {
  UploadCommentWithFilesBodyDto,
  UploadCommentWithFilesBodySchema,
  UploadCommentWithFilesDto,
} from './dto/upload-comment-with-files.dto';
```

- [ ] **Step 2: Add file-validation constants near the top of the file**

Just below the imports, before `@Controller('api')`, add:

```ts
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
] as const;
```

- [ ] **Step 3: Add the endpoint**

Inside the `PhysicalCountDetailCommentController` class, just above the existing `addAttachment` handler (the `@Post(':bu_code/physical-count-detail-comment/:id/attachment')`), insert the new handler:

```ts
  @Post(':bu_code/physical-count-detail-comment/upload')
  @UseGuards(new AppIdGuard('physicalCountDetailComment.createWithFiles'))
  @UseInterceptors(FilesInterceptor('files', MAX_FILES))
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a physical-count-detail comment with file uploads',
    operationId: 'createPhysicalCountDetailCommentWithFiles',
    tags: ['Inventory', 'PhysicalCountDetail Comment'],
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
    const body = parsed.data;

    if (files.length > MAX_FILES) {
      throw new BadRequestException(
        `Too many files (max ${MAX_FILES}, received ${files.length})`,
      );
    }
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          `File "${f.originalname}" exceeds max size of ${MAX_FILE_SIZE_BYTES} bytes`,
        );
      }
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(f.mimetype)) {
        throw new BadRequestException(
          `File "${f.originalname}" has unsupported mime type "${f.mimetype}"`,
        );
      }
    }

    const hasMessage = typeof body.message === 'string' && body.message.length > 0;
    if (!hasMessage && files.length === 0) {
      throw new BadRequestException(
        'At least one of `message` or `files` must be provided',
      );
    }

    const { user_id } = ExtractRequestHeader(req);
    return this.physicalCountDetailCommentService.createWithFiles(
      files,
      body,
      user_id,
      bu_code,
      version,
    );
  }
```

(Note: `UploadCommentWithFilesBodyDto` import is unused intentionally — it exists for any future place that wants the class form. Keep the import to make the DTO file's class available; if your eslint config flags unused imports, replace the import with just `UploadCommentWithFilesBodySchema` and `UploadCommentWithFilesDto`.)

- [ ] **Step 4: Run lint + type-check**

Run: `cd apps/backend-gateway && bun run check-types && bun run lint`
Expected: PASS. If lint flags `UploadCommentWithFilesBodyDto` as unused, drop it from the import statement.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.ts
git commit -m "feat(gateway): add createWithFiles multipart endpoint to physical-count-detail-comment"
```

---

## Task 6: Controller validation tests

**Files:**
- Create: `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.spec.ts`

- [ ] **Step 1: Create the spec**

Create `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.spec.ts` with:

```ts
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PhysicalCountDetailCommentController } from './physical-count-detail-comment.controller';
import { PhysicalCountDetailCommentService } from './physical-count-detail-comment.service';

const mockService = {
  createWithFiles: jest.fn(),
};

const fakeReq = {
  headers: { 'x-user-id': 'user-1' },
} as unknown as Request;

const mkFile = (
  name: string,
  mime: string,
  size: number,
): Express.Multer.File =>
  ({
    originalname: name,
    mimetype: mime,
    buffer: Buffer.alloc(size),
    size,
  }) as Express.Multer.File;

describe('PhysicalCountDetailCommentController.createWithFiles', () => {
  let controller: PhysicalCountDetailCommentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhysicalCountDetailCommentController],
      providers: [
        { provide: PhysicalCountDetailCommentService, useValue: mockService },
      ],
    })
      .overrideGuard(/* KeycloakGuard, PermissionGuard handled at runtime */ class {})
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PhysicalCountDetailCommentController);
    jest.clearAllMocks();
  });

  const validBody = {
    physical_count_detail_id: '11111111-1111-1111-1111-111111111111',
    message: 'hello',
    type: 'user',
  };

  it('rejects bad uuid', async () => {
    await expect(
      controller.createWithFiles(
        'HQ-001',
        [],
        { ...validBody, physical_count_detail_id: 'not-a-uuid' },
        fakeReq,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when no message and no files', async () => {
    await expect(
      controller.createWithFiles(
        'HQ-001',
        [],
        {
          physical_count_detail_id: validBody.physical_count_detail_id,
          type: 'user',
        },
        fakeReq,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects too many files', async () => {
    const files = Array.from({ length: 11 }, (_, i) =>
      mkFile(`f${i}.jpg`, 'image/jpeg', 100),
    );
    await expect(
      controller.createWithFiles('HQ-001', files, validBody, fakeReq),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects file too large', async () => {
    const big = mkFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024);
    await expect(
      controller.createWithFiles('HQ-001', [big], validBody, fakeReq),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects bad mime', async () => {
    const txt = mkFile('a.txt', 'text/plain', 10);
    await expect(
      controller.createWithFiles('HQ-001', [txt], validBody, fakeReq),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts valid request and forwards to service', async () => {
    mockService.createWithFiles.mockResolvedValueOnce({ ok: true });
    const file = mkFile('a.jpg', 'image/jpeg', 100);

    const result = await controller.createWithFiles(
      'HQ-001',
      [file],
      validBody,
      fakeReq,
    );

    expect(mockService.createWithFiles).toHaveBeenCalledWith(
      [file],
      expect.objectContaining({
        physical_count_detail_id: validBody.physical_count_detail_id,
        message: 'hello',
        type: 'user',
      }),
      expect.any(String), // user_id from header
      'HQ-001',
      'latest',
    );
    expect(result).toEqual({ ok: true });
  });

  it('accepts pdf', async () => {
    mockService.createWithFiles.mockResolvedValueOnce({ ok: true });
    const pdf = mkFile('a.pdf', 'application/pdf', 1000);

    await controller.createWithFiles('HQ-001', [pdf], validBody, fakeReq);
    expect(mockService.createWithFiles).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd apps/backend-gateway && bunx jest physical-count-detail-comment.controller.spec --no-coverage`
Expected: PASS — all 7 cases green.

If `overrideGuard` errors because `KeycloakGuard`/`PermissionGuard` aren't exported as expected, simplify the test by skipping the override block entirely — `Test.createTestingModule` will work since the guards aren't actually applied to method calls invoked directly on the controller instance.

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.spec.ts
git commit -m "test(gateway): add controller tests for createWithFiles validation"
```

---

## Task 7: Bruno request example

**Files:**
- Create: `apps/bruno/carmen-inventory/inventory/physical-count-detail-comment/01 - Create With Files.bru`

- [ ] **Step 1: Create the directory if needed**

Run:
```bash
mkdir -p apps/bruno/carmen-inventory/inventory/physical-count-detail-comment
```

- [ ] **Step 2: Create the Bruno request**

Create `apps/bruno/carmen-inventory/inventory/physical-count-detail-comment/01 - Create With Files.bru` with:

```
meta {
  name: Create With Files physical-count-detail-comment
  type: http
  seq: 1
}

post {
  url: {{host}}/api/{{bu_code}}/physical-count-detail-comment/upload
  body: multipartForm
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

query {
  ~version: latest
}

body:multipart-form {
  physical_count_detail_id: {{physical_count_detail_id}}
  message: Damage on outer carton
  type: user
  files: @file(./samples/photo1.jpg)
  files: @file(./samples/photo2.jpg)
}

docs {
  ## Create comment with file uploads (single request)

  อัปโหลดไฟล์แนบ (image/pdf) พร้อมข้อความ ลงในคอมเมนต์ของ physical-count-detail
  ใน request เดียว ไม่ต้อง upload file แยกก่อน

  ### Constraints
  - max 10 files per request
  - max 10 MB per file
  - allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf
  - at least one of `message` or `files` is required

  ### Response 201
  ```json
  {
    "data": {
      "id": "<uuid>",
      "physical_count_detail_id": "<uuid>",
      "message": "Damage on outer carton",
      "attachments": [
        {
          "fileName": "photo1.jpg",
          "fileToken": "tok-1",
          "fileUrl": "https://minio/.../photo1.jpg",
          "contentType": "image/jpeg",
          "size": 204800
        }
      ],
      "type": "user",
      "created_at": "2026-04-28T12:00:00.000Z"
    },
    "status": 201,
    "success": true,
    "message": "Success",
    "timestamp": "2026-04-28T12:00:00.000Z"
  }
  ```
}
```

- [ ] **Step 3: Run Bruno sync (dry) to confirm collection picks it up**

Run: `bun run bruno:sync:dry`
Expected: output shows the new file as recognized (no archive action against it).

- [ ] **Step 4: Commit**

```bash
git add apps/bruno/carmen-inventory/inventory/physical-count-detail-comment/
git commit -m "docs(bruno): add Create With Files example for physical-count-detail-comment"
```

---

## Task 8: Manual smoke test + final type-check

**Files:** none

- [ ] **Step 1: Type-check the gateway**

Run: `cd apps/backend-gateway && bun run check-types`
Expected: PASS.

- [ ] **Step 2: Run all gateway unit tests**

Run: `cd apps/backend-gateway && bunx jest --testPathPattern="physical-count-detail-comment" --no-coverage`
Expected: PASS — all service + controller tests green.

- [ ] **Step 3: Run lint**

Run: `cd apps/backend-gateway && bun run lint`
Expected: PASS.

- [ ] **Step 4: Optional manual smoke test against running stack**

If a dev environment is available, run the Bruno request added in Task 7. Pre-conditions:
- `backend-gateway`, `micro-business`, `micro-file` running
- A valid `physical_count_detail_id` exists for `bu_code`
- `samples/photo1.jpg` and `samples/photo2.jpg` (or any image ≤ 10 MB) placed next to the `.bru` file
- `access_token`, `x_app_id`, `bu_code`, `physical_count_detail_id` set in the Bruno environment

Verify:
- 201 returned
- Response contains `attachments[]` with non-empty `fileUrl`
- Each `fileUrl` is reachable (auth-protected — use the `documents/download/:filetoken` endpoint or admin MinIO access)
- The comment row appears via `GET /api/{bu_code}/physical-count-detail/:id/comments`

If smoke test cannot run, note that explicitly in the PR description.

- [ ] **Step 5: Final commit (if any cleanups)**

```bash
git status
# if anything uncommitted, stage and commit; otherwise skip
```

---

## Self-Review Notes

**Spec coverage:**
- Architecture (gateway-only, fan-out FILE_SERVICE then BUSINESS_SERVICE) → Tasks 1, 3, 4
- Endpoint shape (path, fields, mime, size, count) → Task 5 (controller) + Task 2 (DTOs)
- Body validation rules → Task 5 + Task 6 tests
- Rollback policy (best-effort delete on partial failure) → Task 4 service + tests
- Error mapping (400 / 404 passthrough / 502 partial / 500) → Task 5 (400s), service forwards business error code (404 etc.)
- Bruno example → Task 7
- Tests for happy path, partial-fail rollback, comment-fail rollback, zero files, validation cases → Tasks 3, 4, 6
- No DB / micro-business / micro-file changes → respected (only gateway files modified)
- Existing endpoints untouched → respected

**Placeholders:** none — every code block is complete and self-contained.

**Type consistency:**
- `UploadedAttachment` shape is identical between service definition (Task 3) and the data sent to BUSINESS_SERVICE (Task 4) — `{ fileName, fileToken, fileUrl, contentType, size }`.
- `createWithFiles(files, dto, user_id, bu_code, version)` signature matches between service (Task 4) and controller (Task 5) and tests (Tasks 4, 6).
- Constants (`MAX_FILES=10`, `MAX_FILE_SIZE_BYTES=10MB`, `ALLOWED_MIME_TYPES`) used consistently in controller (Task 5) and matched in tests (Task 6).
