import { join } from 'node:path';

export const REPO_ROOT = process.cwd();
export const GATEWAY_SRC = join(REPO_ROOT, 'apps/backend-gateway/src');
export const GATEWAY_MAIN = join(GATEWAY_SRC, 'main.ts');
export const GATEWAY_SCAN_DIRS = ['application', 'config', 'platform'] as const;

export const BRUNO_ROOT = join(REPO_ROOT, 'apps/bruno/carmen-inventory');
export const BRUNO_ARCHIVE_DIR = join(BRUNO_ROOT, '_archived');
export const BRUNO_UNCATEGORIZED_DIR = join(BRUNO_ROOT, '_uncategorized');

export const BRUNO_PRESERVED_DIRS = [
  'environments',
  'auth',
  '_archived',
] as const;

export const BRUNO_PRESERVED_FILES = ['bruno.json'] as const;

export const DTO_MAX_DEPTH = 3;
