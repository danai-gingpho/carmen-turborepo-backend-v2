# Document Binary Download Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /api/:bu_code/documents/:filetoken/download` to backend-gateway that streams raw S3 (MinIO) binary directly to the HTTP client, with proper `Content-Type` / `Content-Disposition` / `Content-Length` headers, instead of the JSON+base64 wrapper used by the existing `GET /:filetoken` endpoint.

**Architecture:** Reuse the existing `cmd: 'file.get'` TCP message pattern in `micro-file` (no microservice changes). Add a new gateway service method that decodes the base64 buffer returned by the TCP call into a Node `Buffer`, and a new gateway controller method that bypasses the standard `respond()` JSON wrapper on the success path to write raw bytes via `res.send(buffer)`.

**Tech Stack:** NestJS 10 + Express + RxJS (gateway), TypeScript 5, Jest for unit tests, Bruno for manual API checks.

**Spec:** `docs/superpowers/specs/2026-04-30-document-binary-data-endpoint-design.md`

---

## File Structure

**Files modified:**

| Path | Change |
|------|--------|
| `apps/backend-gateway/src/application/document-management/document-management.service.ts` | Add `downloadDocument()` method that calls `cmd: 'file.get'` and decodes base64 → `Buffer` |
| `apps/backend-gateway/src/application/document-management/document-management.controller.ts` | Add `@Get(':filetoken/download')` handler that returns raw binary on success or JSON error via `respond()` |
| `apps/backend-gateway/src/application/document-management/document-management.service.spec.ts` | Add unit tests for `downloadDocument` happy + error paths |
| `apps/backend-gateway/src/application/document-management/document-management.controller.spec.ts` | Add unit tests for `downloadDocument` happy + error paths (mock `res.set` / `res.send`) |
| `apps/backend-gateway/x-app-id.json` | Add `documents.download` to the `mobile-app` allow list |

**Files created:**

| Path | Responsibility |
|------|---------------|
| `apps/bruno/carmen-inventory/documents-and-reports/documents/06 - Download Document.bru` | Bruno request to manually exercise the new endpoint |

**Out of scope (no changes):**
- `apps/micro-file/**` — uses existing `cmd: 'file.get'` handler.
- `scripts/swagger-sync/tag-mapping.json` — controller path already mapped to `Documents: File Management`.
- Permission DB seed — permissions in this gateway live only in `x-app-id.json` (verified: no `documents.*` keys appear in `packages/prisma-shared-schema-platform/prisma/`).

---

## Task 1: Add `downloadDocument` service method (TDD)

**Files:**
- Modify: `apps/backend-gateway/src/application/document-management/document-management.service.ts`
- Test: `apps/backend-gateway/src/application/document-management/document-management.service.spec.ts`

The service sends `cmd: 'file.get'` to micro-file (same pattern as the existing `getDocument`), then transforms the response: base64 string in `response.data.buffer` becomes a `Buffer`, and the contentType/fileName/size fields are surfaced into a typed shape so the controller does not have to know the wire format.

- [ ] **Step 1: Write the failing happy-path test**

Open `apps/backend-gateway/src/application/document-management/document-management.service.spec.ts` and add a new `describe` block before the closing `});` of the outer `describe('DocumentManagementService', ...)`:

```ts
  describe('downloadDocument', () => {
    it('decodes base64 buffer from file.get into a Node Buffer', async () => {
      const original = Buffer.from('hello pdf', 'utf8');
      const microResponse = {
        success: true,
        data: {
          fileToken: 'tok-1',
          fileName: 'invoice.pdf',
          mimeType: 'application/pdf',
          size: original.length,
          buffer: original.toString('base64'),
        },
      };
      mockFileService.send.mockReturnValue({
        subscribe: (observer: { next: (v: unknown) => void; complete: () => void }) => {
          observer.next(microResponse);
          observer.complete();
          return { unsubscribe: () => undefined };
        },
      });

      const result = await service.downloadDocument('tok-1', 'user-1', 'BU001');

      expect(mockFileService.send).toHaveBeenCalledWith(
        { cmd: 'file.get', service: 'files' },
        expect.objectContaining({ fileToken: 'tok-1', user_id: 'user-1', bu_code: 'BU001' }),
      );
      expect(result.isOk()).toBe(true);
      const value = result.unwrap() as {
        buffer: Buffer;
        contentType: string;
        fileName: string;
        size: number;
      };
      expect(Buffer.isBuffer(value.buffer)).toBe(true);
      expect(value.buffer.equals(original)).toBe(true);
      expect(value.contentType).toBe('application/pdf');
      expect(value.fileName).toBe('invoice.pdf');
      expect(value.size).toBe(original.length);
    });
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-management.service.spec.ts
```

