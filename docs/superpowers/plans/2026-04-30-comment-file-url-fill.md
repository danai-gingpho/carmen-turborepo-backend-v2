# Comment Attachment fileUrl Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose `fileUrl = /api/{bu_code}/documents/{encodeURIComponent(fileToken)}/download` for every attachment returned by every `*-comment` service in `backend-gateway`, both in the upload path (set at the moment of upload) and in the read path (backfill for historical comments whose DB rows have `fileUrl: ''` or `null`).

**Architecture:** One small shared helper module (`document-download-url.ts`) with three pure functions: `buildDocumentDownloadUrl()` produces the relative URL, `fillAttachmentUrls()` walks an attachments array, and `fillCommentAttachmentUrls()` walks a comment-or-comment-array and fills attachments inside each. Each of the 46 `*-comment` services imports those helpers, replaces its single `fileUrl: ''` literal in `uploadFile()`, and calls `fillCommentAttachmentUrls()` on `response.data` in five read-shape paths (`findAllByParentId`, `update`, `addAttachments`, `removeAttachment`, `createWithFiles`).

**Tech Stack:** NestJS 10, TypeScript 5, Jest. No new runtime dependencies — uses built-in `encodeURIComponent`.

**Spec:** `docs/superpowers/specs/2026-04-30-comment-file-url-fill-design.md`

---

## File Structure

**Files created:**

| Path | Responsibility |
|------|---------------|
| `apps/backend-gateway/src/common/helpers/document-download-url.ts` | Pure helpers: `buildDocumentDownloadUrl`, `fillAttachmentUrls`, `fillCommentAttachmentUrls` |
| `apps/backend-gateway/src/common/helpers/document-download-url.spec.ts` | Unit tests for the three helpers (URL encoding, pass-through, idempotency) |

**Files modified (46 service files, identical pattern):**

```
apps/backend-gateway/src/application/config-running-code-comment/config-running-code-comment.service.ts
apps/backend-gateway/src/application/credit-note-comment/credit-note-comment.service.ts
apps/backend-gateway/src/application/credit-note-detail-comment/credit-note-detail-comment.service.ts
apps/backend-gateway/src/application/credit-term-comment/credit-term-comment.service.ts
apps/backend-gateway/src/application/currency-comment/currency-comment.service.ts
apps/backend-gateway/src/application/delivery-point-comment/delivery-point-comment.service.ts
apps/backend-gateway/src/application/department-comment/department-comment.service.ts
apps/backend-gateway/src/application/dimension-comment/dimension-comment.service.ts
apps/backend-gateway/src/application/exchange-rate-comment/exchange-rate-comment.service.ts
apps/backend-gateway/src/application/extra-cost-comment/extra-cost-comment.service.ts
apps/backend-gateway/src/application/extra-cost-detail-comment/extra-cost-detail-comment.service.ts
apps/backend-gateway/src/application/good-received-note-comment/good-received-note-comment.service.ts
apps/backend-gateway/src/application/good-received-note-detail-comment/good-received-note-detail-comment.service.ts
apps/backend-gateway/src/application/location-comment/location-comment.service.ts
apps/backend-gateway/src/application/period-comment/period-comment.service.ts
apps/backend-gateway/src/application/physical-count-comment/physical-count-comment.service.ts
apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts
apps/backend-gateway/src/application/physical-count-period-comment/physical-count-period-comment.service.ts
apps/backend-gateway/src/application/pricelist-comment/pricelist-comment.service.ts
apps/backend-gateway/src/application/pricelist-detail-comment/pricelist-detail-comment.service.ts
apps/backend-gateway/src/application/pricelist-template-comment/pricelist-template-comment.service.ts
apps/backend-gateway/src/application/pricelist-template-detail-comment/pricelist-template-detail-comment.service.ts
apps/backend-gateway/src/application/product-category-comment/product-category-comment.service.ts
apps/backend-gateway/src/application/product-comment/product-comment.service.ts
apps/backend-gateway/src/application/product-item-group-comment/product-item-group-comment.service.ts
apps/backend-gateway/src/application/product-sub-category-comment/product-sub-category-comment.service.ts
apps/backend-gateway/src/application/purchase-order-comment/purchase-order-comment.service.ts
apps/backend-gateway/src/application/purchase-order-detail-comment/purchase-order-detail-comment.service.ts
apps/backend-gateway/src/application/purchase-request-comment/purchase-request-comment.service.ts
apps/backend-gateway/src/application/purchase-request-detail-comment/purchase-request-detail-comment.service.ts
apps/backend-gateway/src/application/purchase-request-template-comment/purchase-request-template-comment.service.ts
apps/backend-gateway/src/application/request-for-pricing-comment/request-for-pricing-comment.service.ts
apps/backend-gateway/src/application/request-for-pricing-detail-comment/request-for-pricing-detail-comment.service.ts
apps/backend-gateway/src/application/spot-check-comment/spot-check-comment.service.ts
apps/backend-gateway/src/application/spot-check-detail-comment/spot-check-detail-comment.service.ts
apps/backend-gateway/src/application/stock-in-comment/stock-in-comment.service.ts
apps/backend-gateway/src/application/stock-in-detail-comment/stock-in-detail-comment.service.ts
apps/backend-gateway/src/application/stock-out-comment/stock-out-comment.service.ts
apps/backend-gateway/src/application/stock-out-detail-comment/stock-out-detail-comment.service.ts
apps/backend-gateway/src/application/store-requisition-comment/store-requisition-comment.service.ts
apps/backend-gateway/src/application/store-requisition-detail-comment/store-requisition-detail-comment.service.ts
apps/backend-gateway/src/application/tax-profile-comment/tax-profile-comment.service.ts
apps/backend-gateway/src/application/unit-comment/unit-comment.service.ts
apps/backend-gateway/src/application/vendor-business-type-comment/vendor-business-type-comment.service.ts
apps/backend-gateway/src/application/vendor-comment/vendor-comment.service.ts
apps/backend-gateway/src/application/workflow-comment/workflow-comment.service.ts
```

