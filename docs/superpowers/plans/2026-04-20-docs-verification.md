# Docs Verification & Legacy-Notes Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify every `docs/*.md` file against current code, resolve all `_(verify)_` markers in CLAUDE.md + service/package READMEs, promote useful content out of `docs/design-legacy-notes.md`, and delete the working files at the end.

**Architecture:** One branch (`docs/docs-verification`) based on PR #10. Fact-map working file (`docs/archive-verify-fact-map.md`) drives verify-once-propagate. Commits grouped by pass: arch/ops docs → marker sweep → domain grep → design top-notes → legacy promotion → final cleanup. Mixed disposition (fix inline / delete stale / tag `_(stale — needs rewrite)_`).

**Tech Stack:** Markdown, git, `grep`/Grep tool, `bunx lychee` (link check), `gh` (PR).

**Source spec:** `docs/superpowers/specs/2026-04-20-docs-verification-design.md` — every task reads the spec first; it's the authoritative reference for disposition rules and verification strategy.

---

## Pre-flight checklist (before Task 1)

- [ ] Working directory: `/Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2-docs-verify`.
- [ ] Branch: `git rev-parse --abbrev-ref HEAD` → `docs/docs-verification`.
- [ ] Base resolves: `git log -1 --format='%h %s' docs/service-readmes`.
- [ ] `bunx bun --version` works.

---

## Task 1: Commit spec+plan on `docs/docs-verification`

**Files:**
- Commit (already exist): `docs/superpowers/specs/2026-04-20-docs-verification-design.md`, `docs/superpowers/plans/2026-04-20-docs-verification.md`.

- [ ] **Step 1: Verify state**

Run: `git status`
Expected: on `docs/docs-verification`; two files listed as untracked.

- [ ] **Step 2: Stage and commit**

