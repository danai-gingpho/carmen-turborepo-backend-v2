import type { BruSections } from '../types';

const SECTION_HEADER_RE = /^([a-z][a-z0-9_:-]*)\s*\{\s*$/i;

function splitSections(text: string): { name: string; body: string }[] {
  const lines = text.split('\n');
  const sections: { name: string; body: string }[] = [];
  let current: { name: string; body: string[] } | null = null;
  let depth = 0;
  for (const line of lines) {
    if (!current) {
      const m = line.match(SECTION_HEADER_RE);
      if (m) {
        current = { name: m[1], body: [] };
        depth = 1;
      }
      continue;
    }
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    depth += opens - closes;
    if (depth <= 0) {
      // closing line of the section
      sections.push({ name: current.name, body: current.body.join('\n') });
      current = null;
      depth = 0;
      continue;
    }
    current.body.push(line);
  }
  if (current) sections.push({ name: current.name, body: current.body.join('\n') });
  return sections;
}

function parseKeyValueBlock(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

const HTTP_VERBS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

export function parseBruText(text: string): BruSections {
  const out: BruSections = { unknown: {} };
  const sections = splitSections(text);
  for (const { name, body } of sections) {
    const key = name.toLowerCase();
    if (key === 'meta') out.meta = parseKeyValueBlock(body);
    else if (HTTP_VERBS.has(key)) out.method = { verb: key, body };
    else if (key === 'headers') out.headers = body;
    else if (key === 'auth:bearer' || key === 'auth:basic' || key === 'auth:apikey') {
      out.auth = { scheme: key, ...parseKeyValueBlock(body) };
    } else if (key === 'query') out.query = body;
    else if (key === 'body:json' || key === 'body:text' || key === 'body:form-urlencoded') out.body_json = body;
    else if (key === 'vars:pre-request') out.vars_pre_request = body;
    else if (key === 'vars:post-response') out.vars_post_response = body;
    else if (key === 'script:pre-request') out.script_pre_request = body;
    else if (key === 'script:post-response') out.script_post_response = body;
    else if (key === 'tests') out.tests = body;
    else if (key === 'docs') out.docs = body;
    else out.unknown[name] = body;
  }
  return out;
}

export async function parseBruFile(path: string): Promise<BruSections> {
  const text = await Bun.file(path).text();
  return parseBruText(text);
}
