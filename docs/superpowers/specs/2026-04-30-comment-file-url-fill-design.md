# Comment Attachment fileUrl Fill — Design

**Date:** 2026-04-30
**Status:** Draft

## Goal

ทุก `*-comment` service ใน backend-gateway ต้อง compose ค่า `fileUrl` ของ attachment ให้เป็น relative download URL `/api/{bu_code}/documents/{encodeURIComponent(fileToken)}/download` ทั้งใน:

1. **Upload path** — ตอนสร้าง `UploadedAttachment` ใน `uploadFile()` (แทนค่าเดิม `fileUrl: ''`)
2. **Read path** — ตอน return `findAllByParentId()` / `findById()` (backfill comment เก่าที่ DB มี `fileUrl: ''` หรือ `null`)

ตอนนี้ frontend ต้อง compose URL เอง — เปลี่ยนให้ gateway ทำให้แทน เพื่อให้ payload ส่งกลับมีลิงก์พร้อมใช้

## URL Format

```
/api/{bu_code}/documents/{encodeURIComponent(fileToken)}/download
```

- **Relative** (ไม่มี host) — frontend ต่อ host เอง รองรับทุก deployment
- **Encoded** `fileToken` — `T02/uuid` → `T02%2Fuuid` (ตรงกับที่ Bruno ใช้และ NestJS path param ต้องการ)

## Architecture

### Shared helper

**File:** `apps/backend-gateway/src/common/helpers/document-download-url.ts`

```ts
/**
 * Build a relative download URL for a document attachment.
 * สร้าง relative URL สำหรับดาวน์โหลดเอกสารแนบ
 */
export function buildDocumentDownloadUrl(bu_code: string, fileToken: string): string {
  return `/api/${bu_code}/documents/${encodeURIComponent(fileToken)}/download`;
}

/**
 * Walk an attachments array and fill in `fileUrl` for any item that
 * has a `fileToken` but is missing/empty `fileUrl`. Returns a new array.
 * เติม fileUrl ใน attachments ที่ยังว่างจาก fileToken
 */
export function fillAttachmentUrls<
  T extends { fileToken?: string | null; fileUrl?: string | null },
>(attachments: T[] | undefined | null, bu_code: string): T[] | undefined | null {
  if (!Array.isArray(attachments)) return attachments;
  return attachments.map((a) => {
    if (!a || typeof a.fileToken !== 'string' || a.fileToken.length === 0) return a;
    if (typeof a.fileUrl === 'string' && a.fileUrl.length > 0) return a;
    return { ...a, fileUrl: buildDocumentDownloadUrl(bu_code, a.fileToken) };
  });
}
```

### Upload path

ใน `uploadFile()` ของแต่ละ service เปลี่ยน:

```ts
return {
  // ...
  fileUrl: '',
  // ...
};
```

เป็น:

```ts
return {
  // ...
  fileUrl: buildDocumentDownloadUrl(bu_code, String(data?.fileToken ?? '')),
  // ...
};
```

### Read path

ใน `findAllByParentId()` / `findById()` (และ method อื่นที่ return comment data) ของแต่ละ service เพิ่ม backfill ก่อน return:

```ts
// shape มักเป็น: response.data = Array<{ ..., attachments?: [...] }>
// หรือ response.data = { ..., attachments?: [...] } สำหรับ findById
const filled = Array.isArray(response.data)
  ? response.data.map((row) => ({
      ...row,
      attachments: fillAttachmentUrls((row as any).attachments, bu_code),
    }))
  : response.data && typeof response.data === 'object'
    ? {
        ...response.data,
        attachments: fillAttachmentUrls((response.data as any).attachments, bu_code),
      }
    : response.data;
return ResponseLib.successWithPaginate(filled, response.paginate);
```

(รูปแบบเดียวกันแต่อาจปรับนิดหน่อยตาม shape ของแต่ละ service — บาง service `findAll` ส่ง paginated, บางที่ส่ง array ตรง ๆ)

## Scope

**47 services ต้องแก้:**

ทุก directory `apps/backend-gateway/src/application/*-comment/` ที่มี service file อ้างถึง `fileUrl: ''` (ตรวจสอบแล้ว ทั้งหมด 47 ไฟล์ผ่าน `grep -rln "fileUrl: ''"`).

แต่ละ service ปรับ:
- `uploadFile()` — แทน `fileUrl: ''` ด้วย call helper
- `findAllByParentId()` (หรือชื่อใกล้เคียง) — backfill ก่อน return
- `findById()` ถ้ามี — backfill ก่อน return

## Helpers Re-Use

`scripts/apply-comment-logic/run.ts` (codemod ที่มีอยู่ — สำหรับงานนี้ของเก่า) **ไม่นำมาใช้** เพราะรูปแบบการแก้ครั้งนี้แตกต่าง (เพิ่ม import + แก้ object literal ใน 2 จุดต่อไฟล์ ไม่ใช่ ASTpaste-block) จะใช้การแก้แบบ targeted edit per file ผ่าน plan ที่มี checklist

## Error Handling

Helper เป็น pure function ไม่ throw — ถ้า input ไม่ใช่ array ก็ pass-through, ถ้า `fileToken` ว่างก็ pass-through (เก็บ `fileUrl: ''` ไว้ตามเดิม). ดังนั้นไม่กระทบ error path ที่มีอยู่

## Testing

**Helper unit tests** — `apps/backend-gateway/src/common/helpers/document-download-url.spec.ts`:
- `buildDocumentDownloadUrl` encode `/` ใน fileToken เป็น `%2F`
- `fillAttachmentUrls` เติม fileUrl เฉพาะ entries ที่ว่าง
- `fillAttachmentUrls` ไม่แตะ entries ที่มี fileUrl อยู่แล้ว
- `fillAttachmentUrls` ไม่แตะ entries ที่ไม่มี fileToken
- `fillAttachmentUrls` คืน input เดิม (pass-through) ถ้า input ไม่ใช่ array

**Per-service tests:** ไม่บังคับ (ถ้ามี existing spec อยู่แล้วให้รันให้ผ่าน) — focus ที่ helper test

**Manual:** ยิง endpoint `findAllByParentId` ของ comment service สักตัวที่มี attachments — ดูว่า response มี `fileUrl` ครบ

## Out of Scope

- Backfill ใน DB — เก็บ `fileToken` เป็น source of truth, URL เป็น derived
- เปลี่ยน format URL ใน comment เก่า ที่มี `fileUrl` non-empty อยู่แล้ว (เช่น presigned URL เก่า) — helper จะไม่ overwrite
- Permission check ที่ download endpoint — endpoint เองมี `documents.download` guard อยู่แล้ว
