# Root Docs Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `README.md` for current architecture (human-onboarding doc, product pitch + dev setup) and reconcile `CLAUDE.md` (trim overlap, add Gotchas section).

**Architecture:** One branch (`docs/root-docs-refresh`) based on PR #8's `docs/cleanup-inventory`. Two content commits (one per file) + spec/plan commit + optional link-fix commit. Every capability bullet in README must cite a code artifact (route / Prisma model / Bruno folder).

**Tech Stack:** Markdown, git, `bunx lychee` for link checking, `gh` for PR.

**Source spec:** `docs/superpowers/specs/2026-04-20-root-docs-refresh-design.md`

---

## Pre-flight checklist (do before Task 1)

- [ ] Verify working directory is the worktree at `/Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2-root-docs`.
- [ ] Verify branch: `git rev-parse --abbrev-ref HEAD` → `docs/root-docs-refresh`.
- [ ] Verify base: `git log -1 --format='%H %s' docs/cleanup-inventory` resolves to PR #8's HEAD.
- [ ] Confirm `bunx` works: `bun --version`.

---

## Task 1: Commit spec+plan on `docs/root-docs-refresh` branch

**Files:**
- Commit (already exist): `docs/superpowers/specs/2026-04-20-root-docs-refresh-design.md`, `docs/superpowers/plans/2026-04-20-root-docs-refresh.md`.

- [ ] **Step 1: Verify branch and uncommitted files**

Run: `git status`
Expected: on `docs/root-docs-refresh`; the two new files listed as untracked under `docs/superpowers/`.

- [ ] **Step 2: Stage the two files**

Run:
```
git add docs/superpowers/specs/2026-04-20-root-docs-refresh-design.md \
        docs/superpowers/plans/2026-04-20-root-docs-refresh.md
```

- [ ] **Step 3: Commit**