---

## Task 1: Create the shared helper + tests (TDD)

**Files:**
- Create: `apps/backend-gateway/src/common/helpers/document-download-url.ts`
- Test: `apps/backend-gateway/src/common/helpers/document-download-url.spec.ts`

The helper has three pure functions. `buildDocumentDownloadUrl` is the primitive. `fillAttachmentUrls` walks one attachments array. `fillCommentAttachmentUrls` walks a comment record (or array of comment records) and fills the `attachments` field on each — this is what the read paths in 46 services will call on `response.data` regardless of whether it's paginated array or single object.

- [ ] **Step 1: Write the failing test file**

Create `apps/backend-gateway/src/common/helpers/document-download-url.spec.ts` with:

```ts
import {
  buildDocumentDownloadUrl,
  fillAttachmentUrls,
  fillCommentAttachmentUrls,
} from './document-download-url';

describe('buildDocumentDownloadUrl', () => {
  it('encodes slash in fileToken to %2F', () => {
    expect(buildDocumentDownloadUrl('BU01', 'BU01/abc-123')).toBe(
      '/api/BU01/documents/BU01%2Fabc-123/download',
    );
  });

  it('returns relative path (no host)', () => {
    const url = buildDocumentDownloadUrl('BU01', 'plain-token');
    expect(url.startsWith('/api/')).toBe(true);
  });

  it('encodes special chars in fileToken', () => {
    expect(buildDocumentDownloadUrl('BU01', 'a b#c')).toBe(
      '/api/BU01/documents/a%20b%23c/download',
    );
  });
});

describe('fillAttachmentUrls', () => {
  const buCode = 'BU01';

  it('fills empty fileUrl using fileToken', () => {
    const input = [{ fileToken: 'BU01/uuid', fileUrl: '' }];
    const out = fillAttachmentUrls(input, buCode);
    expect(out).toEqual([
      { fileToken: 'BU01/uuid', fileUrl: '/api/BU01/documents/BU01%2Fuuid/download' },
    ]);
  });

  it('fills missing fileUrl', () => {
    const input = [{ fileToken: 'tok' }];
    const out = fillAttachmentUrls(input, buCode);
    expect(out?.[0]?.fileUrl).toBe('/api/BU01/documents/tok/download');
  });

  it('does not overwrite an existing non-empty fileUrl', () => {
    const input = [{ fileToken: 'tok', fileUrl: 'https://existing.example/file' }];
    const out = fillAttachmentUrls(input, buCode);
    expect(out?.[0]?.fileUrl).toBe('https://existing.example/file');
  });

  it('skips entries without a fileToken', () => {
    const input = [{ fileUrl: '' }, { fileToken: '' }];
    const out = fillAttachmentUrls(input, buCode);
    expect(out).toEqual([{ fileUrl: '' }, { fileToken: '' }]);
  });

  it('passes through non-array input', () => {
    expect(fillAttachmentUrls(undefined, buCode)).toBe(undefined);
    expect(fillAttachmentUrls(null as any, buCode)).toBe(null);
  });
});

describe('fillCommentAttachmentUrls', () => {
  const buCode = 'BU01';

  it('fills attachments on a single comment object', () => {
    const input = {
      id: 'c1',
      attachments: [{ fileToken: 'tok', fileUrl: '' }],
    };
    const out = fillCommentAttachmentUrls(input, buCode) as typeof input;
    expect(out.attachments[0].fileUrl).toBe('/api/BU01/documents/tok/download');
  });

  it('fills attachments on each comment in an array', () => {
    const input = [
      { id: 'c1', attachments: [{ fileToken: 't1', fileUrl: '' }] },
      { id: 'c2', attachments: [{ fileToken: 't2', fileUrl: '' }] },
    ];
    const out = fillCommentAttachmentUrls(input, buCode) as typeof input;
    expect(out[0].attachments[0].fileUrl).toBe('/api/BU01/documents/t1/download');
    expect(out[1].attachments[0].fileUrl).toBe('/api/BU01/documents/t2/download');
  });

  it('passes through comments without attachments field', () => {
    const input = { id: 'c1', message: 'hi' };
    const out = fillCommentAttachmentUrls(input, buCode);
    expect(out).toEqual(input);
  });

  it('passes through null/undefined', () => {
    expect(fillCommentAttachmentUrls(null, buCode)).toBe(null);
    expect(fillCommentAttachmentUrls(undefined, buCode)).toBe(undefined);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-download-url.spec.ts
```

