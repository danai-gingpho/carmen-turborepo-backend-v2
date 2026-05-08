/**
 * SQL safety validator
 * - Tokenizes SQL while respecting:
 *   - line / block comments
 *   - single & double-quoted strings (with escape doubling)
 *   - PostgreSQL dollar-quoted strings ($$...$$ and $tag$...$tag$)
 * - Splits on top-level `;` and validates each statement's leading keyword.
 */

const FORBIDDEN_LEADING = new Set([
  'DROP',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'COPY',
  'VACUUM',
  'CLUSTER',
  'REASSIGN',
  'REINDEX',
  'ALTER',
]);

function extractTopLevelStatements(sql: string): string[] {
  const stmts: string[] = [];
  let buf = '';
  let i = 0;
  const n = sql.length;

  while (i < n) {
    const ch = sql[i];
    const next = sql[i + 1];

    // line comment
    if (ch === '-' && next === '-') {
      while (i < n && sql[i] !== '\n') {
        buf += sql[i];
        i++;
      }
      continue;
    }

    // block comment
    if (ch === '/' && next === '*') {
      buf += '/*';
      i += 2;
      while (i < n && !(sql[i] === '*' && sql[i + 1] === '/')) {
        buf += sql[i];
        i++;
      }
      if (i < n) {
        buf += '*/';
        i += 2;
      }
      continue;
    }

    // single-quoted string
    if (ch === "'") {
      buf += ch;
      i++;
      while (i < n) {
        const c = sql[i];
        buf += c;
        i++;
        if (c === "'") {
          if (sql[i] === "'") {
            buf += sql[i];
            i++;
            continue;
          }
          break;
        }
      }
      continue;
    }

    // double-quoted identifier
    if (ch === '"') {
      buf += ch;
      i++;
      while (i < n) {
        const c = sql[i];
        buf += c;
        i++;
        if (c === '"') {
          if (sql[i] === '"') {
            buf += sql[i];
            i++;
            continue;
          }
          break;
        }
      }
      continue;
    }

    // dollar-quoted string
    if (ch === '$') {
      const m = sql.slice(i).match(/^\$([A-Za-z_]\w*)?\$/);
      if (m) {
        const tag = m[0];
        buf += tag;
        i += tag.length;
        const end = sql.indexOf(tag, i);
        if (end < 0) {
          buf += sql.slice(i);
          i = n;
        } else {
          buf += sql.slice(i, end + tag.length);
          i = end + tag.length;
        }
        continue;
      }
    }

    // statement separator (top-level)
    if (ch === ';') {
      const t = buf.trim();
      if (t) stmts.push(t);
      buf = '';
      i++;
      continue;
    }

    buf += ch;
    i++;
  }

  const last = buf.trim();
  if (last) stmts.push(last);
  return stmts;
}

function leadingKeyword(stmt: string): string {
  const cleaned = stmt
    .replace(/^\s*(?:--[^\n]*\n|\/\*[\s\S]*?\*\/)\s*/g, '')
    .trimStart();
  const m = cleaned.match(/^([A-Za-z]+)/);
  return m ? m[1].toUpperCase() : '';
}

export interface SqlValidationOptions {
  allowedLeading?: string[];
  allowMultiple?: boolean;
}

export function validateSqlSafety(sql: string, opts: SqlValidationOptions = {}): void {
  if (!sql?.trim()) throw new Error('sql is empty');

  const stmts = extractTopLevelStatements(sql);
  if (stmts.length === 0) throw new Error('No SQL statement found');
  if (!opts.allowMultiple && stmts.length > 1) {
    throw new Error(
      `Multiple statements are not allowed (found ${stmts.length}). Send one statement at a time.`,
    );
  }

  const allowed = opts.allowedLeading?.map((k) => k.toUpperCase());

  for (const stmt of stmts) {
    const kw = leadingKeyword(stmt);
    if (!kw) {
      throw new Error('Could not parse leading keyword of a statement');
    }
    if (FORBIDDEN_LEADING.has(kw)) {
      throw new Error(
        `Forbidden statement: "${kw}" is not allowed from the SQL editor`,
      );
    }
    if (allowed && !allowed.includes(kw)) {
      throw new Error(
        `Statement type "${kw}" is not allowed here. Allowed: ${allowed.join(', ')}`,
      );
    }
  }
}
