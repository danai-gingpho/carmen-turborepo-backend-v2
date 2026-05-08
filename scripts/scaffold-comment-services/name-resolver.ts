import type { NameVariants } from './types';

const COMMENT_SUFFIX = '-comment';

/**
 * Resolve all name variants for a comment service from its kebab directory name.
 * 'purchase-order-comment' → kebab/snake/pascal/camel variants
 */
export function resolveNames(kebabFull: string): NameVariants {
  if (!kebabFull.endsWith(COMMENT_SUFFIX)) {
    throw new Error(
      `Expected directory name ending with '${COMMENT_SUFFIX}', got: ${kebabFull}`,
    );
  }
  const kebab = kebabFull.slice(0, -COMMENT_SUFFIX.length);
  if (kebab.length === 0) {
    throw new Error(`Empty entity name in: ${kebabFull}`);
  }

  const parts = kebab.split('-');
  const snake = parts.join('_');
  const snakeFull = `${snake}_comment`;
  const pascal = parts.map(capitalize).join('');
  const pascalFull = `${pascal}Comment`;
  const camel = parts[0] + parts.slice(1).map(capitalize).join('');
  const camelFull = `${camel}Comment`;
  const parentIdField = `${snake}_id`;

  return {
    kebab,
    kebabFull,
    snake,
    snakeFull,
    pascal,
    pascalFull,
    camel,
    camelFull,
    parentIdField,
  };
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
