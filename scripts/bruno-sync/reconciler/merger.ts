import { parseBruText } from '../generator/bru-parser';
import type { BruSections } from '../types';

function renderKV(name: string, kv: Record<string, string>, order?: string[]): string {
  const lines: string[] = [`${name} {`];
  const keys = order ?? Object.keys(kv);
  for (const k of keys) {
    if (kv[k] !== undefined) lines.push(`  ${k}: ${kv[k]}`);
  }
  lines.push('}');
  return lines.join('\n');
}

function renderRaw(name: string, body: string): string {
  return `${name} {\n${body}\n}`;
}

export function mergeGeneratedWithExisting(generatedText: string, existingText: string): string {
  const gen = parseBruText(generatedText);
  const ex = parseBruText(existingText);

  const meta = { ...(gen.meta ?? {}) };
  if (ex.meta?.seq) meta.seq = ex.meta.seq;

  const blocks: string[] = [];
  blocks.push(renderKV('meta', meta, ['name', 'type', 'seq']));
  if (gen.method) blocks.push(renderRaw(gen.method.verb, gen.method.body));
  if (gen.headers !== undefined) blocks.push(renderRaw('headers', gen.headers));
  if (gen.auth) {
    const { scheme, ...rest } = gen.auth as Record<string, string>;
    blocks.push(renderKV(scheme, rest, Object.keys(rest)));
  }
  if (gen.query !== undefined) blocks.push(renderRaw('query', gen.query));
  if (gen.body_json !== undefined) blocks.push(renderRaw('body:json', gen.body_json));

  if (ex.vars_pre_request !== undefined) blocks.push(renderRaw('vars:pre-request', ex.vars_pre_request));
  if (ex.vars_post_response !== undefined) blocks.push(renderRaw('vars:post-response', ex.vars_post_response));
  if (ex.script_pre_request !== undefined) blocks.push(renderRaw('script:pre-request', ex.script_pre_request));
  if (ex.script_post_response !== undefined) blocks.push(renderRaw('script:post-response', ex.script_post_response));
  if (ex.tests !== undefined) blocks.push(renderRaw('tests', ex.tests));
  if (ex.docs !== undefined) blocks.push(renderRaw('docs', ex.docs));
  for (const [name, body] of Object.entries(ex.unknown)) {
    blocks.push(renderRaw(name, body));
  }

  return blocks.join('\n\n') + '\n';
}
