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
export function fillCommentAttachmentUrls<T>(data: T, bu_code: string): T {
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