Expected: cannot find module `./document-download-url`.

- [ ] **Step 3: Implement the helper**

Create `apps/backend-gateway/src/common/helpers/document-download-url.ts` with:

```ts
/**
 * Build a relative download URL for a document attachment.
 * สร้าง relative URL สำหรับดาวน์โหลดเอกสารแนบ
 */
export function buildDocumentDownloadUrl(
  bu_code: string,
  fileToken: string,
): string {
  return `/api/${bu_code}/documents/${encodeURIComponent(fileToken)}/download`;
}

interface AttachmentLike {
  fileToken?: string | null;
  fileUrl?: string | null;
}

/**
 * Walk an attachments array and fill in `fileUrl` for any item that
 * has a non-empty `fileToken` but is missing or empty `fileUrl`.
 * Returns a new array (existing items kept by reference when unchanged).
 * เติม fileUrl ใน attachments ที่ยังว่างจาก fileToken
 */
export function fillAttachmentUrls<T extends AttachmentLike>(
  attachments: T[] | undefined | null,
  bu_code: string,
): T[] | undefined | null {
  if (!Array.isArray(attachments)) return attachments;
  return attachments.map((a) => {
    if (!a || typeof a.fileToken !== 'string' || a.fileToken.length === 0) {
      return a;
    }
    if (typeof a.fileUrl === 'string' && a.fileUrl.length > 0) return a;
    return { ...a, fileUrl: buildDocumentDownloadUrl(bu_code, a.fileToken) };
  });
}

interface CommentLike {
  attachments?: AttachmentLike[] | null;
}

/**
 * Walk a comment record (or array of comment records) and fill the
 * `fileUrl` of each entry in its `attachments` field. Pass-through for
 * any value that is not an object or array.
 * เติม fileUrl ใน comment เดี่ยวหรือ array
 */
export function fillCommentAttachmentUrls<T>(
  data: T,
  bu_code: string,
): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return (data as unknown[]).map((row) =>
      fillSingleComment(row, bu_code),
    ) as unknown as T;
  }

  if (typeof data === 'object') {
    return fillSingleComment(data, bu_code) as T;
  }

  return data;
}

function fillSingleComment(row: unknown, bu_code: string): unknown {
  if (!row || typeof row !== 'object') return row;
  const r = row as CommentLike & Record<string, unknown>;
  if (!('attachments' in r)) return r;
  return {
    ...r,
    attachments: fillAttachmentUrls(r.attachments ?? undefined, bu_code),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd apps/backend-gateway
bun run test -- --testPathPattern=document-download-url.spec.ts
```