Run:
```
git commit -m "$(cat <<'EOF'
docs: add spec and plan for root docs refresh (sub-project #2)

Spec: full README rewrite + CLAUDE.md delta (trim + gotchas).
Based on PR #8 (docs/cleanup-inventory) for flat-prefix doc targets.

Plan: bite-sized tasks per superpowers:writing-plans.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify**

Run: `git log -1 --stat`
Expected: one commit adding exactly the two files.

---

## Task 2: Draft and commit `README.md`

**Files:**
- Replace wholesale: `README.md`

This task is the biggest one. Steps are fine-grained because drafting involves grounding reads that affect the final text.

### Grounding reads (Steps 1–5)

- [ ] **Step 1: Read `package.json` scripts**

Use the Read tool on `/Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2-root-docs/package.json`. Extract the `scripts` block. Note the exact command names you'll list in README "Running services" (core commands: `setup`, `dev`, `dev:base`, `dev:business`, `build`, `build:package`, `lint`, `format`, `check-types`, `db:generate`, `db:migrate`).

- [ ] **Step 2: Enumerate gateway route modules**

Run:
```
ls apps/backend-gateway/src/config/ apps/backend-gateway/src/application/ apps/backend-gateway/src/platform/ 2>/dev/null
```
Expected: directory listing. Note domain names present (procurement, inventory, recipes, master data, etc.).

- [ ] **Step 3: Enumerate Bruno collections**

Run:
```
ls apps/bruno/carmen-inventory/ | sort
```
Expected: domain folders (`purchase-request`, `purchase-order`, `good-received-note`, `stock-in`, `stock-out`, `transfer`, `config`, `platform`, `auth`, etc.).

- [ ] **Step 4: Scan Prisma schemas for top-level models**

Run:
```
grep -E '^model ' packages/prisma-shared-schema-platform/prisma/schema.prisma | head -40
grep -E '^model ' packages/prisma-shared-schema-tenant/prisma/schema.prisma | head -80
```
Expected: `model <Name> {` lines. Note the domain coverage visible in the tenant schema (products, inventory, procurement, recipes, vendors, locations).

- [ ] **Step 5: Confirm `apps/` and `packages/` directory contents**

Run:
```
ls apps/
ls packages/
```
Expected:
- `apps/`: `backend-gateway`, `bruno`, `micro-business`, `micro-cluster`, `micro-file`, `micro-keycloak-api`, `micro-notification`.
- `packages/`: `eslint-config`, `log-events-library`, `prisma-shared-schema-platform`, `prisma-shared-schema-tenant`.

If actual contents differ from this list, adjust the project-layout section of README accordingly.

### Draft the new README (Steps 6–8)

- [ ] **Step 6: Write the new `README.md`**

Use the Write tool to replace the existing `README.md`. The content must match this structure exactly (content filled from grounding reads; square-bracket inserts show what to fill). This is ONE file write; verify full content before committing.

```markdown
# Carmen Backend

Multi-tenant hospitality ERP backend: procurement, inventory, recipes, master data.

Status: active development; APIs may change between minor versions.

## What Carmen is

Carmen is a multi-tenant SaaS backend for hotel and hospitality operations.
The platform manages the procurement-to-inventory lifecycle — purchase
requests, purchase orders, good-received notes, stock movements, inventory
counts — plus the master data (locations, vendors, products, units) and
supporting functions (recipes, audit logging, RBAC) that hospitality
operators depend on.

The system is multi-tenant by design: a shared platform schema holds
user/role/subscription data across all tenants, while each tenant gets
its own data schema for products, inventory, procurement, and recipes.

## Core capabilities

Each bullet links to the primary artifact so you can verify the feature
exists in code.

- **Procurement workflow** — Purchase Request → Purchase Order → Good Received Note. See [`apps/bruno/carmen-inventory/purchase-request/`](apps/bruno/carmen-inventory/purchase-request/), [`purchase-order/`](apps/bruno/carmen-inventory/purchase-order/), [`good-received-note/`](apps/bruno/carmen-inventory/good-received-note/).
- **Inventory movements** — stock in/out/transfer, inventory counts, adjustments. See [`apps/bruno/carmen-inventory/stock-in/`](apps/bruno/carmen-inventory/stock-in/), [`stock-out/`](apps/bruno/carmen-inventory/stock-out/), [`transfer/`](apps/bruno/carmen-inventory/transfer/).
- **Recipes & BOM** — recipe definitions with ingredient breakdown. See the recipe-related Bruno folders and tenant Prisma schema models.
- **Master data** — locations, vendors, products, units of measure. See [`apps/bruno/carmen-inventory/config/`](apps/bruno/carmen-inventory/config/).
- **Audit logging** — structured events with per-entity history. See [`packages/log-events-library/`](packages/log-events-library/).
- **RBAC via Keycloak** — roles, permissions, cluster/business-unit scoping. See [`apps/micro-keycloak-api/`](apps/micro-keycloak-api/) and [`apps/bruno/carmen-inventory/auth/`](apps/bruno/carmen-inventory/auth/).
- **Real-time notifications** — Socket.io-based push channel. See [`apps/micro-notification/`](apps/micro-notification/).

> Drop any bullet above if its artifact is missing in the current tree.
> If a new capability has an artifact but no bullet, add one here.

## Architecture at a glance

API gateway pattern with TCP inter-service RPC. A single HTTP entry point
forwards domain requests to microservices via NestJS `@MessagePattern()`
handlers. Auth is Keycloak-based with JWT validation proxied through a
dedicated service.

```
                       ┌─────────────────────┐
   HTTPS :4001 ───────▶│   backend-gateway   │◀─── /swagger, /ws
   HTTP  :4000         └──────────┬──────────┘
                                  │ TCP
             ┌────────────────────┼─────────────────────────┐
             ▼                    ▼                         ▼
    ┌────────────────┐   ┌────────────────┐        ┌────────────────┐
    │ micro-business │   │   micro-file   │  ...   │ micro-keycloak │
    │   TCP 5020     │   │   TCP 5007     │        │    TCP 5013    │
    └────────────────┘   └────────────────┘        └────────────────┘
```

- `micro-business` — consolidated business logic (auth, clusters, inventory, master data, procurement, recipes, logging).
- `micro-file` — file storage.
- `micro-notification` — real-time notifications (Socket.io).
- `micro-keycloak-api` — Keycloak integration.
- `micro-cluster` — cluster management.

Two Prisma schemas: **platform** (cross-tenant: users, clusters, roles,
subscriptions) and **tenant** (per-tenant: products, inventory,
procurement, recipes, vendors, locations). Both use UUID primary keys
and soft deletes.

Full architecture diagrams: [`docs/architecture-system.md`](docs/architecture-system.md).

## Tech stack

Bun · NestJS 11 · TypeScript · Prisma · PostgreSQL · Turborepo · Keycloak · Socket.io

---

## Getting started (dev)

Prerequisites:

- Bun ≥ 1.2.5
- PostgreSQL (local or remote)
- A Keycloak instance (local docker or shared dev server)

5-step quickstart:

```bash
# 1. Clone
git clone <repository-url> && cd carmen-turborepo-backend-v2

# 2. Install + build shared packages
bun run setup

# 3. Copy .env.example → .env per service (repeat for each apps/*/)
cp apps/backend-gateway/.env.example apps/backend-gateway/.env
cp apps/micro-business/.env.example apps/micro-business/.env
# ...etc. for micro-file, micro-keycloak-api, micro-notification, micro-cluster

# 4. Generate Prisma clients
bun run db:generate

# 5. Start the common dev subset (gateway + business + keycloak API)
bun run dev:base
```

Detailed walkthrough: [`docs/ops-start-dev-base.md`](docs/ops-start-dev-base.md).

## Running services

```bash
bun run dev              # all services
bun run dev:base         # gateway + business + keycloak API (common)
bun run dev:business     # business service only
bun run build            # build all
bun run build:package    # build shared packages only
bun run lint
bun run format
bun run check-types
```

See `package.json` scripts for the full list.

## Database

- Two Prisma schemas generate distinct clients: `@repo/prisma-shared-schema-platform` and `@repo/prisma-shared-schema-tenant`.
- Root scripts run across both: `bun run db:generate`, `bun run db:migrate`.
- Per-schema operations: `cd packages/prisma-shared-schema-<platform|tenant> && bun run db:seed`.
- Schema deployment guides: [`docs/deploy-platform-schema.md`](docs/deploy-platform-schema.md), [`docs/deploy-tenant-schema.md`](docs/deploy-tenant-schema.md).

## Deployment

- Docker Compose: [`docs/deploy-docker-run.md`](docs/deploy-docker-run.md).
- SSL / Keycloak configuration: [`docs/ops-fix-ssl-keycloak.md`](docs/ops-fix-ssl-keycloak.md).
- Kubernetes: see the k8s section in [`docs/architecture-system.md`](docs/architecture-system.md).
- Backup / restore: [`docs/ops-backup.md`](docs/ops-backup.md) and the backup scripts under [`scripts/backup/`](scripts/backup/).
- Prisma upgrade procedure: [`docs/ops-prisma-upgrade-script.md`](docs/ops-prisma-upgrade-script.md).

## API

- **Swagger:** available on the gateway at `/swagger` (HTTP :4000 or HTTPS :4001).
- **Bruno collections:** [`apps/bruno/carmen-inventory/`](apps/bruno/carmen-inventory/) — login variants, per-domain requests, environments for localhost + dev server.
- **Response wrapper:** `{ data, status, success, message, timestamp }`.

## Project layout

```
carmen-turborepo-backend-v2/
├── apps/
│   ├── backend-gateway/     # HTTP gateway, routes → TCP microservices
│   ├── bruno/               # API test collections (.bru files)
│   ├── micro-business/      # Consolidated business logic
│   ├── micro-cluster/       # Cluster management
│   ├── micro-file/          # File storage
│   ├── micro-keycloak-api/  # Keycloak integration
│   └── micro-notification/  # Socket.io notifications
├── packages/
│   ├── eslint-config/
│   ├── log-events-library/
│   ├── prisma-shared-schema-platform/
│   └── prisma-shared-schema-tenant/
├── docs/                    # Flat-prefix docs: architecture-*, deploy-*, ops-*, domain-*, design-*
├── scripts/                 # Operational scripts (deploy, migrate, backup/)
├── CLAUDE.md                # Agent-oriented conventions and gotchas
├── README.md                # This file
└── package.json
```

## Contributing / conventions

See [`CLAUDE.md`](CLAUDE.md) for code conventions, testing patterns, and agent/dev guidance.

## Support

Open a GitHub issue on this repo.
```

- [ ] **Step 7: Verify the new README**

Run:
```
wc -l README.md
```
Expected: roughly 150–200 lines.

Run:
```
grep -cE '^## ' README.md
```
Expected: 13 (one per section header).

Manually verify every link target resolves:
- `docs/architecture-system.md`, `docs/ops-start-dev-base.md`, `docs/deploy-platform-schema.md`, `docs/deploy-tenant-schema.md`, `docs/deploy-docker-run.md`, `docs/ops-fix-ssl-keycloak.md`, `docs/ops-backup.md`, `docs/ops-prisma-upgrade-script.md` all exist under `docs/`.
- `apps/bruno/carmen-inventory/purchase-request/` etc. all exist.
- `packages/log-events-library/` and `apps/micro-*` paths all exist.

Run:
```
for p in docs/architecture-system.md docs/ops-start-dev-base.md docs/deploy-platform-schema.md \
         docs/deploy-tenant-schema.md docs/deploy-docker-run.md docs/ops-fix-ssl-keycloak.md \
         docs/ops-backup.md docs/ops-prisma-upgrade-script.md CLAUDE.md; do
  test -e "$p" && echo "OK $p" || echo "MISSING $p"
done
```
Expected: all `OK`.

If any target is `MISSING`, STOP and report the list. Do not commit with broken links.

- [ ] **Step 8: Commit the new README**

Run:
```
git add README.md
git commit -m "$(cat <<'EOF'
docs: rewrite README for current architecture

Full rewrite replacing the stale Feb 2026 README. New structure:
- Product/vision top half (2 audiences: onboarding + external evaluators)
- Dev setup bottom half with rich links into flat-prefix docs/

Capability bullets are grounded in route modules, Prisma models,
and Bruno collections. Stale microservice lists removed
(micro-authen, micro-tenant-*, micro-cronjob, micro-license
were consolidated into micro-business in a prior refactor).

License section omitted per sub-project #2 spec (Q4=skip).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Verify commit**

Run:
```
git log -1 --stat
```
Expected: single file modified (`README.md`), both additions and deletions (net change depends on new vs old length).

---

## Task 3: Edit and commit `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

This task applies targeted edits per the spec §4 delta. Use the Edit tool, one edit per change.

- [ ] **Step 1: Read the current `CLAUDE.md`**

Read the full file with the Read tool so subsequent Edit calls have accurate `old_string` values.

- [ ] **Step 2: Trim the Project Overview**

Edit:
- **old_string:**
  ```
  ## Project Overview

  Carmen is a multi-tenant SaaS ERP backend for hotel/procurement management. Built with NestJS microservices in a Turborepo monorepo, using Bun as the package manager.
  ```
- **new_string:**
  ```
  ## Project Overview

  Carmen is a multi-tenant SaaS ERP backend for hotel/procurement management. See `README.md` for product scope, core capabilities, and architecture overview. This file covers conventions and gotchas agents should know before editing.
  ```

- [ ] **Step 3: Trim the "Common Commands" block**

Find and replace the entire `## Common Commands` section with an agent-specific subset. Read the current content first to get the exact `old_string`. Expected old content is roughly:

```
## Common Commands

```bash
# Setup (install + build shared packages)
bun run setup

# Development
bun run dev                 # All services
bun run dev:base            # Gateway + Business + Keycloak API (most common)
bun run dev:business        # Business service only

# Build
bun run build               # Build all
bun run build:package       # Build shared packages only

# Code quality
bun run lint                # ESLint
bun run format              # Prettier
bun run check-types         # TypeScript type checking

# Database (runs across both platform and tenant schemas)
bun run db:generate         # Generate Prisma clients (required after schema changes)
bun run db:migrate          # Run migrations

# Per-schema database operations
cd packages/prisma-shared-schema-platform
bun run db:generate && bun run db:migrate
bun run db:seed             # Seed platform data
bun run db:seed.permission  # Seed permissions

cd packages/prisma-shared-schema-tenant
bun run db:generate && bun run db:migrate
bun run db:seed             # Seed tenant data
```
```

Replace with:

```
## Agent-specific commands

README.md covers the core `dev` / `build` / `lint` / `format` / `check-types` / `db:generate` / `db:migrate` commands. The items below are less obvious and matter for agents working in the repo:

```bash
# Required before `dev` / `build` if shared packages haven't been built yet
bun run build:package

# Per-schema permission seed (runs only on platform schema)
cd packages/prisma-shared-schema-platform
bun run db:seed.permission

# Mock data variants (salvaged from WARP.md — verify variant availability)
bun run db:mock          # if present
bun run db:mock.tenant   # if present

# Coverage-enabled testing
bun run test:cov
```
```

- [ ] **Step 4: Trim the "Testing" block**

Find the current block:
```
### Testing

```bash
# Per service (e.g., micro-business)
cd apps/micro-business
bun run test                # Run tests
bun run test:watch          # Watch mode
bun run test:e2e            # End-to-end tests
```
```

Replace with:
```
### Testing (per service)

```bash
cd apps/micro-business
bun run test
bun run test:watch
bun run test:e2e
bun run test:cov
```
```

- [ ] **Step 5: Add the "Gotchas" section**

Insert this new section immediately before the final `## Build Dependencies` section (or at the end of the file if Build Dependencies is not last). Use the Edit tool with `old_string` being the first line of whatever currently follows where you want to insert, and `new_string` being the new section followed by that same line.

If the current file ends with `## Build Dependencies` block, insert BEFORE it. Otherwise append at the end.

**New content to insert:**

```
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

- [ ] **Step 6: Verify the resulting `CLAUDE.md`**

Run:
```
grep -c '^## ' CLAUDE.md
```
Expected: count equal to original + 1 (new Gotchas section).

Run:
```
grep -n 'Gotchas\|Agent-specific commands\|Project Overview' CLAUDE.md
```
Expected: three matches in logical order (Project Overview near top, Agent-specific commands after it, Gotchas near the bottom).

Verify the trimmed Project Overview is present (no longer contains "Built with NestJS microservices in a Turborepo monorepo"):
```
grep -q 'See .README.md. for product scope' CLAUDE.md && echo OK || echo MISSING
```
Expected: `OK`.

- [ ] **Step 7: Commit CLAUDE.md changes**

Run:
```
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: trim CLAUDE.md overlap with README; add gotchas section

- Project Overview trimmed to 1 sentence; product scope now owned by README.
- Common Commands trimmed to agent-specific items (build:package prereq,
  per-schema seeds, test:cov, db:mock variants).
- Testing block simplified.
- New "Gotchas" section with 5 entries salvaged from sub-project #1,
  each marked (verify against current code) until sub-project #4
  confirms.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8: Verify**

Run:
```
git log -1 --stat
```
Expected: single file modified (`CLAUDE.md`).

---

## Task 4: Link-check pass

**Files:**
- Verify-only: `README.md`, `CLAUDE.md`.

- [ ] **Step 1: Run lychee offline**

Run:
```
bunx lychee --offline --no-progress README.md CLAUDE.md 2>&1
```
Capture output.

Possible outcomes:
a) Exit 0 → skip to Step 4.
b) Non-zero with broken-link report → continue to Step 2.
c) `bunx lychee` unavailable → fall back to `markdown-link-check`:
```
npm install -g markdown-link-check 2>&1 | tail -5
markdown-link-check -q README.md
markdown-link-check -q CLAUDE.md
```
If both fail, STOP and report BLOCKED.