```
git add docs/superpowers/specs/2026-04-20-docs-verification-design.md \
        docs/superpowers/plans/2026-04-20-docs-verification.md
git commit -m "$(cat <<'EOF'
docs: add spec and plan for docs verification (sub-project #4)

Spec: final verification pass — resolves every _(verify)_ marker,
sweeps all docs/*.md for drift, promotes legacy notes content,
deletes working files at end.

Based on PR #10 (docs/service-readmes).

Plan: bite-sized passes + fact-map-driven propagation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify**

Run: `git log -1 --stat`
Expected: commit adds exactly the two files.

---

## Task 2: Build the fact map

**Files:**
- Create: `docs/archive-verify-fact-map.md`

This file is the working contract for the `_(verify)_` marker sweep. It's deleted in the final commit.

- [ ] **Step 1: Enumerate every `_(verify)_` marker in the repo**

Use the Grep tool:
- pattern: `_\(verify\)_|_\(verify against current code\)_`
- output_mode: `content`
- -n: true
- path: `/Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2-docs-verify`
- glob: `**/*.md`
- exclude paths under `docs/superpowers/`

Record every hit with `<file>:<line>`.

- [ ] **Step 2: Group hits into unique "facts"**

Multiple hits may refer to the same underlying claim (e.g., "tenant recipe migration gap" in CLAUDE.md and `packages/prisma-shared-schema-tenant/README.md`). Cluster them.

Expected canonical facts (spec §5 Pass 2) plus any new ones surfaced in Step 1:

1. Service consolidation history (micro-authen / micro-tenant-* absent).
2. TCP message pattern drift warning.
3. Prisma `findMany` spread+select conflict.
4. Tenant recipe migration gap.
5. Credentials in pre-PR-#8 git history.
6. Both Prisma clients consumed in micro-business.
7. Global audit interceptor registration in services.
8. micro-file presigned URL generation.
9. micro-cluster gateway port dependency.
10. micro-notification Socket.io rooms scoped per user/BU.
11. micro-notification Redis adapter need.
12. log-events-library concurrent-writes safety.
13. log-events-library exported symbols correctness.

If additional markers exist, add rows for them.

- [ ] **Step 3: Write the fact map file**

Use Write tool. Content template:

```markdown
# Docs Verification Fact Map (working file — deleted at end)

Working contract for sub-project #4. One row per unique fact claimed
by a `_(verify)_` marker. Nothing is resolved until its row is filled.

## Fact table

| # | Fact (short name) | Locations (file:line) | Check procedure | Result | Action propagated |
|---|---|---|---|---|---|
| 1 | Service consolidation history | (fill from Step 1) | `ls apps/`; confirm no `micro-authen` or `micro-tenant-*`. | (fill) | (fill) |
| 2 | TCP message pattern drift | (fill) | Enumerate @MessagePattern in micro-business; spot-check 3–5 matches vs gateway @Client.send. | (fill) | (fill) |
| 3 | Prisma findMany spread+select conflict | (fill) | Check Prisma version in root package.json; grep findMany usage with spread in micro-business. | (fill) | (fill) |
| 4 | Tenant recipe migration gap | (fill) | `ls packages/prisma-shared-schema-tenant/prisma/migrations/`; look for recipe-table migrations dated post-service-consolidation. | (fill) | (fill) |
| 5 | Credentials in pre-PR-#8 history | (fill) | `git log --all -S '8wzw8O77O0VAGDnt' | head`. Verified true if token appears. | (fill) | (fill) |
| 6 | Both Prisma clients in micro-business | (fill) | `grep -r '@repo/prisma-shared-schema' apps/micro-business/src/`. | (fill) | (fill) |
| 7 | Global audit interceptor | (fill) | `grep -E 'AuditContextInterceptor|LogEventsInterceptor|useGlobalInterceptors' apps/*/src/main.ts`. | (fill) | (fill) |
| 8 | micro-file presigned URL | (fill) | `grep -r 'presigned\|signUrl\|getObjectUrl\|signedUrl' apps/micro-file/src/`. | (fill) | (fill) |
| 9 | micro-cluster gateway port dependency | (fill) | `grep CLUSTER_SERVICE apps/backend-gateway/.env.example apps/backend-gateway/src/`; confirm port pair. | (fill) | (fill) |
| 10 | Socket.io room naming | (fill) | `grep -rE 'join\(|\.to\(|room' apps/micro-notification/src/`. | (fill) | (fill) |
| 11 | Socket.io Redis adapter | (fill) | `grep '@socket.io/redis-adapter' apps/micro-notification/package.json apps/micro-notification/src/`. | (fill) | (fill) |
| 12 | log-events-library concurrent writes | (fill) | Read the writer implementation for locking / queue. | (fill) | (fill) |
| 13 | log-events-library exports | (fill) | Read `packages/log-events-library/src/index.ts`; compare to README's listed exports. | (fill) | (fill) |
| 14+ | (any additional facts surfaced in Step 1) | (fill) | (fill) | (fill) | (fill) |

## Disposition legend

- **Verified accurate** → remove `_(verify)_` marker in every listed location; keep text.
- **Verified wrong** → delete the bullet in every listed location, or replace with accurate version.
- **Ambiguous** → replace `_(verify)_` with `_(stale — needs rewrite)_` in every listed location. Keep content for future review.
```

- [ ] **Step 4: Commit the fact map**

```
git add docs/archive-verify-fact-map.md
git commit -m "$(cat <<'EOF'
docs: add working fact map for verification pass

Temporary working file — deleted in final commit.
Drives _(verify)_ marker resolution per spec §4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify**

Run: `git log -1 --stat`
Expected: single file added.

---

## Task 3: Pass 1 — Verify `docs/architecture-system.md`

**Files:**
- Modify: `docs/architecture-system.md`

- [ ] **Step 1: Grounding reads**

Run these in parallel-friendly order:

```
grep -E 'listen\(|:4000|:4001|HTTPS' apps/backend-gateway/src/main.ts
grep -E 'listen\(|:50|:60|createMicroservice' apps/micro-business/src/main.ts apps/micro-cluster/src/main.ts apps/micro-file/src/main.ts apps/micro-keycloak-api/src/main.ts apps/micro-notification/src/main.ts
ls apps/
ls packages/
find docker-compose*.yml -maxdepth 1 -type f 2>/dev/null
find k8s/ -type f -name '*.yaml' -o -name '*.yml' 2>/dev/null | head -10
```

Record: actual ports, services present, K8s file presence.

- [ ] **Step 2: Open `docs/architecture-system.md` and scan for drift candidates**

Use Read tool. Search for:
- Port numbers — cross-check every `:NNNN` mention.
- Service names — every `micro-*` mention must exist in `apps/`.
- Prisma schema references — both packages must exist.
- Diagram text (ASCII or mermaid) — service boxes should match reality.

Look for sections referencing `micro-authen`, `micro-tenant-*`, `micro-cronjob`, `micro-license` — these are the deleted-service names; any section heavily relying on them is a delete candidate.

- [ ] **Step 3: Apply disposition**

Per spec §3:
- **Trivial fix** (port mismatch, renamed service): Edit tool, small edits.
- **Stale section** (describes removed architecture): delete.
- **Ambiguous**: tag with `_(stale — needs rewrite)_` at the start of the section.
- **Verified**: no edit.

Multiple Edit calls as needed. Keep edits path-specific — don't rewrite prose for style.

- [ ] **Step 4: Commit**

```
git add docs/architecture-system.md
git commit -m "$(cat <<'EOF'
docs: verify docs/architecture-system.md against current code

