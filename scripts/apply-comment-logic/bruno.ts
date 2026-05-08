/**
 * Bruno codemod — regenerate `.bru` files for every `*-comment` folder under
 * `apps/bruno/carmen-inventory/` to match the new shared comment-logic pattern.
 *
 * For each folder it:
 *  - Deletes obsolete files: `02 - Get ...`, `03 - Create ...`
 *  - Rewrites: `01 - List`, `04 - Update`, `05 - Delete`,
 *    `06 - Add ... Attachment`, `07 - Remove ... Attachment`,
 *    `POST-create-with-files.bru`
 *  - Skips folders under `_archived/`
 *
 * Run with:
 *   bun run scripts/apply-comment-logic/bruno.ts            # dry-run
 *   bun run scripts/apply-comment-logic/bruno.ts --apply    # write
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync, statSync } from 'fs';
import { join, relative } from 'path';

const repoRoot = join(import.meta.dir, '..', '..');
const brunoBase = join(repoRoot, 'apps', 'bruno', 'carmen-inventory');
const APPLY = process.argv.includes('--apply');

interface ModuleInfo {
  folder: string;       // e.g., 'purchase-order-comment'
  prefix: string;       // same as folder
  parentRoute: string;  // e.g., 'purchase-order'
  parentIdName: string; // e.g., 'purchase_order_id'
  humanName: string;    // e.g., 'Purchase Order Comment'
  parentHuman: string;  // e.g., 'Purchase Order'
}

function toHuman(slug: string): string {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function detectModule(folder: string): ModuleInfo {
  const parentRoute = folder.replace(/-comment$/, '');
  const parentIdName = parentRoute.replace(/-/g, '_') + '_id';
  return {
    folder,
    prefix: folder,
    parentRoute,
    parentIdName,
    humanName: toHuman(folder),
    parentHuman: toHuman(parentRoute),
  };
}

function findCommentDirs(root: string): string[] {
  const result: string[] = [];
  function walk(dir: string) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith('_archived')) continue;
      const sub = join(dir, e.name);
      if (e.name.endsWith('-comment')) {
        result.push(sub);
      } else {
        walk(sub);
      }
    }
  }
  walk(root);
  return result;
}

// ---- templates --------------------------------------------------------------

function bruList(m: ModuleInfo): string {
  return `meta {
  name: Find all by ${m.parentRoute.replace(/-/g, ' ')} id ${m.folder}
  type: http
  seq: 1
}

get {
  url: {{host}}/api/{{bu_code}}/${m.prefix}/:${m.parentIdName}
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

query {
  ~version:
}

params:path {
  ${m.parentIdName}: {{test_id}}
}

vars:pre-request {
  test_id: 5d5fa453-f687-4fcd-bbdb-5956f7e810b3
}

docs {
  ## List ${m.humanName}s
  แสดงความคิดเห็นทั้งหมดของ ${m.parentRoute} (พร้อม pagination)

  ### URL
  \`GET {{host}}/api/{{bu_code}}/${m.prefix}/:${m.parentIdName}\`

  ### Path Parameters
  - \`bu_code\` — Business unit code
  - \`${m.parentIdName}\` — ${m.parentHuman} UUID

  ### Query Parameters
  - \`version\` (optional) — API version (default \`latest\`)
  - Pagination params (\`page\`, \`perpage\`, etc.)

  ### Sample Response 200
  \`\`\`json
  {
    "data": [
      {
        "id": "uuid",
        "${m.parentIdName}": "uuid",
        "message": "comment text",
        "type": "user",
        "attachments": [
          {
            "fileName": "photo.jpg",
            "fileToken": "tok-1",
            "fileUrl": "",
            "contentType": "image/jpeg",
            "size": 204800
          }
        ],
        "created_at": "2026-04-29T00:00:00.000Z"
      }
    ],
    "paginate": {
      "total": 100,
      "page": 1,
      "perpage": 10,
      "pages": 10
    },
    "status": 200,
    "success": true,
    "message": "Success",
    "timestamp": "2026-04-29T00:00:00.000Z"
  }
  \`\`\`

  Note: \`fileUrl\` ใน response จะว่าง — frontend ต้องเรียก
  \`GET /api/{bu_code}/documents/presigned-url/{fileToken}\` เพื่อแสดงไฟล์
}
`;
}

function bruUpdate(m: ModuleInfo): string {
  return `meta {
  name: Update ${m.folder}
  type: http
  seq: 4
}

patch {
  url: {{host}}/api/{{bu_code}}/${m.prefix}/:id
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
  ~version:
}

params:path {
  id: {{test_id}}
}

body:json {
  {}
}

body:multipart-form {
  ~message: Updated comment text
  ~type: user
  ~remove_attachments: ["tok-old-1","tok-old-2"]
  ~files: @file(/Users/samutpra/Pictures/logo.png)
}

docs {
  ## Update ${m.humanName} (multipart with attachment add/remove)
  แก้ไขความคิดเห็นของ ${m.parentRoute} พร้อมเพิ่ม/ลบไฟล์แนบใน request เดียว

  ### URL
  \`PATCH {{host}}/api/{{bu_code}}/${m.prefix}/:id\`

  ### Path Parameters
  - \`bu_code\` — Business unit code
  - \`id\` — Comment UUID

  ### Body (multipart/form-data)
  ส่งอย่างน้อยหนึ่งฟิลด์ — ส่งทั้งหมดเป็น optional ได้:
  - \`message\` (text) — ข้อความใหม่ (≤ 4000 ตัวอักษร)
  - \`type\` (text) — \`user\` | \`system\`
  - \`files\` (binary, repeatable) — ไฟล์ใหม่ที่จะเพิ่ม (add)
  - \`remove_attachments\` (text) — JSON-encoded array ของ fileTokens ที่จะลบ
    เช่น \`["tok-1","tok-2"]\`

  ### Constraints (สำหรับ \`files\`)
  - max 10 files per request
  - max 10 MB per file
  - allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf

  ### Gateway behavior
  1. Upload ไฟล์ใน \`files\` ทั้งหมดไปยัง S3 (rollback หาก upload บางไฟล์ล้มเหลว → 502)
  2. ลบไฟล์ใน \`remove_attachments\` ออกจาก S3 (best-effort, log warn หากบางตัวล้มเหลว)
  3. Forward ไปยัง business service ด้วย payload:
     \`\`\`json
     {
       "data": {
         "message": "...",
         "type": "user",
         "attachments": {
           "add": [<uploaded attachment objects>],
           "remove": ["tok-old-1", "tok-old-2"]
         }
       }
     }
     \`\`\`
  4. หาก business update ล้มเหลว — rollback ลบไฟล์ใหม่ที่ upload ไปแล้วออกจาก S3

  ### Sample Response 200
  \`\`\`json
  {
    "data": { "id": "uuid" },
    "paginate": null,
    "status": 200,
    "success": true,
    "message": "Success",
    "timestamp": "2026-04-29T00:00:00.000Z"
  }
  \`\`\`
}
`;
}

function bruDelete(m: ModuleInfo): string {
  return `meta {
  name: Remove ${m.folder}
  type: http
  seq: 5
}

delete {
  url: {{host}}/api/{{bu_code}}/${m.prefix}/:id
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

query {
  ~version:
}

params:path {
  id: {{test_id}}
}

docs {
  ## Delete ${m.humanName}
  ลบความคิดเห็นของ ${m.parentRoute} (soft delete) พร้อมลบไฟล์แนบจาก S3

  ### URL
  \`DELETE {{host}}/api/{{bu_code}}/${m.prefix}/:id\`

  ### Path Parameters
  - \`bu_code\` — Business unit code
  - \`id\` — Comment UUID

  ### Gateway behavior
  1. ดึงข้อมูล comment ผ่าน \`${m.prefix}.find-by-id\` เพื่อ
     อ่าน \`attachments[].fileToken\`
  2. ลบไฟล์ทุกตัวออกจาก S3 ผ่าน \`file.delete\` (best-effort, log warn หากบางตัวล้มเหลว)
  3. ส่ง \`${m.prefix}.delete\` ไปยัง business service เพื่อ
     soft-delete record (set \`deleted_at\`)

  > Important: S3 cleanup ทำ **ก่อน** flag delete เพื่อป้องกัน orphan files

  ### Sample Response 200
  \`\`\`json
  {
    "data": { "id": "uuid" },
    "paginate": null,
    "status": 200,
    "success": true,
    "message": "Success",
    "timestamp": "2026-04-29T00:00:00.000Z"
  }
  \`\`\`
}
`;
}

function bruAddAttachment(m: ModuleInfo): string {
  return `meta {
  name: Add attachments ${m.folder}
  type: http
  seq: 6
}

post {
  url: {{host}}/api/{{bu_code}}/${m.prefix}/:id/attachment
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
  ~version:
}

params:path {
  id: {{test_id}}
}

body:json {
  {}
}

body:multipart-form {
  files: @file(/Users/samutpra/Pictures/logo.png)
  files: @file(/Users/samutpra/Pictures/logo_CARMEN_Classic-Blue_low-res.png)
}

docs {
  ## Add Attachments to ${m.humanName} (multipart, batch upload)
  อัปโหลดไฟล์แนบหลายไฟล์เข้ากับคอมเมนต์ที่มีอยู่แล้วใน request เดียว

  ### URL
  \`POST {{host}}/api/{{bu_code}}/${m.prefix}/:id/attachment\`

  ### Path Parameters
  - \`bu_code\` — Business unit code
  - \`id\` — Comment UUID

  ### Body (multipart/form-data)
  - \`files\` (binary, repeatable) — ไฟล์แนบ (ต้องมีอย่างน้อย 1 ไฟล์)

  ### Constraints
  - 1–10 files per request
  - max 10 MB per file
  - allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf

  ### Gateway behavior
  1. Upload ทุกไฟล์ไป S3 ผ่าน \`file.upload\` (parallel)
  2. หาก upload ใดล้มเหลว — rollback (ลบไฟล์ที่ upload สำเร็จออกจาก S3) แล้วตอบ 502
  3. ส่ง \`{ id, attachments: [...] }\` ไปยัง business service ผ่าน
     \`${m.prefix}.add-attachment\`
  4. หาก business ตอบ error — rollback ลบไฟล์ที่ upload ไปแล้วออกจาก S3

  ### Sample Response 200
  \`\`\`json
  {
    "data": { "id": "uuid", "attachments": [...] },
    "paginate": null,
    "status": 200,
    "success": true,
    "message": "Success",
    "timestamp": "2026-04-29T00:00:00.000Z"
  }
  \`\`\`

  Note: \`fileUrl\` ใน response จะว่าง — frontend ต้องเรียก
  \`GET /api/{bu_code}/documents/presigned-url/{fileToken}\` เพื่อแสดงไฟล์
}
`;
}

function bruRemoveAttachment(m: ModuleInfo): string {
  return `meta {
  name: Remove attachment ${m.folder}
  type: http
  seq: 7
}

delete {
  url: {{host}}/api/{{bu_code}}/${m.prefix}/:id/attachment/:fileToken
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

query {
  ~version:
}

params:path {
  id: {{test_id}}
  fileToken:
}

docs {
  ## Remove ${m.humanName} Attachment
  ลบไฟล์แนบเดี่ยวออกจากคอมเมนต์ ผ่าน fileToken

  ### URL
  \`DELETE {{host}}/api/{{bu_code}}/${m.prefix}/:id/attachment/:fileToken\`

  ### Path Parameters
  - \`bu_code\` — Business unit code
  - \`id\` — Comment UUID
  - \`fileToken\` — File token (\`bu_code/uuid\`) ของไฟล์แนบที่จะลบ

  ### Note
  Endpoint นี้ลบ attachment record ใน DB ของคอมเมนต์
  ถ้าต้องการลบหลายไฟล์ในคำขอเดียว / ผสมกับการเพิ่มไฟล์ใหม่ ใช้ \`04 - Update\`
  ที่รองรับ \`attachments: { add, remove }\` ในรูปแบบ multipart

  ### Sample Response 200
  \`\`\`json
  {
    "data": { "id": "uuid" },
    "paginate": null,
    "status": 200,
    "success": true,
    "message": "Success",
    "timestamp": "2026-04-29T00:00:00.000Z"
  }
  \`\`\`
}
`;
}

function bruCreateWithFiles(m: ModuleInfo): string {
  return `meta {
  name: Create with files ${m.folder}
  type: http
  seq: 2
}

post {
  url: {{host}}/api/{{bu_code}}/${m.prefix}/{{${m.parentIdName}}}
  body: multipartForm
  auth: bearer
}

params:query {
  ~version: latest
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

body:json {
  {}
}

body:multipart-form {
  message: Comment with attached photos
  type: user
  files: @file(/Users/samutpra/Pictures/logo.png)
  files: @file(/Users/samutpra/Pictures/logo_CARMEN_Classic-Blue_low-res.png)
}

vars:pre-request {
  ${m.parentIdName}: 5d5fa453-f687-4fcd-bbdb-5956f7e810b3
}

docs {
  ## Create ${m.humanName} (with file uploads)
  สร้างความคิดเห็นใหม่สำหรับ ${m.parentRoute} พร้อมแนบไฟล์ใน request เดียว
  ไม่ต้อง upload file แยกก่อน

  \`${m.parentIdName}\` ระบุผ่าน URL path parameter (ไม่ใช่ body field)

  ### URL
  \`POST {{host}}/api/{{bu_code}}/${m.prefix}/:${m.parentIdName}\`

  ### Path Parameters
  - \`bu_code\` — Business unit code
  - \`${m.parentIdName}\` — ${m.parentHuman} UUID

  ### Body (multipart/form-data)
  - \`message\` (text, optional) — ข้อความคอมเมนต์ ≤ 4000 ตัวอักษร
  - \`type\` (text, optional, default \`user\`) — \`user\` | \`system\`
  - \`files\` (binary, optional, repeatable) — ไฟล์แนบ

  ต้องส่งอย่างน้อยหนึ่งใน \`message\` หรือ \`files\`

  ### Constraints
  - max 10 files per request
  - max 10 MB per file
  - allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf

  ### Gateway behavior
  1. Upload ทุกไฟล์ไป S3 ผ่าน \`file.upload\`
  2. หาก upload ใดล้มเหลว — rollback (ลบไฟล์ที่ upload สำเร็จออกจาก S3) แล้วตอบ 502
  3. Forward \`{ ${m.parentIdName}, message, type, attachments: [...] }\` ไปยัง business service
  4. หาก business service ตอบ error — rollback ลบไฟล์ที่ upload ไปแล้วออกจาก S3

  ### Response 201
  \`\`\`json
  {
    "data": { "id": "<uuid>", "${m.parentIdName}": "<uuid>", "attachments": [...] },
    "status": 201,
    "success": true,
    "message": "Success",
    "timestamp": "2026-04-29T12:00:00.000Z"
  }
  \`\`\`

  Note: \`fileUrl\` ใน response จะว่าง — frontend ต้องเรียก
  \`GET /api/{bu_code}/documents/presigned-url/{fileToken}\` เพื่อแสดงไฟล์
}
`;
}

// ---- per-folder rewrite -----------------------------------------------------

function rewriteFolder(folderPath: string): string[] {
  const folderName = folderPath.split('/').pop()!;
  const m = detectModule(folderName);
  const actions: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(folderPath);
  } catch {
    return ['failed to read'];
  }

  // Files to delete (obsolete)
  for (const f of entries) {
    if (/^02 - Get .*\.bru$/.test(f) || /^03 - Create .*\.bru$/.test(f)) {
      const p = join(folderPath, f);
      actions.push(`DELETE ${f}`);
      if (APPLY) unlinkSync(p);
    }
  }

  // Find existing files matching prefixes (preserve their exact filenames where possible)
  const findFile = (re: RegExp) => entries.find((f) => re.test(f));
  const listFile = findFile(/^01\b.*\.bru$/i);
  const updateFile = findFile(/^04\b.*\.bru$/i);
  const deleteFile = findFile(/^05\b.*\.bru$/i);
  const addAttFile = findFile(/^06\b.*\.bru$/i);
  const removeAttFile = findFile(/^07\b.*\.bru$/i);
  const createFile = findFile(/^(POST-create-with-files\.bru|08\b.*\.bru)$/i);

  const writeFile = (relName: string, content: string) => {
    const p = join(folderPath, relName);
    actions.push(`WRITE ${relName}`);
    if (APPLY) writeFileSync(p, content);
  };

  writeFile(listFile ?? `01 - List ${m.humanName}s.bru`, bruList(m));
  writeFile(updateFile ?? `04 - Update ${m.humanName}.bru`, bruUpdate(m));
  writeFile(deleteFile ?? `05 - Delete ${m.humanName}.bru`, bruDelete(m));
  writeFile(addAttFile ?? `06 - Add ${m.humanName} Attachment.bru`, bruAddAttachment(m));
  writeFile(removeAttFile ?? `07 - Remove ${m.humanName} Attachment.bru`, bruRemoveAttachment(m));
  writeFile(createFile ?? `POST-create-with-files.bru`, bruCreateWithFiles(m));

  return actions;
}

// ---- main -------------------------------------------------------------------

const dirs = findCommentDirs(brunoBase).sort();
console.log(`Found ${dirs.length} comment folders${APPLY ? ' (APPLY mode)' : ' (dry-run)'}`);

for (const d of dirs) {
  const rel = relative(repoRoot, d);
  const actions = rewriteFolder(d);
  console.log(`\n${rel}`);
  for (const a of actions) console.log(`  ${a}`);
}

console.log(`\nDone. ${dirs.length} folders ${APPLY ? 'rewritten' : 'previewed'}.`);
