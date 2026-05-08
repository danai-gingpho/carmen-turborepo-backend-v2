# Get Document Binary Data Endpoint — Design

**Date:** 2026-04-30
**Status:** Draft

## Goal

เพิ่ม endpoint ใหม่สำหรับ stream raw binary จาก S3 (MinIO) ตรง ๆ เพื่อให้ browser หรือ HTTP client โหลด/แสดงไฟล์ (รูปภาพ, PDF) ได้โดยตรง โดยไม่ต้องผ่าน JSON wrapper + base64 decoding ที่ฝั่ง client

## Endpoint

```
GET /api/:bu_code/documents/:filetoken/download
```

**Response:**
- `Content-Type`: ตามไฟล์จริง (e.g. `application/pdf`, `image/png`)
- `Content-Disposition`: `inline; filename="<original-name>"` (สำหรับ preview ใน browser)
- `Content-Length`: ขนาดไฟล์
- Body: raw binary

**ความแตกต่างจาก endpoint เดิม:**

| Endpoint | Response |
|----------|----------|
| `GET /:filetoken` | JSON: `{ data: { buffer: base64, ... }, success, ... }` |
| `GET /:filetoken/download` | Raw binary stream + binary-friendly headers |

## Architecture

ใช้ TCP `cmd: 'file.get'` เดิมของ micro-file (ไม่สร้าง message pattern ใหม่) เพื่อหลีกเลี่ยง TCP message drift ตาม gotcha ใน CLAUDE.md

**Flow:**

1. Gateway controller รับ request ที่ `:filetoken/download`
2. Gateway service ส่ง TCP `cmd: 'file.get'` ไปยัง micro-file (ใช้ของเดิม)
3. micro-file return `{ data: { buffer: base64, fileName, mimeType, size } }`
4. Gateway service decode `base64` → `Buffer` แล้ว return เป็น object `{ buffer, contentType, fileName, size }`
5. Gateway controller set headers แล้ว `res.send(buffer)` (ไม่ใช้ `this.respond()` wrapper)

## Components

### 1. Gateway

**File:** `apps/backend-gateway/src/application/document-management/document-management.controller.ts`

เพิ่ม method ใหม่:

```ts
@Get(':filetoken/download')
@UseGuards(new AppIdGuard('documents.download'))
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Download document binary',
  description: 'Streams the raw binary content of a procurement document for direct browser viewing or download (images, PDFs). Unlike the JSON-wrapped variant, this returns the file body with proper Content-Type/Content-Disposition headers.',
  'x-description-th': 'ดาวน์โหลดไฟล์ binary โดยตรง สำหรับเปิดดูในเบราว์เซอร์',
  operationId: 'downloadDocument',
} as any)
async downloadDocument(
  @Param('filetoken') fileToken: string,
  @Param('bu_code') bu_code: string,
  @Req() req: Request,
  @Res() res: Response,
): Promise<void> {
  // ดึงไฟล์ผ่าน service, set headers, res.send(buffer)
}
```

**File:** `apps/backend-gateway/src/application/document-management/document-management.service.ts`

เพิ่ม method ใหม่:

```ts
async downloadDocument(
  fileToken: string,
  user_id: string,
  bu_code: string,
): Promise<Result<{ buffer: Buffer; contentType: string; fileName: string; size: number }>>
```

- ส่ง `cmd: 'file.get'` (เดิม) ไปยัง micro-file
- Decode `response.data.buffer` (base64) → `Buffer`
- Return `Result.ok({ buffer, contentType, fileName, size })`
- Error path: return `Result.error()` เหมือน method อื่น

### 2. Micro-file

**ไม่ต้องแก้ไข** — ใช้ `@MessagePattern({ cmd: 'file.get', service: 'files' })` เดิม

### 3. Permission

เพิ่ม permission key `documents.download` ใน permission seed:
- `packages/prisma-shared-schema-platform/prisma/seed/permissions/` (ตรวจดู path ปัจจุบัน)
- ระดับ permission เทียบเท่ากับ `documents.get` (read access)

### 4. Bruno

**File:** `apps/bruno/carmen-inventory/documents-and-reports/documents/06 - Download Document.bru`

เนื้อหา:
- `GET {{host}}/api/{{bu_code}}/documents/:filetoken/download`
- Path param `filetoken` (สามารถใช้ vars:pre-request เดียวกับ `02 - Get Document.bru`)
- Header `x-app-id: {{x_app_id}}`, `Authorization: Bearer {{access_token}}`
- Docs section อธิบาย response เป็น raw binary stream

หลังจากเพิ่ม endpoint แล้ว ต้องรัน `bun run bruno:sync:dry` เพื่อยืนยันว่าไม่มี orphan

## Error Handling

| Status | When |
|--------|------|
| 200 | สำเร็จ — return binary |
| 401 | Bearer token หาย/ไม่ถูกต้อง |
| 403 | ไม่มี permission `documents.download` |
| 404 | filetoken ไม่พบใน storage |
| 500 | error จาก micro-file หรือ S3 |

Error response (status ≠ 200) ยังคงเป็น JSON ตาม Result wrapper เดิม — ใช้ `this.respond(res, errResult)` เมื่อ Result เป็น error, ส่วนกรณีสำเร็จเท่านั้นที่ส่ง raw binary

## Testing

**Unit tests:**
- `document-management.controller.spec.ts` — เพิ่ม test สำหรับ `downloadDocument`:
  - happy path: response.send ถูกเรียกพร้อม buffer + headers ถูกต้อง
  - error path: ใช้ `respond()` ส่ง error JSON
- `document-management.service.spec.ts` — เพิ่ม test สำหรับ `downloadDocument`:
  - decode base64 ถูกต้อง
  - error path คืน `Result.error()`

**Manual test:**
- Bruno: เปิดไฟล์ `06 - Download Document.bru` แล้วยิง — ควรได้ binary
- Browser: เปิด URL ตรง ๆ พร้อม token — ควรเปิดรูป/PDF ได้

## Out of Scope

- Range request / partial content (Accept-Ranges) — ไว้ทำในรอบหลัง
- Streaming จาก micro-file (ปัจจุบัน TCP คืน base64; ถ้าต้องการ stream จริง ๆ ต้องเปลี่ยน transport)
- ETag / cache headers