Summarize changes briefly: port fixes, removed sections for deleted
services, sections tagged _(stale — needs rewrite)_ for ambiguous
content.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Replace the summary body with a specific list of what was fixed / deleted / tagged before committing. If nothing changed (doc was already accurate), still commit with body `"No changes — verified accurate against gateway + microservice main.ts ports and service list."`

- [ ] **Step 5: Verify**

Run: `git log -1 --stat`

---

## Task 4: Pass 1 — Verify `docs/deploy-docker-run.md`

**Files:**
- Modify: `docs/deploy-docker-run.md`

- [ ] **Step 1: Grounding**

```
cat docker-compose.yml | head -80
cat docker-compose.dev.yml | head -80
ls scripts/ | head -20
```

Confirm service names and Docker commands still match.

- [ ] **Step 2: Read the doc; apply disposition per spec §3**

Use Read tool on `docs/deploy-docker-run.md`. Check every `docker compose`, `docker-compose`, service name, and env var reference. Fix / delete / tag per rules.

- [ ] **Step 3: Commit**

```
git add docs/deploy-docker-run.md
git commit -m "docs: verify docs/deploy-docker-run.md — <one-line summary>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Substitute `<one-line summary>` with actual finding (e.g., "no changes needed" / "fixed 2 service names" / "tagged 1 stale section").

- [ ] **Step 4: Verify**

Run: `git log -1 --stat`

---

## Task 5: Pass 1 — Verify `docs/deploy-platform-schema.md`

**Files:**
- Modify: `docs/deploy-platform-schema.md`

- [ ] **Step 1: Grounding**

```
cat packages/prisma-shared-schema-platform/package.json
ls packages/prisma-shared-schema-platform/prisma/
grep -oE 'bun run [a-zA-Z:._-]+' docs/deploy-platform-schema.md | sort -u
```

Verify every `bun run` command listed exists in the package's scripts.

- [ ] **Step 2: Apply disposition**

Read doc. Fix command names that don't exist; delete sections describing removed deploy steps; tag ambiguous content.

- [ ] **Step 3: Commit**

```
git add docs/deploy-platform-schema.md
git commit -m "docs: verify docs/deploy-platform-schema.md — <one-line summary>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 6: Pass 1 — Verify `docs/deploy-tenant-schema.md`

**Files:**
- Modify: `docs/deploy-tenant-schema.md`

- [ ] **Step 1: Grounding**

```
cat packages/prisma-shared-schema-tenant/package.json
ls packages/prisma-shared-schema-tenant/prisma/
grep -oE 'bun run [a-zA-Z:._-]+' docs/deploy-tenant-schema.md | sort -u
```

This file was previously edited in PR #8 Task 11 (credential redaction). Don't re-redact — the `${DB_PASSWORD}` placeholders should remain.

- [ ] **Step 2: Apply disposition**

Read doc. Fix command names; delete deprecated deploy paths; tag ambiguous content.

- [ ] **Step 3: Commit**

```
git add docs/deploy-tenant-schema.md
git commit -m "docs: verify docs/deploy-tenant-schema.md — <one-line summary>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 7: Pass 1 — Verify `docs/ops-backup.md`

**Files:**
- Modify: `docs/ops-backup.md`

- [ ] **Step 1: Grounding**

```
ls scripts/backup/
grep -E 'scripts/backup|backup_postgres|auto_backup|restore_postgres' docs/ops-backup.md
```

Paths were moved from `docs/tools/` → `scripts/backup/` in PR #8. Verify all path references are updated.

- [ ] **Step 2: Apply disposition**

Read; fix any stale `docs/tools/` references; fix renamed scripts; tag ambiguous ops content.

- [ ] **Step 3: Commit**

```
git add docs/ops-backup.md
git commit -m "docs: verify docs/ops-backup.md — <one-line summary>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 8: Pass 1 — Verify `docs/ops-fix-ssl-keycloak.md`

