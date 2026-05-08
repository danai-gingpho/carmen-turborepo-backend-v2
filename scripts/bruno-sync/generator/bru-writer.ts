import type { EndpointMeta, HttpMethod } from '../types';

function toKebab(s: string): string {
  return s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

const METHOD_NAME_MAP: Record<string, string> = {
  findAll: 'list',
  findOne: 'by-id',
  createOne: 'create',
  create: 'create',
  update: 'update',
  remove: 'remove',
  delete: 'remove',
};

export function fileNameForEndpoint(ep: EndpointMeta): string {
  const slug = METHOD_NAME_MAP[ep.methodName] ?? toKebab(ep.methodName);
  return `${ep.method}-${slug}.bru`;
}

function humanName(ep: EndpointMeta): string {
  const action = METHOD_NAME_MAP[ep.methodName] ?? toKebab(ep.methodName);
  const capAction = action.charAt(0).toUpperCase() + action.slice(1).replace(/-/g, ' ');
  return `${capAction} ${ep.moduleSlug || ep.controllerPath}`;
}

const ENV_VAR_PATH_PARAMS = new Set(['bu_code']);

function substituteParams(path: string): string {
  return path.replace(/:([a-zA-Z0-9_]+)/g, (match, name) =>
    ENV_VAR_PATH_PARAMS.has(name) ? `{{${name}}}` : match,
  );
}

function methodVerbLower(m: HttpMethod): string {
  return m.toLowerCase();
}

function formatBody(body: Record<string, unknown> | unknown[]): string {
  return JSON.stringify(body, null, 2).replace(/^/gm, '  ');
}

export interface WriteBruInput {
  endpoint: EndpointMeta;
  seq: number;
  bodySkeleton: Record<string, unknown> | unknown[];
}

export function writeBruText(input: WriteBruInput): string {
  const { endpoint: ep, seq, bodySkeleton } = input;
  const needsBody = ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH';
  const verb = methodVerbLower(ep.method);
  const url = `{{host}}${substituteParams(ep.fullPath)}`;

  const lines: string[] = [];
  lines.push('meta {');
  lines.push(`  name: ${humanName(ep)}`);
  lines.push('  type: http');
  lines.push(`  seq: ${seq}`);
  lines.push('}');
  lines.push('');

  lines.push(`${verb} {`);
  lines.push(`  url: ${url}`);
  lines.push(`  body: ${needsBody ? 'json' : 'none'}`);
  lines.push(`  auth: ${ep.isPublic ? 'none' : 'bearer'}`);
  lines.push('}');
  lines.push('');

  lines.push('headers {');
  lines.push('  x-app-id: {{x_app_id}}');
  if (needsBody) lines.push('  Content-Type: application/json');
  lines.push('}');
  lines.push('');

  if (!ep.isPublic) {
    lines.push('auth:bearer {');
    lines.push('  token: {{access_token}}');
    lines.push('}');
    lines.push('');
  }

  if (ep.queryParams.length > 0) {
    lines.push('query {');
    for (const q of ep.queryParams) lines.push(`  ~${q}: `);
    lines.push('}');
    lines.push('');
  }

  if (needsBody) {
    lines.push('body:json {');
    const body = formatBody(bodySkeleton);
    lines.push(body);
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}
