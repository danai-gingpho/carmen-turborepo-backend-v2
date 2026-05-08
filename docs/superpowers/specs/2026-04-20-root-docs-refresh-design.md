# Root Docs Refresh — Design Spec

**Date:** 2026-04-20
**Status:** Draft (awaiting user review)
**Sub-project:** #2 of 4 in the larger "update all docs" effort
**Depends on:** PR #8 (sub-project #1) — this spec bases its branch on `docs/cleanup-inventory` so the flat-prefix `docs/` targets linked from README actually exist. Re-targets to `main` when #8 merges.
**Follow-ups:** #3 Per-service/package READMEs · #4 Architecture docs verification

---

## 1. Purpose

Bring the repo's two root-level entry-point docs into alignment with the actual codebase:

- **`README.md`** — full rewrite targeting two audiences equally: humans onboarding (dev setup) and external evaluators (product/vision). Current README is badly stale (lists 8 microservices that no longer exist, stubbed License, generic Turborepo blurb).
- **`CLAUDE.md`** — targeted reconciliation. It is already mostly current; trim duplication with the new README, drop the product pitch, and add a "Gotchas" section distilled from sub-project #1 salvage.

The boundary is clear: README is for humans, CLAUDE.md is for agents. Minimize overlap.

## 2. Scope

### In scope

- Full rewrite of `README.md`.
- Targeted edits to `CLAUDE.md` per the delta in §4.
- Link-check pass on both files.

### Out of scope (later sub-projects)