**Files:**
- Modify: `docs/ops-fix-ssl-keycloak.md`

- [ ] **Step 1: Grounding**

```
grep -oE '/etc/[a-zA-Z0-9/._-]+|openssl [a-z-]+|keytool' docs/ops-fix-ssl-keycloak.md | sort -u
cat apps/micro-keycloak-api/.env.example 2>/dev/null | head -20
```

SSL fix procedures tend to be environment-specific; verify that referenced cert paths and Keycloak config patterns look current.

- [ ] **Step 2: Apply disposition**

Read; fix renamed env vars or cert paths; delete steps that reference obsolete Keycloak versions; tag ambiguous procedures.

- [ ] **Step 3: Commit**

```
git add docs/ops-fix-ssl-keycloak.md
git commit -m "docs: verify docs/ops-fix-ssl-keycloak.md — <one-line summary>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 9: Pass 1 — Verify `docs/ops-prisma-upgrade-script.md`

**Files:**
- Modify: `docs/ops-prisma-upgrade-script.md`

- [ ] **Step 1: Grounding**

```
grep -E '"prisma"|"@prisma' package.json packages/prisma-shared-schema-*/package.json | sort -u
grep -oE 'bun run [a-zA-Z:._-]+|prisma [a-z-]+' docs/ops-prisma-upgrade-script.md | sort -u
```

Confirm current Prisma version and that referenced commands exist.

- [ ] **Step 2: Apply disposition**

Read; fix command names; update version numbers if stale; tag ambiguous steps.

- [ ] **Step 3: Commit**

```
git add docs/ops-prisma-upgrade-script.md
git commit -m "docs: verify docs/ops-prisma-upgrade-script.md — <one-line summary>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 10: Pass 1 — Verify `docs/ops-start-dev-base.md`

**Files:**
- Modify: `docs/ops-start-dev-base.md`

- [ ] **Step 1: Grounding**

```
grep '"dev:base"\|"dev:business"\|"dev"' package.json
grep -oE 'bun run [a-zA-Z:._-]+' docs/ops-start-dev-base.md | sort -u
```

Confirm `dev:base` and related scripts exist.

- [ ] **Step 2: Apply disposition**

Read; fix script names; verify service subset described matches `dev:base` turbo filter; tag ambiguous content.

- [ ] **Step 3: Commit**

```
git add docs/ops-start-dev-base.md
git commit -m "docs: verify docs/ops-start-dev-base.md — <one-line summary>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 11: Pass 2 — `_(verify)_` marker sweep

**Files:**
- Modify (potentially): `CLAUDE.md`, `packages/log-events-library/README.md`, `packages/prisma-shared-schema-tenant/README.md`, `apps/backend-gateway/README.md`, `apps/micro-business/README.md`, `apps/micro-cluster/README.md`, `apps/micro-file/README.md`, `apps/micro-keycloak-api/README.md`, `apps/micro-notification/README.md`.
- Modify: `docs/archive-verify-fact-map.md` (fill in Result + Action columns).

- [ ] **Step 1: Run each fact's check procedure**

For each row in `docs/archive-verify-fact-map.md`, execute the check command. Record the result and decide:
- **Verified accurate** → marker removed.
- **Verified wrong** → bullet deleted.
- **Ambiguous** → swap `_(verify)_` → `_(stale — needs rewrite)_`.

Write results into the fact map columns using Edit tool. Keep entries terse — fact-map is internal, not published.

Example checks (run these; adapt if fact map has more):

```
# Fact 1: Service consolidation
ls apps/ | grep -E 'micro-authen|micro-tenant-|micro-cronjob|micro-license'
# Empty output = fact verified true (services absent)

# Fact 2: TCP message pattern drift — sample 3 patterns
grep -rE '@MessagePattern\(' apps/micro-business/src/ | head -10
grep -rE '@Client\.send|\.send\(\{ cmd:' apps/backend-gateway/src/ | head -10

# Fact 3: Prisma findMany spread+select
grep -rE 'findMany\(\{ \.\.\.' apps/micro-business/src/ | head -5
grep '"prisma"' package.json packages/prisma-shared-schema-*/package.json

