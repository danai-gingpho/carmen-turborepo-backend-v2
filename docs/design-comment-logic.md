# Comment Endpoint Logic (Shared Pattern)

ขอบเขตเอกสารนี้: รวม logic ของทุก endpoint ของ comment modules ที่ refactor ใน
รอบ 2026-04-29 ใช้รูปแบบเดียวกันทุกโมดูล:

โมดูลทั้งหมดใน `apps/backend-gateway/src/application/*-comment/` ใช้ pattern เดียวกัน
(46 โมดูล ณ 2026-04-29) เช่น `physical-count-comment`, `physical-count-detail-comment`,
`credit-note-comment`, `credit-note-detail-comment`, `purchase-order-comment`,
`good-received-note-detail-comment`, ฯลฯ — refactor ครั้งหลังทำผ่าน 2 codemods:

- `scripts/apply-comment-logic/run.ts` — gateway controller/service/dto
- `scripts/apply-comment-logic/bruno.ts` — Bruno collection (.bru files + docs)
  ครอบคลุม 47 โฟลเดอร์ใน `apps/bruno/carmen-inventory/**/*-comment/`

โมดูลใหม่ที่จะเพิ่มในอนาคต — ใช้ pattern เดียวกัน รัน codemod ทั้งสองตัวซ้ำได้

ไฟล์ที่เกี่ยวข้อง (กลุ่ม `<comment-prefix>` แทนได้ทั้ง `physical-count-comment`
และ `physical-count-detail-comment`):
- Controller: `apps/backend-gateway/src/application/<comment-prefix>/<comment-prefix>.controller.ts`
- Service: `apps/backend-gateway/src/application/<comment-prefix>/<comment-prefix>.service.ts`
- DTOs: `dto/<comment-prefix>.dto.ts`, `dto/upload-comment-with-files.dto.ts`
- Bruno collection: `apps/bruno/carmen-inventory/inventory/<comment-prefix>/`
- Business handlers (อ้างอิง): `apps/micro-business/src/inventory/physical-count/physical-count.controller.ts`
  → `@MessagePattern({ cmd: '<comment-prefix>.<action>', service: '<comment-prefix>' หรือ 'physical-count' })`

URL pattern (ตัวยึดตัวเองคือ `<parent_id>` = `physical_count_id` หรือ `physical_count_detail_id`):
- `GET    /api/:bu_code/<comment-prefix>/:<parent_id>` — list (with paginate)
- `POST   /api/:bu_code/<comment-prefix>/:<parent_id>` — create with files (multipart)
- `PATCH  /api/:bu_code/<comment-prefix>/:id` — update with attachment add/remove (multipart)
- `DELETE /api/:bu_code/<comment-prefix>/:id` — soft-delete (S3 cleanup ก่อน)
- `POST   /api/:bu_code/<comment-prefix>/:id/attachment` — batch add attachments (multipart)
- `DELETE /api/:bu_code/<comment-prefix>/:id/attachment/:fileToken` — remove single attachment

ค่าคงที่ใช้ร่วมกัน (controller-level):
- `MAX_FILES = 10`
- `MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024` (10 MB)
- `ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']`

ทุก endpoint:
- ป้องกันด้วย `KeycloakGuard`, `PermissionGuard`, `AppIdGuard('physicalCountDetailComment.<action>')`
- ใส่ header `x-app-id` (บังคับ)
- รองรับ query `version` (default `latest`)
- ใช้ `ExtractRequestHeader(req).user_id` เป็น actor
- ตอบกลับผ่าน `ResponseLib` หรือ `Result.error` พร้อม `httpStatusToErrorCode`

---

## 1. List comments — `GET /api/:bu_code/physical-count-detail-comment/:physical_count_detail_id`

URL ใหม่หลัง refactor (เดิมคือ `/physical-count-detail/:id/comments`)

Flow
1. Validate `physical_count_detail_id` เป็น UUID v4
2. Build pagination จาก query (`page`, `perpage`, ฯลฯ) ผ่าน `PaginateQuery`
3. ส่ง `{ cmd: 'physical-count-detail-comment.find-all-by-physical-count-detail-id', service: 'physical-count' }`
   ไปยัง `BUSINESS_SERVICE`
4. ตอบกลับ `ResponseLib.successWithPaginate(response.data, response.paginate)`

Response: paginated array ของ comments พร้อม `attachments[]` (มี `fileToken`)
- `fileUrl` ใน response จะว่าง — frontend ต้องเรียก
  `GET /api/{bu_code}/documents/presigned-url/{fileToken}` แสดงผล

---

## 2. Create comment with files — `POST /api/:bu_code/physical-count-detail-comment/:physical_count_detail_id`

