import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type TagMapping = Record<string, string>;

export function loadMapping(): TagMapping {
  const path = join(import.meta.dir, 'tag-mapping.json');
  return JSON.parse(readFileSync(path, 'utf8')) as TagMapping;
}
