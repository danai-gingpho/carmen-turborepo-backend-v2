/**
 * Verify every `*-comment` module in `apps/backend-gateway/src/application/`
 * conforms to the canonical pattern in `docs/design-comment-logic.md`.
 *
 * Checks per module:
 *  Controller:
 *   - has GET ':bu_code/<prefix>/:<parent_id>'                (list)
 *   - has POST ':bu_code/<prefix>/:<parent_id>'               (create-with-files, multipart)
 *   - has PATCH ':bu_code/<prefix>/:id'                       (update, multipart)
 *   - has DELETE ':bu_code/<prefix>/:id'                      (soft-delete)
 *   - has POST ':bu_code/<prefix>/:id/attachment'             (batch add, multipart)
 *   - has DELETE ':bu_code/<prefix>/:id/attachment/:fileToken'
 *   - removed: GET ':bu_code/<prefix>/:id' (findById)
 *   - removed: POST ':bu_code/<prefix>' (json create)
 *   - removed: POST ':bu_code/<prefix>/upload'
 *   - imports FilesInterceptor, ApiConsumes('multipart/form-data')
 *  Service:
 *   - methods: findAllByParentId, update, delete, addAttachments,
 *     removeAttachment, createWithFiles, uploadFile, deleteFile
 *   - removed: findById, addAttachment(single), JSON create
 *   - delete uses '<prefix>.find-by-id' before sending '<prefix>.delete'
 *   - update sends `data.attachments = { add, remove }`
 */

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const repoRoot = join(import.meta.dir, '..', '..');
const gatewayApp = join(repoRoot, 'apps', 'backend-gateway', 'src', 'application');

interface Issue {
  module: string;
  level: 'error' | 'warn';
  msg: string;
}

const folders = readdirSync(gatewayApp, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith('-comment'))
  .map((d) => d.name)
  .sort();

const issues: Issue[] = [];