Expected: the new test fails with `service.downloadDocument is not a function`.

- [ ] **Step 3: Implement `downloadDocument` in the service**

Open `apps/backend-gateway/src/application/document-management/document-management.service.ts` and add this method at the end of the class (after `getPresignedUrl`, before the closing `}`):

```ts
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
```

- [ ] **Step 4: Run the happy-path test to verify it passes**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-management.service.spec.ts
```

Expected: all tests pass, including the new `downloadDocument › decodes base64 buffer from file.get into a Node Buffer`.

- [ ] **Step 5: Add the failing error-path test**

Inside the same `describe('downloadDocument', ...)` block, append:

```ts
    it('returns Result.error when micro-file responds with success=false', async () => {
      const microResponse = {
        success: false,
        message: 'File not found',
        response: { status: 404, message: 'File not found' },
      };
      mockFileService.send.mockReturnValue({
        subscribe: (observer: { next: (v: unknown) => void; complete: () => void }) => {
          observer.next(microResponse);
          observer.complete();
          return { unsubscribe: () => undefined };
        },
      });

      const result = await service.downloadDocument('missing', 'user-1', 'BU001');

      expect(result.isOk()).toBe(false);
    });
```

- [ ] **Step 6: Run the suite to confirm both tests pass**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-management.service.spec.ts
```

Expected: 3 tests pass total (the existing `should be defined` plus the two new tests).

- [ ] **Step 7: Commit**

```bash
git add apps/backend-gateway/src/application/document-management/document-management.service.ts \
        apps/backend-gateway/src/application/document-management/document-management.service.spec.ts
git commit -m "feat(documents): add downloadDocument service method that decodes base64 → Buffer"
```

---

## Task 2: Add `downloadDocument` controller endpoint (TDD)

**Files:**
- Modify: `apps/backend-gateway/src/application/document-management/document-management.controller.ts`
- Test: `apps/backend-gateway/src/application/document-management/document-management.controller.spec.ts`

Success path bypasses the JSON `respond()` wrapper and calls `res.set(...)` + `res.send(buffer)` directly. Error path uses the existing `respond()` so JSON error envelopes stay consistent with the rest of the controller.

- [ ] **Step 1: Extend the mocked service with `downloadDocument`**

In `apps/backend-gateway/src/application/document-management/document-management.controller.spec.ts`, add `downloadDocument: jest.fn(),` to `mockDocumentManagementService` so it looks like this:

```ts
const mockDocumentManagementService = {
  uploadDocument: jest.fn(),
  getDocument: jest.fn(),
  getDocumentInfo: jest.fn(),
  deleteDocument: jest.fn(),
  listDocuments: jest.fn(),
  getPresignedUrl: jest.fn(),
  downloadDocument: jest.fn(),
};
```

Then update `createMockResponse` to also stub `set` (used by the new handler):

```ts
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return res;
};
```

- [ ] **Step 2: Write the failing happy-path test**

Append a new `describe` block before the closing `});` of `describe('DocumentManagementController', ...)`:

```ts
  describe('downloadDocument', () => {
    it('streams binary with Content-Type, Content-Disposition, Content-Length headers', async () => {
      const buffer = Buffer.from('PDF-BINARY', 'utf8');
      const mockResult = Result.ok({
        buffer,
        contentType: 'application/pdf',
        fileName: 'invoice.pdf',
        size: buffer.length,
      });
      mockDocumentManagementService.downloadDocument.mockResolvedValue(mockResult);

      const mockRes = createMockResponse();
      await controller.downloadDocument('tok-1', 'BU001', mockRequest, mockRes as any);

      expect(service.downloadDocument).toHaveBeenCalledWith('tok-1', 'user-123', 'BU001');
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="invoice.pdf"',
        'Content-Length': buffer.length,
      });
      expect(mockRes.send).toHaveBeenCalledWith(buffer);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('falls back to respond() with JSON error when service returns Result.error', async () => {
      const errorResult = Result.error('File not found', 'NOT_FOUND' as any);
      mockDocumentManagementService.downloadDocument.mockResolvedValue(errorResult);

      const mockRes = createMockResponse();
      await controller.downloadDocument('missing', 'BU001', mockRequest, mockRes as any);

      expect(mockRes.set).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-management.controller.spec.ts
```