Expected: all helper tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-gateway/src/common/helpers/document-download-url.ts \
        apps/backend-gateway/src/common/helpers/document-download-url.spec.ts
git commit -m "feat(common): add document-download-url helpers for comment attachments"
```

---

## Task 2: Apply changes to `currency-comment` (canonical template)

**Files:**
- Modify: `apps/backend-gateway/src/application/currency-comment/currency-comment.service.ts`

This task establishes the exact change pattern that Task 3 will mechanically apply to the other 45 services. The pattern is: (1) add one import line, (2) replace `fileUrl: ''` in `uploadFile()` with the helper call, (3) wrap `response.data` with `fillCommentAttachmentUrls(...)` in five read-shape paths (`findAllByParentId`, `update`, `addAttachments`, `removeAttachment`, `createWithFiles`).

- [ ] **Step 1: Add import**

Open `apps/backend-gateway/src/application/currency-comment/currency-comment.service.ts`. Find the existing `import { getGatewayRequestContext }` line near the top of the imports (line ~15) and add this new import directly after it:

```ts
import {
  buildDocumentDownloadUrl,
  fillCommentAttachmentUrls,
} from 'src/common/helpers/document-download-url';
```

- [ ] **Step 2: Replace `fileUrl: ''` in `uploadFile()`**

Inside `uploadFile()` (around line 428–434) the return object currently looks like:

```ts
    return {
      fileName: data?.originalName ?? file.originalname,
      fileToken: String(data?.fileToken ?? ''),
      fileUrl: '',
      contentType: data?.contentType ?? file.mimetype,
      size: typeof data?.size === 'number' ? data.size : file.size,
    };
```

Change the `fileUrl: ''` line to:

```ts
      fileUrl: buildDocumentDownloadUrl(bu_code, String(data?.fileToken ?? '')),
```

- [ ] **Step 3: Backfill in `findAllByParentId()`**

Find the line:

```ts
    return ResponseLib.successWithPaginate(response.data, response.paginate);
```

inside `findAllByParentId()` (~line 55) and replace it with:

```ts
    return ResponseLib.successWithPaginate(
      fillCommentAttachmentUrls(response.data, bu_code),
      response.paginate,
    );
```

- [ ] **Step 4: Backfill in `update()`**

Find the line:

```ts
    return ResponseLib.success(response.data);