- [ ] **Step 2: Fix any broken links**

For each broken link:
- If path target doesn't exist → update to a correct existing path, or remove the link if the target was never created.
- **Do not** replace real content patterns that resemble emails/URLs (e.g., `user:pass@host` in code blocks) — those are false positives. If lychee flags them, add `--exclude` for that pattern or inline-mark as excluded. Do NOT edit prose to placate the checker.

- [ ] **Step 3: Re-run lychee**

Run:
```
bunx lychee --offline --no-progress README.md CLAUDE.md
echo "Exit: $?"
```
Expected: `Exit: 0`.

- [ ] **Step 4: Commit fixes (only if any were made)**

```
git add -A
git commit -m "$(cat <<'EOF'
docs: fix broken links in README and CLAUDE.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If no fixes needed, skip this commit.

---

## Task 5: Push and open PR

- [ ] **Step 1: Confirm branch state**

Run:
```
git status --short
git log --oneline docs/cleanup-inventory..HEAD
```
Expected: clean working tree; 3–4 commits since `docs/cleanup-inventory` (spec/plan, README, CLAUDE.md, maybe link-fix).

- [ ] **Step 2: Determine PR base**

Run:
```
gh pr view docs/cleanup-inventory --json state 2>/dev/null || echo "no-pr"
```

Decision rule:
- If PR #8 is `MERGED` → base = `main`.
- If PR #8 is `OPEN` → base = `docs/cleanup-inventory`.
- If unclear → base = `main` and note in PR body that #8 must merge first.

- [ ] **Step 3: Push branch**

```
git push -u origin docs/root-docs-refresh
```

- [ ] **Step 4: Create PR**

Using the base from Step 2 (substitute `<base>`):

```
gh pr create --base <base> --head docs/root-docs-refresh \
  --title "docs: refresh README and CLAUDE.md (sub-project #2)" \
  --body "$(cat <<'EOF'