Expected: `controller.downloadDocument is not a function`.

- [ ] **Step 4: Add the controller method**

Open `apps/backend-gateway/src/application/document-management/document-management.controller.ts`. Insert the new handler **between** `getDocument` (ends at line 199) and `getDocumentInfo` (starts at line 210), so the route ordering reflects the URL hierarchy (`:filetoken` → `:filetoken/download` → `:filetoken/info`):

```ts
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

    const { buffer, contentType, fileName, size } = result.unwrap();
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': size,
    });
    res.send(buffer);
  }
```

- [ ] **Step 5: Run the controller tests**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-management.controller.spec.ts
```

Expected: all controller tests pass (existing ones plus the two new `downloadDocument` cases).

- [ ] **Step 6: Run the full document-management suite**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-management
```

Expected: every test in both `document-management.controller.spec.ts` and `document-management.service.spec.ts` passes.

- [ ] **Step 7: Commit**

```bash
git add apps/backend-gateway/src/application/document-management/document-management.controller.ts \
        apps/backend-gateway/src/application/document-management/document-management.controller.spec.ts
git commit -m "feat(documents): add GET :filetoken/download endpoint streaming raw binary"
```

---

## Task 3: Register `documents.download` in the mobile-app allow list

**Files:**
- Modify: `apps/backend-gateway/x-app-id.json`

The mobile app currently lists every other `documents.*` permission (lines 21–26). Add the new key directly after `documents.delete` so its mobile clients can call the new endpoint without a 403.

- [ ] **Step 1: Edit `x-app-id.json`**

Locate this region in `apps/backend-gateway/x-app-id.json` (around lines 21–26):

```json
      "documents.upload",
      "documents.list",
      "documents.get",
      "documents.info",
      "documents.presignedUrl",
      "documents.delete",
```

Insert `"documents.download",` directly after `"documents.delete",` so the section becomes:

```json
      "documents.upload",
      "documents.list",
      "documents.get",
      "documents.info",
      "documents.presignedUrl",
      "documents.delete",
      "documents.download",
```

- [ ] **Step 2: Smoke-check JSON validity**

```bash
node -e "JSON.parse(require('fs').readFileSync('apps/backend-gateway/x-app-id.json','utf8')); console.log('ok')"
```

Expected output: `ok`.

- [ ] **Step 3: Commit**

```bash
git add apps/backend-gateway/x-app-id.json
git commit -m "feat(documents): allow documents.download for mobile-app x-app-id"
```

---

## Task 4: Add Bruno request for the download endpoint

**Files:**
- Create: `apps/bruno/carmen-inventory/documents-and-reports/documents/06 - Download Document.bru`

Mirrors the layout of `02 - Get Document.bru` (same `filetoken` pre-request var, same headers/auth) but points at the `/download` URL and documents the binary response.

- [ ] **Step 1: Create the `.bru` file**

Create `apps/bruno/carmen-inventory/documents-and-reports/documents/06 - Download Document.bru` with this exact content:

```
meta {
  name: Download document document-management
  type: http
  seq: 6
}

get {
  url: {{host}}/api/{{bu_code}}/documents/:filetoken/download
  body: none
  auth: bearer
}

params:path {
  filetoken: {{filetoken}}
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

vars:pre-request {
  filetoken: T02%2F2552e0e1-1393-4f76-9ba1-ea443442422a
}

docs {
  ## Download Document Binary
  ดาวน์โหลดไฟล์ binary โดยตรงจาก S3/MinIO
  
  Streams the raw binary content of a procurement document. Response body is the file bytes (not JSON), with Content-Type/Content-Disposition/Content-Length headers set so browsers can preview images/PDFs directly.
  
  ### Path Parameters
  | Name | Type | Description |
  |------|------|-------------|
  | `bu_code` | string | Business unit code |
  | `filetoken` | string | Unique file token returned from upload |
  
  ### Headers
  | Name | Required | Description |
  |------|----------|-------------|
  | `Authorization` | Yes | `Bearer {{access_token}}` |
  | `x-app-id` | Yes | `{{x_app_id}}` |
  
  ### Permissions
  - `documents.download`
  
  ### Sample Response
  Raw binary stream. Response headers include:
  - `Content-Type`: e.g. `application/pdf`, `image/png`
  - `Content-Disposition`: `inline; filename="<original-name>"`
  - `Content-Length`: file size in bytes
  
  ### Error Responses
  | Status | When |
  |--------|------|
  | 401 | Missing or invalid Bearer token |
  | 403 | App ID not allowed `documents.download` |
  | 404 | File token not found in storage |
}
```