# Fact 4: Recipe migrations
ls packages/prisma-shared-schema-tenant/prisma/migrations/ | grep -i recipe | head -10

# Fact 5: Credentials in history
git log --all -S '8wzw8O77O0VAGDnt' | head -5

# Fact 6: Both Prisma clients in micro-business
grep -rE '@repo/prisma-shared-schema' apps/micro-business/src/ | awk '{print $0}' | sort -u | head -10

# Fact 7: Global audit interceptor
grep -rE 'AuditContextInterceptor|LogEventsInterceptor|useGlobalInterceptors' apps/*/src/main.ts

# Fact 8: micro-file presigned URL
grep -rE 'presigned|signUrl|signedUrl' apps/micro-file/src/ | head -5

# Fact 9: micro-cluster gateway port
grep -rE 'CLUSTER_SERVICE' apps/backend-gateway/.env.example apps/backend-gateway/src/ 2>/dev/null | head -5

# Fact 10: Socket.io rooms
grep -rE '\.join\(|\.to\(|io\.to' apps/micro-notification/src/ | head -5

# Fact 11: Redis adapter
grep 'redis-adapter' apps/micro-notification/package.json apps/micro-notification/src/**/*.ts 2>/dev/null | head -3

# Fact 12: log-events concurrent writes
find packages/log-events-library/src -name '*writer*' -o -name '*Writer*' | head -3
# Then Read tool on the result; look for lock/queue/mutex/promise-queue

# Fact 13: log-events exports
head -40 packages/log-events-library/src/index.ts
```

- [ ] **Step 2: Apply propagated actions to every location**

For each fact with `Verified accurate`:
- Use Edit tool to remove `_(verify)_` OR `_(verify against current code)_` from every listed location. Edit: `old_string` = the bullet with the marker; `new_string` = the bullet without the marker.

For each fact with `Verified wrong`:
- Use Edit tool to delete the bullet in every location. Edit: `old_string` = the bullet (and trailing newline), `new_string` = empty.

For each fact with `Ambiguous`:
- Use Edit tool to replace `_(verify)_` → `_(stale — needs rewrite)_` in every location.

Keep a running tally of which files were modified.

- [ ] **Step 3: Single commit grouping all marker changes**

```
git add -A
git commit -m "$(cat <<'EOF'
docs: resolve _(verify)_ markers per verification fact map

Each unique fact verified once; result propagated to all locations
carrying the same marker. See the final fact-map state (deleted in
final cleanup commit) for per-fact evidence.

Summary of actions taken (fill in with actual counts):
- Verified accurate (marker removed): N facts
- Verified wrong (bullet deleted): N facts
- Ambiguous (tagged _(stale — needs rewrite)_): N facts
- Files touched: <list>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Replace placeholders (`N`, `<list>`) with real numbers/files before committing.

- [ ] **Step 4: Verify**

Run:
```
git log -1 --stat
grep -rE '_\(verify\)_|_\(verify against current code\)_' CLAUDE.md apps/ packages/ docs/ --include='*.md' | grep -v 'docs/superpowers' | grep -v 'docs/archive-verify-fact-map' | head
```
Expected: `git log -1 --stat` shows the multi-file commit; the grep returns zero hits (all remaining markers live in the fact-map working file and docs/superpowers).

---

## Task 12: Pass 3 — Domain doc surface check

**Files:**
- Modify: `docs/domain-inventory-calculations.md`

- [ ] **Step 1: Extract references from the doc**

Run:
```
grep -oE 'tb_[a-z_]+' docs/domain-inventory-calculations.md | sort -u > /tmp/doc-models.txt
grep -oE '^model [a-zA-Z_]+' packages/prisma-shared-schema-tenant/prisma/schema.prisma | awk '{print $2}' | sort -u > /tmp/schema-models.txt

# Models mentioned in doc but not in schema (stale references)
comm -23 /tmp/doc-models.txt /tmp/schema-models.txt

# Extract function names from the doc
grep -oE 'CREATE OR REPLACE FUNCTION [a-z_]+' docs/domain-inventory-calculations.md | awk '{print $5}' | sort -u > /tmp/doc-functions.txt

# Check each against actual migrations
while read f; do
  hit=$(grep -rlE "CREATE OR REPLACE FUNCTION $f" packages/prisma-shared-schema-tenant/prisma/migrations/ 2>/dev/null | head -1)
  if [ -z "$hit" ]; then echo "MISSING: $f"; fi
done < /tmp/doc-functions.txt
```