- Per-service / per-package READMEs (sub-project #3).
- Verifying `docs/` content against current code (sub-project #4).
- Any `LICENSE` file creation.
- Edits anywhere outside `README.md` and `CLAUDE.md`.

### Non-goals

- Byte-for-byte accuracy of every example command. `package.json` scripts remain the canonical source; README shows representative examples and points to scripts for the full list.
- Replacing CLAUDE.md with README. CLAUDE.md stays agent-oriented.

## 3. Target End State — `README.md`

### Outline

```
# Carmen Backend

[One-sentence tagline — e.g., "Multi-tenant hospitality ERP backend: procurement, inventory, recipes, master data."]

Status: active development; APIs may change between minor versions.

## What Carmen is
## Core capabilities
## Architecture at a glance
## Tech stack
---
## Getting started (dev)
## Running services
## Database
## Deployment
## API
## Project layout
## Contributing / conventions
## Support
```

### Section-by-section content

**Title + tagline + status line.** Single sentence, single status line. No badges.

**What Carmen is.** Max 2 short paragraphs. Inferred from Prisma schemas (platform: users/clusters/business-units/roles/subscriptions; tenant: products/inventory/procurement/recipes/vendors/locations), gateway routes, and Bruno collection folder names. Establishes: multi-tenant SaaS, hospitality/hotel focus, procurement+inventory primary domain.

**Core capabilities.** Bullet list. Every bullet grounded in an observable artifact (route module, Prisma model, or Bruno folder). Each bullet links to the relevant Bruno collection folder or `docs/domain-*.md` where applicable. Anticipated bullets:
- Procurement: PR → PO → GRN workflow → `apps/bruno/carmen-inventory/purchase-request/` (etc.)
- Inventory: stock in/out/transfer/count/adjustment → Bruno folders
- Recipes & BOM → recipe route + Bruno folder
- Master data: locations/vendors/products/units → Bruno `config/`
- Audit logging → `@repo/log-events-library`
- RBAC via Keycloak → auth routes
A bullet without an artifact reference gets dropped.

**Architecture at a glance.** Short paragraph + ASCII topology box showing gateway → micro-business / micro-file / micro-keycloak-api / micro-notification / micro-cluster. Links to `docs/architecture-system.md` for the full diagram set. Mentions dual Prisma schemas and TCP inter-service RPC.

**Tech stack.** One-line bullet list: Bun · NestJS 11 · TypeScript · Prisma · PostgreSQL · Turborepo · Keycloak · Socket.io. No version pinning beyond major (versions belong in `package.json`).

**Horizontal rule separator** between product/vision half and dev setup half.

**Getting started (dev).** Numbered 5-step quickstart. Exact steps:
1. Prerequisites: Bun ≥ 1.2.5, PostgreSQL, Keycloak instance.
2. Clone + `bun run setup` (which runs install + build:package).
3. Copy `.env.example` files to `.env` per service (link to list of `.env.example` paths).
4. `bun run db:generate` to create Prisma clients.
5. `bun run dev:base` (gateway + business + keycloak API, the common dev subset).

Each step is one line plus one command. Longer walkthrough lives in `docs/ops-start-dev-base.md` — link at end.

**Running services.** Copy-pasteable commands: `bun run dev`, `dev:base`, `dev:business`, `build`, `build:package`, `lint`, `format`, `check-types`. Ends with: "See `package.json` scripts for the full list."

**Database.** 3–4 bullets: two Prisma schemas (link to `docs/deploy-platform-schema.md` and `docs/deploy-tenant-schema.md`), `db:generate` / `db:migrate` / `db:seed`, per-schema commands (`cd packages/prisma-shared-schema-*`).

**Deployment.** Bulleted pointer list:
- Docker Compose → `docs/deploy-docker-run.md`
- SSL / Keycloak → `docs/ops-fix-ssl-keycloak.md`
- K8s → `docs/architecture-system.md` (k8s section)
- Backup / restore → `docs/ops-backup.md` + `scripts/backup/`
- Prisma upgrade → `docs/ops-prisma-upgrade-script.md`

**API.** 3 bullets: Swagger at gateway `/swagger`, Bruno collections in `apps/bruno/carmen-inventory/`, response wrapper shape (`{ data, status, success, message, timestamp }`). No DTO details — those live in Swagger.

**Project layout.** Tree listing of `apps/`, `packages/`, `docs/`, `scripts/` with one-line descriptions. Links `docs/` to a representative doc per prefix.

**Contributing / conventions.** Two lines. One: "See `CLAUDE.md` for code conventions, testing patterns, and agent/dev guidance." One: branch/PR conventions if established (otherwise omit).

**Support.** One line: contact or issue tracker. If no tracker is established, single line: "Open a GitHub issue on this repo."

### Target length

150–200 lines, single scroll for a typical monitor. Current README is 255 lines of mostly stale content; new README is tighter and more accurate.

### Explicitly dropped sections (from current README)

- Stale microservice list (micro-authen, micro-cronjob, micro-license, micro-tenant-*) — replaced with current 5.
- Stale package list including `@repo/shared-microservice-library` — replaced with actual 4 (`eslint-config`, `log-events-library`, `prisma-shared-schema-platform`, `prisma-shared-schema-tenant`).
- Generic "Turborepo Features" bullets — readable from Turborepo docs.
- "Common Tasks" sub-headings (Adding a New Microservice / Package) — current process isn't documented.
- Root-level "Troubleshooting" — migrated to `docs/ops-*` or inline where useful.
- License section — omitted per user preference; no `LICENSE` file created.

## 4. Target End State — `CLAUDE.md`

### Delta (keep / trim / add)

**Trim:**

- Opening "Project Overview" paragraph shrinks to one sentence: `Carmen is a multi-tenant SaaS ERP backend for hotel/procurement management. See README.md for product scope.`
- "Common Commands" block trims to agent-specific items only: `bun run build:package` (a prereq agents often miss), per-schema `bun run db:seed.permission`, `bun run test:cov`, `db:mock` variants (salvaged from WARP.md). The core `dev` / `build` / `lint` trio moves out — README covers it.
- "Testing" block trims: keep per-service `test:e2e` / `test:watch` / `test:cov`; drop the intro line about testing being per-service (well-known).

**Keep verbatim:**

- Architecture section (service topology, ports, TCP pattern).
- Multi-Tenancy via Dual Prisma Schemas.
- Gateway Routing Pattern.
- Authentication.
- Shared Packages list (verify against `packages/`; current list of 4 is accurate).
- Path Aliases.
- Code Conventions.
- Environment Setup + Keycloak Configuration (including the important note about admin credentials).
- Bruno API Collections.
- Build Dependencies.

**Add — new "Gotchas" section** (between Build Dependencies and end of file):

```markdown
## Gotchas

Non-obvious behaviors to know before touching the code. Entries marked
_(verify against current code)_ are salvaged from a historical report
(see `docs/design-legacy-notes.md`) and should be re-confirmed before
being treated as authoritative.

- **Service consolidation history.** Earlier branches had `micro-authen`, `micro-tenant-inventory`, `micro-tenant-master`, `micro-tenant-procurement`, `micro-tenant-recipe` as separate services. They were merged into `micro-business`. Don't expect to find them.
- **TCP message pattern drift.** _(verify against current code)_ When refactoring a `@MessagePattern()` handler in `micro-business`, also update the matching `@Client.send()` call in `backend-gateway`. Mismatches cause silent 500s.
- **Prisma `findMany` with spread + select conflict.** _(verify against current code)_ `prisma.x.findMany({ ...query, select: {...} })` throws if `query` also sets `select`. Build the query object without spread, or strip `select` from the spread.
- **Tenant DB migration gap — recipe tables.** _(verify against current code)_ Recipe tables historically lagged behind master data on new-tenant schema deploys. Re-run `db:migrate` inside `packages/prisma-shared-schema-tenant` after adding a tenant.
- **Credentials in pre-PR-#8 git history.** A Supabase-style token `8wzw8O77O0VAGDnt` and dev password `123456` are present in commits on `main` predating sub-project #1. Rotate the Supabase token and scrub history separately; redacting going forward doesn't un-leak them.
```

Cap is not hard — the filter is "not obvious from code + still potentially relevant." Expect 4–6 entries surviving that filter.

### Explicitly NOT changed

- Module ordering / section ordering (keep current top-to-bottom flow).
- Code convention text (naming, function size, booleans, Zod, etc.).
- Env variable list.

## 5. Process

1. **Branch.** Work happens in an isolated worktree at `../carmen-turborepo-backend-v2-root-docs` on branch `docs/root-docs-refresh`, based on `docs/cleanup-inventory` (PR #8). The spec and plan commit lives on this branch first.
2. **Grounding reads.** Before drafting: read `package.json` scripts, gateway route module index (`apps/backend-gateway/src/config/`, `src/application/`, `src/platform/`), Bruno collection folder structure (`apps/bruno/carmen-inventory/`), and both Prisma schema files. Verify every capability bullet has an artifact.
3. **Draft README.** Single commit: `docs: rewrite README for current architecture`.
4. **Revise CLAUDE.md.** Single commit: `docs: trim overlap with README; add gotchas section`.
5. **Link-check.** `bunx lychee --offline --no-progress README.md CLAUDE.md`. Fix and re-run until clean.
6. **PR.** Open against `main` if PR #8 has merged; otherwise PR's base branch is `docs/cleanup-inventory` and gets re-targeted on #8 merge.

## 6. Done Criteria

- `README.md` matches the outline in §3. No placeholder text. Length 150–200 lines.
- Every bullet in "Core capabilities" has an inline link or parenthetical reference to a route module, Prisma model, or Bruno folder.
- `CLAUDE.md` trim/keep/add matches §4. Opening paragraph is one sentence. "Gotchas" section present with 4–6 entries, each marked `_(verify against current code)_` if not independently confirmed.
- `bunx lychee --offline` exits 0 on both files.
- Two dedicated content commits, one per file (`README.md` rewrite; `CLAUDE.md` delta). Additional commits for the spec/plan and any link fixes are permitted and expected.
- Working tree clean after each commit.
- PR description lists both files, links sub-project #1 (PR #8), and notes re-targeting if applicable.

### Explicitly NOT in done criteria

- Content accuracy verification of `docs/` files linked from README — sub-project #4.
- Per-service / per-package READMEs — sub-project #3.
- Removing / rotating leaked credentials — security follow-up, flagged in gotcha.

## 7. Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | README claims capabilities the code doesn't support. | Every "Core capabilities" bullet must cite an artifact (route / model / Bruno folder). If none exists, drop the bullet. |
| 2 | "Gotchas" promotes stale debugging notes to authoritative status. | Mark each unverified gotcha `_(verify against current code)_`. Sub-project #4 promotes or removes after verification. |
| 3 | Product pitch drifts again within months. | Cap pitch at 2 paragraphs. Detailed domain discussion lives in `docs/design-*`, not README. |
| 4 | Quickstart commands diverge from `package.json`. | Close the "Running services" section with: "See `package.json` scripts for the full list." README claims representativeness, not exhaustiveness. |
| 5 | PR #8 hasn't merged when implementation starts. | Base branch is `docs/cleanup-inventory` until #8 merges, then rebase onto `main`. Handled in Task 1 of the plan. |
| 6 | PR #8 is rejected or heavily revised. | Low risk — work is mechanical. If it happens, adapt this spec's paths to whatever ships. Worst case: rewrite the doc links once. |

## 8. Assumptions

- PR #8 (sub-project #1) is either merged or queued for merge. If rejected outright, this spec's doc-path references need updating, but the overall structure still applies.
- `lychee` remains available via `bunx` (confirmed working in sub-project #1).
- No external doc hosting (GitBook, Notion) needs to be synced; the repo `README.md` is the canonical entry point.
- Single reviewer cycle is sufficient (no product-org signoff required for the README pitch).

## 9. Implementation Ordering (for the plan)

1. Create/verify worktree at `../carmen-turborepo-backend-v2-root-docs` on branch `docs/root-docs-refresh`.
2. Commit spec and plan to the branch.
3. Grounding reads (package.json, gateway routes, Bruno folders, Prisma schemas).
4. Draft `README.md` top-half (product/vision). Verify every capability bullet has an artifact.
5. Draft `README.md` bottom-half (dev setup). Include all `docs/` links.
6. Commit README.
7. Edit `CLAUDE.md` — trim opening, trim commands, add Gotchas.
8. Commit CLAUDE.md.
9. Run `bunx lychee --offline`. Fix breaks.
10. Push and open PR.

---

**Next step:** user review of this spec, then invoke `writing-plans` for the implementation plan.