for (const folder of folders) {
  const dir = join(gatewayApp, folder);
  const ctrlPath = join(dir, `${folder}.controller.ts`);
  const svcPath = join(dir, `${folder}.service.ts`);
  const dtoPath = join(dir, 'dto', `${folder}.dto.ts`);

  let ctrl = '';
  let svc = '';
  let dto = '';
  try {
    ctrl = readFileSync(ctrlPath, 'utf-8');
    svc = readFileSync(svcPath, 'utf-8');
    dto = readFileSync(dtoPath, 'utf-8');
  } catch (e) {
    issues.push({ module: folder, level: 'error', msg: `cannot read files: ${(e as Error).message}` });
    continue;
  }

  const prefix = folder; // e.g., purchase-order-comment
  const parentRoute = folder.replace(/-comment$/, '');
  const parentId = parentRoute.replace(/-/g, '_') + '_id';

  // --- Controller route checks ---
  const expectGet = new RegExp(`@Get\\(':bu_code/${prefix}/:${parentId}'\\)`);
  const expectPostCreate = new RegExp(`@Post\\(':bu_code/${prefix}/:${parentId}'\\)`);
  const expectPatch = new RegExp(`@Patch\\(':bu_code/${prefix}/:id'\\)`);
  const expectDelete = new RegExp(`@Delete\\(':bu_code/${prefix}/:id'\\)`);
  const expectAddAtt = new RegExp(`@Post\\(':bu_code/${prefix}/:id/attachment'\\)`);
  const expectRemoveAtt = new RegExp(`@Delete\\(':bu_code/${prefix}/:id/attachment/:fileToken'\\)`);

  if (!expectGet.test(ctrl)) issues.push({ module: folder, level: 'error', msg: `missing list route GET :${parentId}` });
  if (!expectPostCreate.test(ctrl)) issues.push({ module: folder, level: 'error', msg: `missing create-with-files POST :${parentId}` });
  if (!expectPatch.test(ctrl)) issues.push({ module: folder, level: 'error', msg: 'missing PATCH :id' });
  if (!expectDelete.test(ctrl)) issues.push({ module: folder, level: 'error', msg: 'missing DELETE :id' });
  if (!expectAddAtt.test(ctrl)) issues.push({ module: folder, level: 'error', msg: 'missing POST :id/attachment' });
  if (!expectRemoveAtt.test(ctrl)) issues.push({ module: folder, level: 'error', msg: 'missing DELETE :id/attachment/:fileToken' });

  // Removed routes
  const removedFindById = new RegExp(`@Get\\(':bu_code/${prefix}/:id'\\)`);
  const removedJsonCreate = new RegExp(`@Post\\(':bu_code/${prefix}'\\)`);
  const removedUpload = new RegExp(`@Post\\(':bu_code/${prefix}/upload'\\)`);
  const removedOldList = new RegExp(`@Get\\(':bu_code/${parentRoute}/:[a-z_0-9]+/comments'\\)`);

  if (removedFindById.test(ctrl)) issues.push({ module: folder, level: 'error', msg: 'still has findById route GET :id' });
  if (removedJsonCreate.test(ctrl)) issues.push({ module: folder, level: 'error', msg: 'still has JSON create POST (no parent_id)' });
  if (removedUpload.test(ctrl)) issues.push({ module: folder, level: 'error', msg: 'still has /upload route' });
  if (removedOldList.test(ctrl)) issues.push({ module: folder, level: 'error', msg: `still has old list route under /${parentRoute}/...` });

  // Multipart usage
  if (!ctrl.includes('FilesInterceptor')) issues.push({ module: folder, level: 'error', msg: 'controller missing FilesInterceptor' });
  if (!ctrl.includes("'multipart/form-data'")) issues.push({ module: folder, level: 'error', msg: 'controller missing multipart/form-data' });

  // --- Service checks ---
  if (!/async findAllByParentId\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing findAllByParentId()' });
  if (!/async update\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing update()' });
  if (!/async delete\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing delete()' });
  if (!/async addAttachments\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing addAttachments()' });
  if (!/async removeAttachment\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing removeAttachment()' });
  if (!/async createWithFiles\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing createWithFiles()' });
  if (!/async uploadFile\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing uploadFile()' });
  if (!/async deleteFile\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service missing deleteFile()' });

  // Removed methods
  if (/async findById\(/.test(svc)) issues.push({ module: folder, level: 'error', msg: 'service still has findById()' });
  if (/async addAttachment\(\s*id: string,\s*attachment: /.test(svc))
    issues.push({ module: folder, level: 'error', msg: 'service still has single addAttachment(attachment)' });

  // delete flow uses find-by-id first, then delete
  const findByIdInDelete = new RegExp(`'${prefix}\\.find-by-id'`);
  const deleteCmdInService = new RegExp(`'${prefix}\\.delete'`);
  if (!findByIdInDelete.test(svc)) issues.push({ module: folder, level: 'error', msg: `delete() doesn't call '${prefix}.find-by-id' first` });
  if (!deleteCmdInService.test(svc)) issues.push({ module: folder, level: 'error', msg: `delete() doesn't send '${prefix}.delete'` });

  // update sends attachments: { add, remove } shape
  if (!/data\.attachments\s*=\s*\{[\s\S]*?add:/.test(svc))
    issues.push({ module: folder, level: 'error', msg: 'update() does not build data.attachments = { add, remove }' });

  // --- DTO checks ---
  const baseName = folder
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('');
  if (!new RegExp(`Update${baseName}BodySchema`).test(dto))
    issues.push({ module: folder, level: 'error', msg: `dto missing Update${baseName}BodySchema` });
  if (!new RegExp(`Update${baseName}Dto`).test(dto))
    issues.push({ module: folder, level: 'error', msg: `dto missing Update${baseName}Dto` });
  if (!/AddAttachmentsDto/.test(dto))
    issues.push({ module: folder, level: 'error', msg: 'dto missing AddAttachmentsDto' });
  if (/CreateCreditNote|CreatePhysicalCount|CreatePurchaseOrder|Create[A-Z][a-zA-Z]+CommentDto/.test(dto))
    issues.push({ module: folder, level: 'warn', msg: 'dto still references old CreateXCommentDto class' });
}

const errors = issues.filter((i) => i.level === 'error');
const warns = issues.filter((i) => i.level === 'warn');

console.log(`Modules checked: ${folders.length}`);
console.log(`Errors:   ${errors.length}`);
console.log(`Warnings: ${warns.length}\n`);

const grouped = new Map<string, Issue[]>();
for (const it of issues) {
  const arr = grouped.get(it.module) ?? [];
  arr.push(it);
  grouped.set(it.module, arr);
}

for (const folder of folders) {
  const its = grouped.get(folder);
  if (!its) {
    console.log(`✓ ${folder}`);
    continue;
  }
  console.log(`✗ ${folder}`);
  for (const i of its) console.log(`    [${i.level}] ${i.msg}`);
}

if (errors.length > 0) process.exit(1);