URL ใหม่หลัง refactor (เดิมคือ `/physical-count-detail-comment/upload` พร้อม
`physical_count_detail_id` ใน body — ปัจจุบัน `physical_count_detail_id` อยู่ใน URL path
และไม่มี `/upload` suffix)

Body: `multipart/form-data`
- `message` (text, optional, ≤ 4000 chars)
- `type` (text, optional, default `user`, enum `user|system`)
- `files` (binary, optional, repeatable, 0–10 ไฟล์)
- ต้องส่งอย่างน้อยหนึ่งใน `message` หรือ `files`

Validation
- Zod: `UploadCommentWithFilesBodySchema` (`message`, `type`)
- Controller: file count, size, mime + อย่างน้อยหนึ่งใน message/files

Service: `createWithFiles(files, dto, user_id, bu_code, version)`
1. Upload ทุกไฟล์ไป S3 แบบ parallel ผ่าน `file.upload` (`FILE_SERVICE`)
2. ถ้า upload ใดล้มเหลว → rollback ไฟล์ที่สำเร็จแล้วผ่าน `file.delete`
   แล้ว `throw BadGatewayException`
3. ส่ง `{ cmd: 'physical-count-detail-comment.create' }` ไปยัง `BUSINESS_SERVICE`
   ด้วย payload:
   ```json
   {
     "data": {
       "physical_count_detail_id": "<uuid>",
       "message": "...",
       "type": "user",
       "attachments": [<UploadedAttachment>]
     }
   }
   ```
4. ถ้า business ตอบ error → rollback ลบไฟล์ที่ upload แล้วใน S3,
   คืน `Result.error`
5. ถ้าสำเร็จ → `ResponseLib.created(response.data)` (HTTP 201)

---

## 3. Update comment — `PATCH /api/:bu_code/physical-count-detail-comment/:id`

Body: `multipart/form-data` (ไม่ใช่ JSON)
- `message` (text, optional)
- `type` (text, optional, enum `user|system`)
- `files` (binary, repeatable, optional) — ไฟล์ใหม่ที่จะ add
- `remove_attachments` (text, optional) — JSON-encoded array ของ `fileToken` ที่จะลบ
  เช่น `'["tok-1","tok-2"]'`
- ต้องส่งอย่างน้อยหนึ่งใน message/type/files/remove_attachments

Validation
- Zod: `UpdatePhysicalCountDetailCommentBodySchema` (รวม preprocess
  parse JSON ของ `remove_attachments`)
- Controller: file count/size/mime + อย่างน้อยหนึ่งฟิลด์

Service: `update(id, { message, type, addFiles, removeFileTokens }, ...)`
1. **Add**: upload `addFiles` ไป S3 แบบ parallel; ล้มเหลว → rollback +
   `BadGatewayException`
2. **Remove**: ลบ `removeFileTokens` จาก S3 แบบ parallel (best-effort,
   log warn token ที่ลบไม่สำเร็จ)
3. ประกอบ data:
   ```json
   {
     "message": "...",
     "type": "user",
     "attachments": {
       "add": [<UploadedAttachment>],
       "remove": ["tok-1", "tok-2"]
     }
   }
   ```
   (key `attachments` ใส่เฉพาะเมื่อมี add หรือ remove)
4. ส่ง `{ cmd: 'physical-count-detail-comment.update' }` ไปยัง `BUSINESS_SERVICE`
5. ถ้าสำเร็จ → `ResponseLib.success(response.data)`
6. ถ้า business error → rollback ลบไฟล์ที่ upload ในขั้น add ออกจาก S3,
   คืน `Result.error`

> หมายเหตุ: micro-business handler ของ `update` ต้องรองรับ shape
> `attachments: { add, remove }` (ไม่ใช่ flat array แบบเดิม) — follow-up
> ฝั่ง business service

---

## 4. Delete comment — `DELETE /api/:bu_code/physical-count-detail-comment/:id`

Service: `delete(id, user_id, bu_code, version)`

Flow (ลำดับสำคัญ — S3 cleanup **ก่อน** soft-delete)
1. ส่ง `{ cmd: 'physical-count-detail-comment.find-by-id' }` ไปยัง `BUSINESS_SERVICE`
   เพื่ออ่าน `attachments[].fileToken`
2. หาก find-by-id ตอบ non-OK → คืน `Result.error` ไม่ดำเนินการต่อ
3. ลบทุกไฟล์ใน S3 ผ่าน `file.delete` แบบ parallel (best-effort,
   log warn fileTokens ที่ลบไม่สำเร็จ)
4. ส่ง `{ cmd: 'physical-count-detail-comment.delete' }` ไปยัง business
   เพื่อ soft-delete (set `deleted_at`)
5. ถ้าสำเร็จ → `ResponseLib.success(response.data)`