```

inside `update()` (~line 163) — it's the line **just before** the `async delete(` declaration. Replace it with:

```ts
    return ResponseLib.success(fillCommentAttachmentUrls(response.data, bu_code));
```

- [ ] **Step 5: Backfill in `addAttachments()`**

Find the line:

```ts
    return ResponseLib.success(response.data);
```

inside `addAttachments()` (~line 291) — it's the line **just before** the `async removeAttachment(` declaration. Replace it with:

```ts
    return ResponseLib.success(fillCommentAttachmentUrls(response.data, bu_code));
```

- [ ] **Step 6: Backfill in `removeAttachment()`**

Find the line:

```ts
    return ResponseLib.success(response.data);
```

inside `removeAttachment()` (~line 312) — the last `return` of that method. Replace it with:

```ts
    return ResponseLib.success(fillCommentAttachmentUrls(response.data, bu_code));
```

- [ ] **Step 7: Backfill in `createWithFiles()`**

Find the line:

```ts
    return ResponseLib.created(response.data);
```

inside `createWithFiles()` (~line 394) — the last `return` before `async uploadFile(`. Replace it with:

```ts
    return ResponseLib.created(fillCommentAttachmentUrls(response.data, bu_code));
```

- [ ] **Step 8: Type-check**

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: no errors related to `currency-comment.service.ts`.

- [ ] **Step 9: Commit**

```bash
git add apps/backend-gateway/src/application/currency-comment/currency-comment.service.ts
git commit -m "feat(currency-comment): fill attachment fileUrl on upload and read paths"
```

---

## Task 3: Apply same changes to remaining 45 services

**Files:** the 45 service files listed below (every `*-comment` service except `currency-comment`).

Each file gets the **exact same pattern of edits** as Task 2: one import line + one `fileUrl: ''` replacement + five `ResponseLib.*(response.data...)` wrappings. The class name and the leading `*-comment` directory name vary per file but the surrounding code shape is the same across all 46 services.

- [ ] **Step 1: Establish the per-file edit recipe**

Per file, the same five edit steps apply:

1. **Add import** — directly after `import { getGatewayRequestContext } from '@/common/context/gateway-request-context';`:

   ```ts
   import {
     buildDocumentDownloadUrl,
     fillCommentAttachmentUrls,
   } from 'src/common/helpers/document-download-url';
   ```

2. **Replace** `fileUrl: ''` in `uploadFile()` with:

   ```ts
   fileUrl: buildDocumentDownloadUrl(bu_code, String(data?.fileToken ?? '')),
   ```

3. **Wrap** `ResponseLib.successWithPaginate(response.data, response.paginate)` in `findAllByParentId()` (or the equivalent paginated find — search for `successWithPaginate(response.data,`) with:

   ```ts
   ResponseLib.successWithPaginate(
     fillCommentAttachmentUrls(response.data, bu_code),
     response.paginate,
   )
   ```

4. **Wrap** every `ResponseLib.success(response.data)` line that occurs inside an `update`, `addAttachments`, or `removeAttachment` method with:

   ```ts
   ResponseLib.success(fillCommentAttachmentUrls(response.data, bu_code))
   ```

   Do **not** wrap the `return ResponseLib.success(response.data);` inside `delete()` (the delete confirmation does not include attachments). Easiest discriminator: in `delete()` the returned `response.data` comes from a `*-comment.delete` `cmd:` while the others come from `*-comment.update` / `add-attachment` / `remove-attachment`. Inspect the surrounding `cmd:` string to confirm before editing.

5. **Wrap** `ResponseLib.created(response.data)` in `createWithFiles()` with:

   ```ts
   ResponseLib.created(fillCommentAttachmentUrls(response.data, bu_code))
   ```

The 45 files (alphabetical, one commit per file recommended for traceable PR history):

```
apps/backend-gateway/src/application/config-running-code-comment/config-running-code-comment.service.ts
apps/backend-gateway/src/application/credit-note-comment/credit-note-comment.service.ts
apps/backend-gateway/src/application/credit-note-detail-comment/credit-note-detail-comment.service.ts
apps/backend-gateway/src/application/credit-term-comment/credit-term-comment.service.ts
apps/backend-gateway/src/application/delivery-point-comment/delivery-point-comment.service.ts
apps/backend-gateway/src/application/department-comment/department-comment.service.ts
apps/backend-gateway/src/application/dimension-comment/dimension-comment.service.ts
apps/backend-gateway/src/application/exchange-rate-comment/exchange-rate-comment.service.ts
apps/backend-gateway/src/application/extra-cost-comment/extra-cost-comment.service.ts
apps/backend-gateway/src/application/extra-cost-detail-comment/extra-cost-detail-comment.service.ts
apps/backend-gateway/src/application/good-received-note-comment/good-received-note-comment.service.ts
apps/backend-gateway/src/application/good-received-note-detail-comment/good-received-note-detail-comment.service.ts
apps/backend-gateway/src/application/location-comment/location-comment.service.ts
apps/backend-gateway/src/application/period-comment/period-comment.service.ts
apps/backend-gateway/src/application/physical-count-comment/physical-count-comment.service.ts
apps/backend-gateway/src/application/physical-count-detail-comment/physical-count-detail-comment.service.ts
apps/backend-gateway/src/application/physical-count-period-comment/physical-count-period-comment.service.ts
apps/backend-gateway/src/application/pricelist-comment/pricelist-comment.service.ts
apps/backend-gateway/src/application/pricelist-detail-comment/pricelist-detail-comment.service.ts
apps/backend-gateway/src/application/pricelist-template-comment/pricelist-template-comment.service.ts
apps/backend-gateway/src/application/pricelist-template-detail-comment/pricelist-template-detail-comment.service.ts
apps/backend-gateway/src/application/product-category-comment/product-category-comment.service.ts
apps/backend-gateway/src/application/product-comment/product-comment.service.ts
apps/backend-gateway/src/application/product-item-group-comment/product-item-group-comment.service.ts
apps/backend-gateway/src/application/product-sub-category-comment/product-sub-category-comment.service.ts
apps/backend-gateway/src/application/purchase-order-comment/purchase-order-comment.service.ts
apps/backend-gateway/src/application/purchase-order-detail-comment/purchase-order-detail-comment.service.ts
apps/backend-gateway/src/application/purchase-request-comment/purchase-request-comment.service.ts
apps/backend-gateway/src/application/purchase-request-detail-comment/purchase-request-detail-comment.service.ts
apps/backend-gateway/src/application/purchase-request-template-comment/purchase-request-template-comment.service.ts
apps/backend-gateway/src/application/request-for-pricing-comment/request-for-pricing-comment.service.ts
apps/backend-gateway/src/application/request-for-pricing-detail-comment/request-for-pricing-detail-comment.service.ts
apps/backend-gateway/src/application/spot-check-comment/spot-check-comment.service.ts
apps/backend-gateway/src/application/spot-check-detail-comment/spot-check-detail-comment.service.ts
apps/backend-gateway/src/application/stock-in-comment/stock-in-comment.service.ts
apps/backend-gateway/src/application/stock-in-detail-comment/stock-in-detail-comment.service.ts
apps/backend-gateway/src/application/stock-out-comment/stock-out-comment.service.ts
apps/backend-gateway/src/application/stock-out-detail-comment/stock-out-detail-comment.service.ts
apps/backend-gateway/src/application/store-requisition-comment/store-requisition-comment.service.ts
apps/backend-gateway/src/application/store-requisition-detail-comment/store-requisition-detail-comment.service.ts
apps/backend-gateway/src/application/tax-profile-comment/tax-profile-comment.service.ts
apps/backend-gateway/src/application/unit-comment/unit-comment.service.ts
apps/backend-gateway/src/application/vendor-business-type-comment/vendor-business-type-comment.service.ts
apps/backend-gateway/src/application/vendor-comment/vendor-comment.service.ts
apps/backend-gateway/src/application/workflow-comment/workflow-comment.service.ts
```

- [ ] **Step 2: Apply edits in batches of 5 files**

For each batch of 5 files from the list above, apply the recipe in Step 1 to each file. Read each file before editing (the line numbers around the targeted strings vary slightly per service). Stage each file individually as you go.

- [ ] **Step 3: Verify no `fileUrl: ''` remains and helper is imported in all 46 services**

After all 45 files are edited, run:

```bash
grep -rln "fileUrl: ''" apps/backend-gateway/src/application/*-comment/*.service.ts
```

Expected: only the spec file (`physical-count-detail-comment.service.spec.ts`) appears, no `.service.ts` results.

```bash
grep -L "fillCommentAttachmentUrls" apps/backend-gateway/src/application/*-comment/*.service.ts
```

Expected: empty output (every comment service file imports the helper).

- [ ] **Step 4: Type-check the gateway**

```bash
cd apps/backend-gateway
bun run check-types
```

Expected: no errors. If any service file fails (most likely: a service whose `findAllByParentId` is named differently, e.g. `findAllByCurrencyId`), inspect that file's `successWithPaginate(response.data,` call and apply the same wrap.

- [ ] **Step 5: Commit per-file or per-batch**

If you committed per file in Step 2, this step is a no-op. Otherwise:

```bash
git add apps/backend-gateway/src/application/*-comment/*.service.ts
git commit -m "feat(comment): fill attachment fileUrl across all comment services"
```

---

## Task 4: End-to-end manual verification

**Files:** none modified — verification only.

Confirm both upload-time fill and read-time backfill on a real running gateway.

- [ ] **Step 1: Start gateway + dependencies**

In separate terminals:

```bash
cd apps/micro-business
bun run dev
```

```bash
cd apps/micro-file
bun run dev
```

```bash
cd apps/backend-gateway
bun run dev
```

Wait for all to log `ready` / port listening.

- [ ] **Step 2: Authenticate via Bruno**

In Bruno (`apps/bruno/carmen-inventory/`), select environment `localhost-4000` and run any request under `auth/login/` to populate `{{access_token}}`.

- [ ] **Step 3: Verify upload-time fill**

Pick any `*-comment` Bruno request that creates a comment with attachments (e.g. `currency-comment` create-with-files). Send the request and inspect the response — every attachment must include a non-empty `fileUrl` matching the pattern `/api/{bu_code}/documents/{encoded-token}/download`.

- [ ] **Step 4: Verify read-time backfill**

Send the corresponding `find-all` request for the same parent. The response should list comments — for each attachment the `fileUrl` must be non-empty and follow the same pattern. (Comments uploaded **before** this change still have `fileUrl: ''` in the DB, but the read path backfills them on the fly.)

- [ ] **Step 5: Sanity check the URL works**

Take one of the returned `fileUrl` values, prepend the host (e.g. `http://localhost:4000`) to form the full URL, and `curl` it (or open in browser) with the same `Authorization` + `x-app-id` headers as the previous request. Expected: HTTP 200 with the binary file body.

No commit in this task — verification only.

---

## Self-Review

Spec coverage:

| Spec section | Task |
|--------------|------|
| `buildDocumentDownloadUrl` helper | Task 1 |
| `fillAttachmentUrls` helper (single attachments array walker) | Task 1 |
| `fillCommentAttachmentUrls` helper (added in plan to DRY the 46-service edit; covers both single-object and array `response.data` shapes from the spec example) | Task 1 |
| Helper unit tests covering encoding, empty/missing fileUrl, no-overwrite, pass-through | Task 1 |
| Upload path: `fileUrl: ''` → `buildDocumentDownloadUrl(bu_code, fileToken)` in every `uploadFile()` | Tasks 2, 3 |
| Read path backfill in `findAllByParentId` (paginated) | Tasks 2, 3 |
| Read path backfill in `update` / `addAttachments` / `removeAttachment` / `createWithFiles` (covers single-object responses) | Tasks 2, 3 |
| 46 service files identified by `grep -rln "fileUrl: ''"` | Tasks 2, 3 |
| Manual verification of both upload-time and read-time | Task 4 |
| Out-of-scope items (DB backfill, presigned URL overwrite, download-endpoint guard) | Explicitly excluded |

No `TBD`/`TODO`/`add error handling` placeholders. Helper signatures match across tasks: `buildDocumentDownloadUrl(bu_code, fileToken)` and `fillCommentAttachmentUrls(data, bu_code)` are referenced consistently in Task 2 and Task 3 with the same argument order. The list of 45 files in Task 3 plus `currency-comment` in Task 2 covers all 46 service files identified in the file-structure section.
