# Physical Count Detail Comment — Direct File Upload Design

**Date:** 2026-04-28
**Topic:** Single-request comment-with-files upload for `tb_physical_count_detail_comment`
**Status:** Approved (awaiting implementation plan)

## Goal

Allow clients to create a comment on a `physical_count_detail` row and upload attachment files (images and PDFs) **in a single HTTP request**, instead of the current two-step flow (upload to file service → submit JSON with returned URLs).

The current schema and JSON-based create/update endpoints already support `message` and `attachments[]` (object shape `{ fileName, fileToken, fileUrl, contentType, size }`). This spec adds an additional **multipart upload endpoint** that wraps the upload + create flow on the gateway side.

## Non-goals

- Changing `tb_physical_count_detail_comment` schema (no migration).
- Changing the existing JSON-based create/update endpoints (they remain available for clients that already pre-upload files).
- Adding a similar endpoint for other comment tables (e.g. `tax-profile-comment`). May be done later as a follow-up.
- Replacing MinIO/S3 with direct binary storage. Files still flow through `micro-file` → MinIO.

## Architecture

```
Client (multipart)
   │
   ▼
backend-gateway
   │  PhysicalCountDetailCommentController.createWithFiles()
   │     ├─ FilesInterceptor('files', max=10) → Express.Multer.File[]
   │     ├─ Validate fields (Zod) + files (count, size, mime)
   │     └─ PhysicalCountDetailCommentService.createWithFiles()
   │           ├─ For each file: send TCP { cmd: 'file.upload' } → micro-file
   │           │    (Promise.all, parallel)
   │           ├─ Build attachments[] from file responses
   │           ├─ On any upload failure → rollback uploaded files via { cmd: 'file.delete' }
   │           └─ Send TCP { cmd: 'physicalCountDetailComment.create' } → micro-business
   │                 (existing pattern, unchanged)
   ▼
micro-file (MinIO)             micro-business (Postgres)
```

No changes to `micro-business` or `micro-file`.

## API Contract

### New endpoint

```
POST /api/{bu_code}/physical-count-detail-comment/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>
x-app-id: <id>
```

**Form fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `physical_count_detail_id` | string (uuid v4) | yes | Target detail row |
| `message` | string | no | Comment text; `null`/empty allowed if files present |
| `type` | enum `user` \| `system` | no | Defaults to `user` |
| `files` | binary[] | no | 0–10 files per request |

**At least one of `message` or `files` must be present** (400 otherwise).

**Constraints:**
- Max files per request: **10**
- Max size per file: **10 MB**
- Allowed mime types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`

**Response 201:** Same shape as existing `create` endpoint — full `PhysicalCountDetailCommentResponse` (id, message, attachments[], timestamps, etc.)

**Error responses:**
- `400` — validation error (bad uuid, no message+no files, file too large, bad mime, too many files)
- `404` — `physical_count_detail_id` not found (returned by `micro-business`)
- `500` — file service unreachable, database error
- `502` — partial upload failure (after rollback attempt) — body includes whether rollback succeeded

### Existing endpoints (unchanged)
- `POST /api/{bu_code}/physical-count-detail-comment` — JSON create (still supports pre-uploaded attachments)
- `PATCH /api/{bu_code}/physical-count-detail-comment/:id` — update message/attachments
- `POST /api/{bu_code}/physical-count-detail-comment/:id/attachment` — add single attachment (already-uploaded file metadata)
- `DELETE /api/{bu_code}/physical-count-detail-comment/:id/attachment/:fileToken` — remove attachment
- `GET`, `DELETE` for the comment itself

## Components

### 1. Controller — `PhysicalCountDetailCommentController`
**File:** `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.controller.ts`

Add new handler:

```ts
@Post(':bu_code/physical-count-detail-comment/upload')
@UseGuards(new AppIdGuard('physicalCountDetailComment.createWithFiles'))
@UseInterceptors(FilesInterceptor('files', 10))
@ApiConsumes('multipart/form-data')
@ApiBody({ type: UploadCommentWithFilesDto })
@HttpCode(HttpStatus.CREATED)
async createWithFiles(
  @Param('bu_code') bu_code: string,
  @UploadedFiles() files: Express.Multer.File[],
  @Body() body: UploadCommentWithFilesBodyDto,
  @Req() req: Request,
  @Query('version') version: string = 'latest',
): Promise<unknown>
```

Responsibilities:
- Extract `user_id` from header
- Pre-validate file constraints (count, mime, size) with 400 on failure
- Validate "at least one of message/files"
- Delegate to service

### 2. Service — `PhysicalCountDetailCommentService`
**File:** `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts`

Inject second client `FILE_SERVICE` alongside existing `BUSINESS_SERVICE`. Add:

```ts
async createWithFiles(
  files: Express.Multer.File[],
  dto: { physical_count_detail_id: string; message?: string | null; type?: 'user' | 'system' },
  user_id: string,
  bu_code: string,
  version: string,
): Promise<unknown>
```

Steps:
1. **Upload files in parallel** to `micro-file` via TCP `{ cmd: 'file.upload', service: 'files' }`. Each payload: `{ fileName, mimeType, buffer (base64), bu_code, user_id, ...gatewayRequestContext }`.
2. **Collect attachments**: from each successful upload response, map to `{ fileName, fileToken, fileUrl, contentType, size }`.
3. **On any upload failure**: cancel pending, then issue `{ cmd: 'file.delete' }` for each successfully-uploaded `fileToken`. Return error with `502` (downstream upload failure) regardless of rollback success — log rollback outcome.
4. **Create comment**: forward to existing `BUSINESS_SERVICE` `physicalCountDetailComment.create` pattern with `{ ...dto, attachments }`.
5. **On comment-create failure after files uploaded**: rollback uploaded files (same as step 3), return original error.

### 3. Module — `PhysicalCountDetailCommentModule`
**File:** `apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.module.ts`

Register additional client (mirroring `document-management.module.ts`):

```ts
ClientsModule.register([
  {
    name: 'BUSINESS_SERVICE',
    transport: Transport.TCP,
    options: { host: envConfig.BUSINESS_SERVICE_HOST, port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT) },
  },
  {
    name: 'FILE_SERVICE',
    transport: Transport.TCP,
    options: { host: envConfig.FILE_SERVICE_HOST, port: Number(envConfig.FILE_SERVICE_TCP_PORT) },
  },
])
```

### 4. DTO + Swagger
**File:** `apps/backend-gateway/src/application/physical-count-detail-comment/dto/physical-count-detail-comment.dto.ts`

Add:
- `UploadCommentWithFilesBodyDto` — Zod schema for body fields (no `files` — interceptor handles those)
- `UploadCommentWithFilesDto` — class with `@ApiProperty` decorators describing the multipart shape (`files` as `binary[]`, plus other fields), used only for Swagger `@ApiBody`

**File:** `apps/backend-gateway/src/application/physical-count-detail-comment/swagger/request.ts`

Document the multipart schema for OpenAPI.

### 5. Bruno collection
**Path:** `apps/bruno/carmen-inventory/physical-count-detail-comment/`

Add new `.bru` request: `create-with-upload.bru` — POST `multipart/form-data` example (use `@file()` Bruno syntax).

## Data Flow Examples

### Happy path — message + 2 images
```
Client → POST /api/HQ-001/physical-count-detail-comment/upload
  Content-Type: multipart/form-data
  fields: physical_count_detail_id=<uuid>, message="Damage on box", type=user
  files: photo1.jpg (200KB), photo2.jpg (180KB)
  ↓
