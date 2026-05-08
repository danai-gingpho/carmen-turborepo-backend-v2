import type { EndpointMeta, BruFile } from '../types';

function extractUrlFromVerbBody(body: string): string {
  const m = body.match(/url:\s*(\S+)/);
  return m ? m[1] : '';
}

function urlToSlug(url: string): string {
  const stripped = url.replace(/^\{\{base_url\}\}/, '').replace(/^\/+/, '');
  const segments = stripped.split('/').filter((s) => s && !s.startsWith('{{') && !s.startsWith(':'));
  if (segments[0] === 'api') return segments[1] ?? '';
  return segments[0] ?? '';
}

export function buildModuleLocationIndex(files: BruFile[]): Record<string, string> {
  const counts: Record<string, Record<string, number>> = {};
  for (const file of files) {
    if (!file.sections.method) continue;
    const url = extractUrlFromVerbBody(file.sections.method.body);
    const slug = urlToSlug(url);
    if (!slug) continue;
    const folder = file.relativePath.split('/').slice(0, -1).join('/');
    if (!folder) continue;
    counts[slug] ??= {};
    counts[slug][folder] = (counts[slug][folder] ?? 0) + 1;
  }
  const index: Record<string, string> = {};
  for (const [slug, folderMap] of Object.entries(counts)) {
    const winner = Object.entries(folderMap).sort((a, b) => b[1] - a[1])[0];
    if (winner) index[slug] = winner[0];
  }
  return index;
}

function stripPrefix(slug: string, prefix: string): string {
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
}

export function resolveTargetFolder(
  ep: EndpointMeta,
  locationIndex: Record<string, string>,
): string {
  if (locationIndex[ep.moduleSlug]) return locationIndex[ep.moduleSlug];

  if (ep.module.startsWith('config/')) {
    const name = stripPrefix(ep.moduleSlug, 'config_');
    return `config/${name}`;
  }
  if (ep.module.startsWith('platform/')) {
    const name = stripPrefix(ep.moduleSlug, 'platform_');
    return `platform/${name}`;
  }
  return `_uncategorized/${ep.moduleSlug}`;
}
