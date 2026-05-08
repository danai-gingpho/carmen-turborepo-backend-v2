export const AUDIT_AT_FIELDS = ['created_at', 'updated_at', 'deleted_at'] as const;
export const AUDIT_BY_ID_FIELDS = ['created_by_id', 'updated_by_id', 'deleted_by_id'] as const;

const KIND_MAP = [
  { key: 'created', at: 'created_at', byId: 'created_by_id' },
  { key: 'updated', at: 'updated_at', byId: 'updated_by_id' },
  { key: 'deleted', at: 'deleted_at', byId: 'deleted_by_id' },
] as const;

export type EnrichmentTarget = Record<string, unknown>;

function isPlainObject(value: unknown): value is EnrichmentTarget {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Collect every plain-object target inside `payload` reachable by any of the
 * dot-separated `paths`. `''` means the root payload itself (or each element
 * if root is an array). Missing paths are skipped silently. Used by
 * EnrichmentService to find the entries that need their audit fields rewritten.
 */
export function collectTargetsByPaths(
  payload: unknown,
  paths: string[],
): EnrichmentTarget[] {
  if (payload == null) return [];
  const out: EnrichmentTarget[] = [];
  for (const path of paths) {
    collectAt(payload, path === '' ? [] : path.split('.'), 0, out);
  }
  return out;
}

function collectAt(node: unknown, parts: string[], idx: number, out: EnrichmentTarget[]): void {
  if (node == null) return;

  if (idx === parts.length) {
    if (Array.isArray(node)) {
      for (const el of node) {
        if (isPlainObject(el)) out.push(el);
      }
    } else if (isPlainObject(node)) {
      out.push(node);
    }
    return;
  }

  if (Array.isArray(node)) {
    for (const el of node) collectAt(el, parts, idx, out);
    return;
  }

  if (!isPlainObject(node)) return;
  const next = node[parts[idx]];
  if (next == null) return;
  collectAt(next, parts, idx + 1, out);
}

/**
 * Return the unique, non-empty string ids found in `created_by_id`,
 * `updated_by_id`, and `deleted_by_id` across all targets.
 */
export function uniqueAuditUserIds(targets: EnrichmentTarget[]): string[] {
  const set = new Set<string>();
  for (const t of targets) {
    if (!isPlainObject(t)) continue;
    for (const f of AUDIT_BY_ID_FIELDS) {
      const v = t[f];
      if (typeof v === 'string' && v.length > 0) set.add(v);
    }
  }
  return Array.from(set);
}

/**
 * Mutate `target` in place: collapse `created_at + created_by_id` (and the
 * updated/deleted equivalents) into a single nested `audit` object of shape
 * `{ created?, updated?, deleted? }` where each entry is `{ at?, id?, name? }`.
 * Drops the raw fields. Omits a kind entirely when both its `*_at` and
 * `*_by_id` are null. If all three kinds are omitted, no `audit` key is added.
 * If the target has none of the six raw fields, no `audit` key is added.
 */
export function mutateToAuditShape(
  target: EnrichmentTarget,
  nameMap: Map<string, string | null>,
): void {
  if (!isPlainObject(target)) return;

  const hasAnyRaw = KIND_MAP.some(({ at, byId }) => at in target || byId in target);
  if (!hasAnyRaw) return;

  const audit: Record<string, { at?: string; id?: string; name?: string }> = {};
  let hasAnyKind = false;

  for (const { key, at, byId } of KIND_MAP) {
    const atVal = at in target ? (target[at] as Date | string | null | undefined) : undefined;
    const byIdVal = byId in target ? (target[byId] as string | null | undefined) : undefined;

    delete target[at];
    delete target[byId];

    const atIsNull = atVal == null;
    const byIdIsNull = byIdVal == null || byIdVal === '';
    if (atIsNull && byIdIsNull) continue;

    const entry: { at?: string; id?: string; name?: string } = {};
    if (!atIsNull) {
      entry.at = atVal instanceof Date ? atVal.toISOString() : (atVal as string);
    }
    if (!byIdIsNull) {
      const id = byIdVal as string;
      entry.id = id;
      const name = nameMap.get(id);
      entry.name = name == null ? 'Unknown' : name;
    }

    audit[key] = entry;
    hasAnyKind = true;
  }

  if (hasAnyKind) target.audit = audit;
}