## Summary

- Full rewrite of `README.md`: product/vision top half + dev setup bottom half. Capability bullets grounded in Bruno collections, route modules, and Prisma models. Removes stale microservice list (micro-authen, micro-tenant-*, etc.).
- Targeted reconciliation of `CLAUDE.md`: trim product-pitch overlap with README, trim duplicated commands, add new **Gotchas** section with 5 entries salvaged from sub-project #1.
- License section omitted per sub-project #2 spec; no `LICENSE` file created.

Based on PR #8 (sub-project #1). Re-target to `main` after #8 merges.

Spec: `docs/superpowers/specs/2026-04-20-root-docs-refresh-design.md`
Plan: `docs/superpowers/plans/2026-04-20-root-docs-refresh.md`

## Test plan

- [ ] `wc -l README.md` — 150–200 lines.
- [ ] Every "Core capabilities" bullet in README links to an artifact that exists (`ls` verifies).
- [ ] Every `docs/` link in README resolves to a file created in PR #8.
- [ ] `bunx lychee --offline README.md CLAUDE.md` — exit 0.
- [ ] `CLAUDE.md` retains: Architecture, Multi-Tenancy, Gateway Routing, Authentication, Code Conventions, Environment Setup, Keycloak Configuration, Bruno API Collections, Build Dependencies.
- [ ] `CLAUDE.md` adds: Gotchas section with 5 entries.

