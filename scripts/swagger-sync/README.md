# swagger-sync

Tooling that keeps `@ApiTags(...)` across 144 gateway controllers aligned
with the single source of truth in
`apps/backend-gateway/src/swagger/tag-groups.ts`.

## Files
- `tag-mapping.json` — `<controller-path>` → `<tag-name>`.
- `retag.ts` — codemod that applies `tag-mapping.json`.
- `tag-mapping.ts` — loader + validation helpers.

## Commands (from repo root)
- `bun run swagger:retag:dry` — print diff, no writes.
- `bun run swagger:retag` — apply codemod.
- `bun run swagger:verify` — headless Nest boot + tag invariants.

## When to update
Any new `*.controller.ts` in `apps/backend-gateway/src/` must add an
entry to `tag-mapping.json`, otherwise CI's `swagger:verify` step fails.

## Spec
`docs/superpowers/specs/2026-04-22-swagger-tag-redesign-design.md`