Gateway: validate (2 files, both image/jpeg, both < 10MB) ✓
  ↓
Gateway → micro-file (parallel):
  TCP file.upload (photo1.jpg, base64)  → { fileToken: tok-1, fileUrl: ... }
  TCP file.upload (photo2.jpg, base64)  → { fileToken: tok-2, fileUrl: ... }
  ↓
Gateway → micro-business:
  TCP physicalCountDetailComment.create {
    physical_count_detail_id, message, type,
    attachments: [{fileName, fileToken: tok-1, fileUrl, contentType, size}, {...tok-2}]
  }
  ↓
Gateway → Client: 201 with full comment row
```

### Partial failure — 2nd file fails
```
Gateway → micro-file (parallel):
  file.upload (photo1.jpg) → ok (tok-1)
  file.upload (photo2.jpg) → ERROR
  ↓
Gateway compensating action:
  file.delete (tok-1)   → log result
  ↓
Gateway → Client: 502 "File upload failed; partial uploads rolled back"
```

### Partial failure — comment create fails after upload
```
files uploaded ok → tok-1, tok-2
  ↓
business.create → ERROR (e.g. physical_count_detail_id not found → 404)
  ↓
Gateway compensating action: file.delete tok-1, tok-2
  ↓
Gateway → Client: 404 "physical_count_detail not found" (original error)
```

## Validation Rules

| Rule | Limit | HTTP code on violation |
|---|---|---|
| `physical_count_detail_id` is uuid v4 | required | 400 |
| `type` ∈ {`user`,`system`} | optional, default `user` | 400 |
| `message` length | ≤ 4000 chars | 400 |
| `files` count | 0–10 | 400 |
| File size | ≤ 10 MB each | 400 |
| File mime | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf` | 400 |
| At least one of `message`, `files` | required | 400 |

## Error Handling Summary

- All file-buffer errors caught early in controller (Multer) → 400.
- Rollback policy: **on any failure after first successful file upload, attempt to delete all already-uploaded files** before returning the original error. Rollback is best-effort; if rollback itself fails, log error but still return the original failure to the client.
- Logging: structured logs at controller and service level with `function`, `bu_code`, `physical_count_detail_id`, file count, success/failure flags. Do not log file buffers.

## Testing

**Unit tests** (`physical-count-detail-comment.service.spec.ts`):
- Happy path (mock both clients → ok)
- All files upload ok, comment create fails → expect rollback calls
- One file upload fails → expect rollback for previously-uploaded
- Zero files + message present → no upload calls, single create call
- Zero files + no message → 400 (in controller, not service)

**E2E test** (`physical-count-detail-comment.e2e-spec.ts` if present, otherwise manual via Bruno):
- Multipart upload with 1 valid image — assert 201, assert attachments[].fileUrl reachable
- Multipart upload with file > 10MB — assert 400
- Multipart upload with bad mime (text/plain) — assert 400
- Multipart upload with valid PDF (application/pdf) — assert 201
- Empty body, no files — assert 400

## Documentation

- Update Swagger via existing `swagger:retag` flow (no new tag — same `Inventory: Physical Count`).
- Add Bruno example as listed above.
- No CLAUDE.md update required (no new convention).

## Out-of-scope notes

- The `physicalCountDetailComment.update` flow could later get a similar multipart variant; deferred until requested.
- No similar endpoint added to other `*-comment` tables in this round.
- File deduplication / hashing — not in scope; relies on MinIO behavior.