## Notes

Gotchas section entries marked `(verify against current code)` are sourced from salvage notes and not yet re-verified. Sub-project #4 will either promote them to authoritative or remove them based on code inspection.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Verify PR**

```
gh pr view --json url,number,state,baseRefName,headRefName
```
Expected: state `OPEN`, baseRefName matches Step 2 decision, headRefName `docs/root-docs-refresh`.

Return the PR URL to the user.

---

## Self-review checklist (pre-handoff)

- [x] **Spec coverage:**
  - Spec §3 (README outline) → Task 2 Step 6 contains the full outline verbatim.
  - Spec §4 (CLAUDE.md delta) → Task 3 Steps 2–5 cover trim/keep/add.
  - Spec §5 (Process) ordering → Tasks 1–5 follow the same order.
  - Spec §6 done criteria → Task 2 Step 7, Task 3 Step 6, Task 4 Step 3, and the PR test plan cover each criterion.
  - Spec §7 risks → Mitigations baked into task steps (artifact checks in Task 2 Step 7; "verify" markers in Task 3 Step 5; lychee false-positive guidance in Task 4 Step 2; base-branch logic in Task 5 Step 2).

- [x] **Placeholder scan:** No TBD/TODO. Every edit has concrete `old_string`/`new_string`. Every command has expected output.

- [x] **Type/path consistency:**
  - README paths (`docs/architecture-system.md`, etc.) match names created in PR #8's merge/rename commits.
  - CLAUDE.md Gotchas entries match the 5 entries in spec §4.
  - Branch name `docs/root-docs-refresh` used consistently.
  - Worktree path `.../carmen-turborepo-backend-v2-root-docs` used consistently.

- [x] **Task granularity:** Each step is a single action (one read, one edit, one commit, one verification). Task 2 is the biggest (9 steps) because drafting + grounding happens together.

- [x] **Rollback:** Each task produces one commit; `git revert <sha>` undoes any task.