- [ ] **Step 2: Verify with Bruno sync dry-run**

```bash
bun run bruno:sync:dry
```

Expected: the report lists the new file as `add` or `up-to-date` for the `GET /api/:bu_code/documents/:filetoken/download` route, and lists no orphan for it. (If the gateway has not been restarted with the new route, the dry-run may flag it as orphan; in that case rebuild first: `bun run build:package && bun --filter backend-gateway build`, then re-run the dry-run.)

- [ ] **Step 3: Commit**

```bash
git add "apps/bruno/carmen-inventory/documents-and-reports/documents/06 - Download Document.bru"
git commit -m "feat(documents): add Bruno request for download endpoint"
```

---

## Task 5: End-to-end manual verification

**Files:** none modified — verification only.

This task gates the merge by exercising the change against a running gateway + micro-file pair.

- [ ] **Step 1: Start the dev environment**

In two terminals:

```bash
# terminal 1
cd apps/micro-file
bun run dev
```

```bash
# terminal 2
cd apps/backend-gateway
bun run dev
```

Wait until both log `ready` / port-listening lines.

- [ ] **Step 2: Authenticate via Bruno**

Open the Bruno collection at `apps/bruno/carmen-inventory/`, select an environment (e.g. `localhost-4000`), and run any login request under `auth/login/` to populate `{{access_token}}`.

- [ ] **Step 3: Upload a known file (so we have a real `filetoken`)**

Run `apps/bruno/carmen-inventory/documents-and-reports/documents/01 - List Documents.bru` first; pick an existing `fileToken` from the response (or run the upload request and copy its returned token). Set the chosen value into the env var `filetoken` (or override the `vars:pre-request` line in `06 - Download Document.bru`).

- [ ] **Step 4: Hit the new endpoint**

Send `06 - Download Document.bru`. Expected:
- HTTP 200
- Response body is binary (Bruno will display `<binary data>` or render the preview)
- Response headers contain `Content-Type`, `Content-Disposition: inline; filename="..."`, and `Content-Length`

- [ ] **Step 5: Browser sanity check**

In a browser, open the URL:

```
http://localhost:4000/api/<bu_code>/documents/<urlencoded-filetoken>/download
```

with valid `Authorization` + `x-app-id` headers (e.g. via a REST client extension). Expected: the file renders inline (image preview or PDF viewer) instead of triggering a JSON download.

- [ ] **Step 6: Negative path — wrong token**

Replace the `filetoken` with a random string and re-send. Expected: HTTP 404 with the standard JSON error envelope (`{ status: 404, success: false, message: "File not found", ... }`), confirming `respond()` is exercised on the error branch.

- [ ] **Step 7: Capture the result**

If all 6 steps above pass, the endpoint is ready to merge. If any step fails, fix the underlying code (return to Task 1 or 2 as appropriate) and re-run from the affected step.

No commit in this task — verification only.

---

## Self-Review

Spec coverage:

| Spec section | Task |
|--------------|------|
| `downloadDocument()` service method (decode base64 → Buffer, error path) | Task 1 |
| `GET :filetoken/download` controller (raw bytes on success, JSON via `respond()` on error, headers) | Task 2 |
| Permission key `documents.download` | Task 3 |
| Bruno file `06 - Download Document.bru` | Task 4 |
| Manual browser + Bruno verification | Task 5 |
| Out-of-scope items (range, streaming over TCP, ETag) | Explicitly excluded |

No `TBD`/`TODO`/`add error handling` placeholders remain. Method signatures are consistent across tasks (`downloadDocument(fileToken, user_id, bu_code)` returning `Result<{ buffer, contentType, fileName, size }>`). Permission key, controller decorator, mobile-app allow-list, Bruno docs, and headers all use the same string `documents.download`.
