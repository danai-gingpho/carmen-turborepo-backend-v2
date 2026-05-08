import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Template } from './types';

const TEMPLATE_DIR_RELATIVE = 'apps/micro-business/src/procurement/purchase-request-comment';

/**
 * Load the purchase-request-comment service files as a template.
 * rootDir is the repo root.
 */
export function loadTemplate(rootDir: string): Template {
  const dir = join(rootDir, TEMPLATE_DIR_RELATIVE);
  return {
    controller: readFileSync(join(dir, 'purchase-request-comment.controller.ts'), 'utf8'),
    service: readFileSync(join(dir, 'purchase-request-comment.service.ts'), 'utf8'),
    module: readFileSync(join(dir, 'purchase-request-comment.module.ts'), 'utf8'),
  };
}
