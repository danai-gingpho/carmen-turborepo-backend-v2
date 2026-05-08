import { resolveNames } from './name-resolver';
import type { NameVariants, RenderedService, Template } from './types';

/**
 * Hard-coded template names (purchase-request-comment).
 */
export const TEMPLATE_NAMES: NameVariants = resolveNames('purchase-request-comment');

/**
 * Render template strings for a target service.
 * Substitutes every form of the entity name (kebab/snake/pascal/camel + Full + parentIdField).
 *
 * Two-phase substitution to avoid token collision:
 *   Phase 1: replace each `from.*` form with a unique placeholder marker.
 *   Phase 2: replace each placeholder with the corresponding `to.*` form.
 *
 * This prevents corruption when target tokens are supersets of source tokens
 * (e.g. 'purchase-request' → 'purchase-request-detail' would, in a single-pass
 * approach, re-match the just-substituted string).
 */
export function render(
  template: Template,
  to: NameVariants,
  from: NameVariants = TEMPLATE_NAMES,
): RenderedService {
  return {
    controller: substituteAll(template.controller, from, to),
    service: substituteAll(template.service, from, to),
    module: substituteAll(template.module, from, to),
  };
}

// NUL-bracketed placeholders cannot appear in valid TypeScript source files,
// so phase-1 markers do not interact with surrounding code.
const SENTINEL = '';
const ph = (key: string): string => `${SENTINEL}${key}${SENTINEL}`;

function substituteAll(input: string, from: NameVariants, to: NameVariants): string {
  // Order: longest source first so '*Full' / 'parentIdField' are marked
  // before bare 'snake' / 'kebab' / 'pascal' / 'camel'. This prevents Phase 1
  // from stealing the inner substring of an already-marked longer token.
  const slots: Array<{ key: keyof NameVariants; placeholder: string }> = [
    { key: 'parentIdField', placeholder: ph('PARENTID') },
    { key: 'snakeFull',     placeholder: ph('SNAKEFULL') },
    { key: 'kebabFull',     placeholder: ph('KEBABFULL') },
    { key: 'pascalFull',    placeholder: ph('PASCALFULL') },
    { key: 'camelFull',     placeholder: ph('CAMELFULL') },
    { key: 'snake',         placeholder: ph('SNAKE') },
    { key: 'kebab',         placeholder: ph('KEBAB') },
    { key: 'pascal',        placeholder: ph('PASCAL') },
    { key: 'camel',         placeholder: ph('CAMEL') },
  ];

  // Phase 1: source → placeholder
  let out = input;
  for (const { key, placeholder } of slots) {
    const search = from[key];
    if (search.length === 0) continue;
    out = out.split(search).join(placeholder);
  }

  // Phase 2: placeholder → target
  for (const { key, placeholder } of slots) {
    const replace = to[key];
    out = out.split(placeholder).join(replace);
  }

  return out;
}