ความเสี่ยง
- หาก step 4 ล้มเหลวหลังจากลบ S3 ใน step 3 — ไฟล์หายไปแล้วแต่ comment ยังอยู่
  ระวังเรื่อง retry/recovery (อาจต้องมีจ๊อบล้างหรือ flag attachment เป็น "missing")

---

## 5. Add attachments (batch) — `POST /api/:bu_code/physical-count-detail-comment/:id/attachment`

URL เดิมแต่เปลี่ยน body จาก JSON-single เป็น multipart-array

Body: `multipart/form-data`
- `files` (binary, repeatable, required, 1–10 ไฟล์)

Service: `addAttachments(id, files, user_id, bu_code, version)`
1. Upload ทุกไฟล์ไป S3 แบบ parallel
2. ล้มเหลว → rollback ไฟล์ที่สำเร็จ + `BadGatewayException`
3. ส่ง `{ cmd: 'physical-count-detail-comment.add-attachment' }` ไปยัง business
   ด้วย payload `{ id, attachments: [<UploadedAttachment>] }`
4. ถ้า business error → rollback ไฟล์ที่ upload ใน S3, คืน `Result.error`
5. ถ้าสำเร็จ → `ResponseLib.success(response.data)`

> หมายเหตุ: micro-business handler `add-attachment` เดิมรับ `attachment` (single)
> ต้อง update ให้รองรับ `attachments` (array) — follow-up ฝั่ง business

---

## 6. Remove attachment (single) — `DELETE /api/:bu_code/physical-count-detail-comment/:id/attachment/:fileToken`

ยังคงเดิม ไม่เปลี่ยน

Service: `removeAttachment(id, fileToken, ...)`
1. ส่ง `{ cmd: 'physical-count-detail-comment.remove-attachment' }` ไปยัง business
   ด้วย `{ id, fileToken }`
2. คืน `ResponseLib.success` หรือ `Result.error` ตามผลลัพธ์
3. **ไม่** ลบไฟล์จาก S3 — งานลบ S3 ทำที่ business handler

(สำหรับการลบหลายไฟล์ในคำขอเดียว / รวมกับการเพิ่มไฟล์ใหม่ ใช้ endpoint
`PATCH .../physical-count-detail-comment/:id` ที่รองรับ
`attachments: { add, remove }`)

---

## Helpers (service-level)

`uploadFile(file, user_id, bu_code) → UploadedAttachment`
- Convert buffer → base64
- ส่ง `{ cmd: 'file.upload', service: 'files' }` ไปยัง `FILE_SERVICE`
- ถ้า `response.success === false` → `throw BadGatewayException`
- คืน `{ fileName, fileToken, fileUrl: '', contentType, size }`

`deleteFile(fileToken, user_id, bu_code) → boolean`
- ส่ง `{ cmd: 'file.delete', service: 'files' }`
- catch error / non-success → log warn/error, คืน `false` (best-effort)
- ใช้สำหรับ rollback หรือ S3 cleanup ใน flows อื่น

---

## Endpoints ที่ลบทิ้งหลัง refactor (อย่าใช้/อย่าฟื้นคืน)

- `POST /api/:bu_code/physical-count-detail-comment` (JSON create) — ถูกแทนด้วย
  multipart `POST :physical_count_detail_id`
- `GET /api/:bu_code/physical-count-detail-comment/:id` (find-by-id) — ลบทิ้ง,
  เพราะ URL pattern ทับกับ list-by-detail. ยังใช้ `find-by-id` ใน business
  ผ่าน `delete` flow (S3 cleanup)
- `GET /api/:bu_code/physical-count-detail/:physical_count_detail_id/comments` —
  ย้ายไปใช้ `GET /api/:bu_code/physical-count-detail-comment/:physical_count_detail_id`
- `POST /api/:bu_code/physical-count-detail-comment/upload` — เปลี่ยน URL
  ไม่มี `/upload` suffix แล้ว, `physical_count_detail_id` อยู่ใน path

---

## Pattern สรุป

- Multipart endpoints ที่ยุ่งกับไฟล์ (POST create, PATCH update, POST attachment):
  upload-first-then-write กับ rollback ทั้ง S3 และ business call
- Body ที่ใช้ JSON-encoded array ใน multipart (เช่น `remove_attachments`)
  ใช้ Zod `preprocess` แปลงสตริง JSON → array ก่อน validate
- Soft-delete flows ที่มี attachments → ลบ S3 ก่อน flag DB
- Best-effort S3 cleanup → log warn พร้อม `failed_tokens` ไม่ throw
- Non-2xx จาก business → rollback S3 (ถ้าเพิ่ง upload), คืน `Result.error`
  พร้อม error code จาก `httpStatusToErrorCode`