Output: lists of stale model names and missing functions.

- [ ] **Step 2: Apply disposition per finding**

For each stale `tb_*` reference:
- Single-line mention → Edit to remove the line or rename to correct model.
- Section header → Use Edit to prepend `_(stale — needs rewrite)_\n\n` to the section heading.

For each missing function:
- Single-line mention → delete the line.
- Multi-line function definition block → tag the surrounding section `_(stale — needs rewrite)_`.

Do NOT attempt field-level checks. Keep edits coarse.

- [ ] **Step 3: Commit**

```
git add docs/domain-inventory-calculations.md
git commit -m "$(cat <<'EOF'
docs: surface-level verify docs/domain-inventory-calculations.md

Grep-based check of model names (tb_*) and SQL function names
against packages/prisma-shared-schema-tenant.

Summary (fill in):
- Models stale: N references fixed / M sections tagged
- Functions missing: N removed / M sections tagged

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 13: Pass 4 — Design docs top-notes

**Files:**
- Modify: `docs/design-micro-report-go.md`, `docs/design-micro-report-ts.md`

- [ ] **Step 1: Check for micro-report implementation**

```
ls apps/ | grep -i report
```

- Empty output → proposed but not built.
- Output includes `micro-report` → implementation exists; potentially drift.

- [ ] **Step 2: Apply disposition**

**If no implementation:**
Use Edit tool on both files. Add at the top (immediately after the H1 line):

```markdown
> **Status:** proposed — not yet implemented.
>
> This design document captures intent; no `apps/micro-report/` service exists in the repo as of 2026-04-20.
```

**If implementation exists:**
Spot-check 3–5 key design decisions against the actual service. If there's clear drift, add:

```markdown
> **Note:** design diverged from implementation — see `apps/micro-report/` for current state.
```

Don't rewrite the design content in either case.

- [ ] **Step 3: Commit**

```
git add docs/design-micro-report-go.md docs/design-micro-report-ts.md
git commit -m "$(cat <<'EOF'
docs: add status notes to design-micro-report-*.md

<Indicate whether proposed-not-built or implementation-exists-with-drift.>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify**

`git log -1 --stat`

---

## Task 14: Pass 5 — Legacy notes promotion

**Files:**
- Read: `docs/design-legacy-notes.md` (sections by source file).
- Modify (per promotion): one or more `docs/architecture-system.md`, `docs/domain-inventory-calculations.md`, `docs/deploy-*.md`, `docs/ops-*.md`, `CLAUDE.md` Gotchas.
- Delete: `docs/design-legacy-notes.md`.

Legacy notes has 6 source sections: `PROJECT_DOCUMENTATION.md`, `PRD.md`, `WARP.md`, `cursorrule.cursor`, `PROJECT_ISSUES_REPORT.txt`, `api-500-errors-investigation.txt`.

- [ ] **Step 1: Read the legacy notes in full**

Use Read tool on `docs/design-legacy-notes.md`. Identify distinct subsections worth promoting.

Verification bar (spec §5 Pass 5 Step 5): promoted content must NOT carry `_(verify)_` markers. Either quick-verify against current code, or skip.

- [ ] **Step 2: Promote each eligible subsection**

For each eligible promotion:

1. Identify target doc (architecture / domain / deploy / ops / CLAUDE.md).
2. Find an appropriate target heading; append content under `## <topic> (from legacy notes — verified 2026-04-20)` or as a sub-section of an existing heading.
3. Quick-verify the content against current code (grep for mentioned identifiers; if they don't exist, skip the promotion).
4. Use Edit tool to append the content to the target.

Expected promotions (examples; actual list depends on what's in the legacy notes):

- ERDs and table definitions from `PROJECT_DOCUMENTATION.md` → append to `docs/architecture-system.md` under a new "Data model snapshot" heading, after verifying the model names still exist.
- Deployment layout / port map → append to `docs/architecture-system.md` under "Deployment" or split into `docs/deploy-docker-run.md`.
- Env var catalog for MinIO/cronjob/etc. → append to `docs/ops-start-dev-base.md` or integrate into an `.env.example` pointer.
- Critical open issues from `PROJECT_ISSUES_REPORT.txt` → append as `CLAUDE.md` Gotchas (new bullet without `_(verify)_`), ONLY if still relevant after a 30-second code check.
- Systemic bug patterns from `api-500-errors-investigation.txt` → already captured in `CLAUDE.md` Gotchas in #2; cross-check, promote remaining if any.

- [ ] **Step 3: Commit each promotion separately**

After each target doc edit, commit. Example:

```
git add docs/architecture-system.md
git commit -m "$(cat <<'EOF'
docs: promote data-model snapshot from legacy notes to architecture

Moves ERD tables and model names from docs/design-legacy-notes.md
(PROJECT_DOCUMENTATION.md section) into architecture-system.md under
a new "Data model snapshot (verified 2026-04-20)" heading.

Content verified against packages/prisma-shared-schema-* at promotion time.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

One commit per target doc (or per topic within a target doc if the promotion is large). Don't batch.

- [ ] **Step 4: Delete the legacy notes file**

After all promotions complete:

```
git rm docs/design-legacy-notes.md
git commit -m "$(cat <<'EOF'
docs: delete docs/design-legacy-notes.md

All eligible content promoted to permanent homes in earlier commits.
Remaining content (obsolete / unverifiable) not retained — git history
preserves it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Verify**

Run:
```
test -e docs/design-legacy-notes.md && echo STILL_EXISTS || echo DELETED
git log --oneline docs/service-readmes..HEAD | head -20
```
Expected: `DELETED`; commit log shows promotion commits followed by the deletion commit.

---

## Task 15: Pass 6 — Final cleanup (delete fact map + link-check)

**Files:**
- Delete: `docs/archive-verify-fact-map.md`.
- Verify-only: all `docs/*.md`, `README.md`, `CLAUDE.md`, `apps/*/README.md`, `packages/*/README.md`.

- [ ] **Step 1: Delete fact map**

```
git rm docs/archive-verify-fact-map.md
git commit -m "$(cat <<'EOF'
docs: delete verify fact map working file

Working contract for sub-project #4 no longer needed. Git history
preserves the resolution evidence.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Run link-check**

```
bunx lychee --offline --no-progress \
  'docs/**/*.md' 'apps/*/README.md' 'packages/*/README.md' \
  README.md CLAUDE.md 2>&1
echo "Exit: $?"
```

Fallback to `markdown-link-check` per file if lychee unavailable.

- [ ] **Step 3: Fix any real broken links**

Same rules as sub-project #3:
- Fix actual path breaks.
- DO NOT edit prose to suppress false positives (credential-in-code-block, email-like patterns, etc.).

- [ ] **Step 4: Commit link fixes if any**

```
git add -A
git commit -m "$(cat <<'EOF'
docs: fix broken links found in final verification pass

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Skip if no fixes needed.

- [ ] **Step 5: Final done-criteria check**

Run:
```
# No _(verify)_ markers outside superpowers dir
grep -rE '_\(verify\)_|_\(verify against current code\)_' CLAUDE.md apps/ packages/ docs/ --include='*.md' | grep -v 'docs/superpowers' | head

# Legacy notes gone
test -e docs/design-legacy-notes.md && echo STILL_EXISTS || echo DELETED

# Fact map gone
test -e docs/archive-verify-fact-map.md && echo STILL_EXISTS || echo DELETED

# Clean working tree
git status --short
```

Expected:
- First grep: empty.
- Legacy notes: `DELETED`.
- Fact map: `DELETED`.
- Working tree: empty.

If any fails, STOP and report.

---

## Task 16: Push and open PR

- [ ] **Step 1: Review branch state**

```
git status --short
git log --oneline docs/service-readmes..HEAD | head -30
```
Expected: clean tree; ~15–20 commits (spec/plan, fact map, 8 Pass-1 commits, marker sweep, domain surface, design notes, N promotions, legacy deletion, fact-map deletion, optional link-fix).

- [ ] **Step 2: Determine PR base**

```
gh pr list --head docs/cleanup-inventory --json number,state --limit 1
gh pr list --head docs/root-docs-refresh --json number,state --limit 1
gh pr list --head docs/service-readmes --json number,state --limit 1
```

Decision:
- All three MERGED → base = `main`.
- #8 merged, others open → base = `docs/service-readmes`.
- All open → base = `docs/service-readmes` (chain to latest).

- [ ] **Step 3: Push**

```
git push -u origin docs/docs-verification
```

- [ ] **Step 4: Create PR (substitute `<base>` from Step 2)**

```
gh pr create --base <base> --head docs/docs-verification \
  --title "docs: verify docs/ and resolve _(verify)_ markers (sub-project #4, final)" \
  --body "$(cat <<'EOF'
## Summary

Final sub-project in the "update all docs" effort. Four things happen here:

1. **Verify `docs/*.md`** — opens every file in `docs/`, fixes trivial inaccuracies inline, deletes stale sections, tags ambiguous content with `_(stale — needs rewrite)_`. Architecture, deploy, ops, and domain docs.
2. **Resolve `_(verify)_` markers** — enumerates every marker across `CLAUDE.md` + service/package READMEs, verifies once per unique fact, propagates result to every location. Zero `_(verify)_` markers remain after this PR.
3. **Promote legacy notes** — extracts still-accurate content from `docs/design-legacy-notes.md` into appropriate `docs/` homes; deletes the legacy-notes file.
4. **Deletes working files** — `docs/archive-verify-fact-map.md` (verification working contract) is removed in the final commit.

Surface-level grep-based check for the 6458-line `docs/domain-inventory-calculations.md` (per spec §5 Pass 3). Full sweep explicitly scoped to avoid line-by-line field verification.

Based on PR #10 (sub-project #3). Re-target to `main` when #8, #9, #10 merge.

Spec: `docs/superpowers/specs/2026-04-20-docs-verification-design.md`
Plan: `docs/superpowers/plans/2026-04-20-docs-verification.md`

## Test plan

- [ ] `grep -rE '_\(verify\)_|_\(verify against current code\)_' CLAUDE.md apps/ packages/ docs/ --include='*.md'` (excluding `docs/superpowers/`) → zero hits.
- [ ] `test -e docs/design-legacy-notes.md` → file does not exist.
- [ ] `test -e docs/archive-verify-fact-map.md` → file does not exist.
- [ ] Every `docs/*.md` has a dedicated commit on this branch OR explicit "verified unchanged" note in a commit message.
- [ ] Markdown link check passes on `docs/**/*.md`, root `README.md`, `CLAUDE.md`, all `apps/*/README.md`, all `packages/*/README.md`.

## Post-PR state

- All docs verified at the level chosen in the spec.
- `_(stale — needs rewrite)_` markers may remain in some docs — those are the escape-hatch for content we couldn't verify in reasonable time. Resolving them is future work, not blocking.
- Credential leak in pre-#8 git history (Supabase-style token, `123456` dev password) is unchanged — rotate + scrub history separately.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Verify PR**

```
gh pr view --json url,number,state,baseRefName,headRefName
```

Return the URL.

---

## Self-review checklist (pre-handoff)

- [x] **Spec coverage:**
  - Spec §2 scope (11 docs + marker sweep + legacy promotion) → Tasks 3–14.
  - Spec §3 disposition rules → baked into Step 3 of each Pass-1 task + the marker sweep in Task 11.
  - Spec §4 verify-once-propagate → Tasks 2 (fact map) + 11 (sweep).
  - Spec §5 pass-by-pass → Tasks 3–14 map one-to-one onto the 6 passes.
  - Spec §6 process → Tasks 1 → 16 follow the same order.
  - Spec §7 done criteria → Task 15 Step 5 + Task 16 Step 4 test plan cover each.
  - Spec §8 risks → Mitigations applied (commit-per-pass, tag-don't-delete for ambiguous, etc.).

- [x] **Placeholder scan:** No TBD/TODO. Each task's commit message has a `<fill in>` only where the implementer must inject specific counts/findings (explicitly flagged in-task) — these are instructions, not placeholders for the plan itself.

- [x] **Type/path consistency:**
  - Branch name `docs/docs-verification` used throughout.
  - Worktree path `.../carmen-turborepo-backend-v2-docs-verify` consistent.
  - Fact-map filename `docs/archive-verify-fact-map.md` consistent across Tasks 2, 11, 15.
  - `_(stale — needs rewrite)_` marker text consistent across tasks.

- [x] **Task granularity:** Each Pass-1 task (3–10) is 4 steps. Pass 2 (Task 11) is larger — necessarily so, since verify-once-propagate is the whole point. Pass 5 (Task 14) is variable size depending on how many promotions exist.

- [x] **Rollback:** One commit per pass (or per promotion). Revert any individual commit to undo that specific change.
