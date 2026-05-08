# Docs Verification & Legacy-Notes Promotion — Design Spec

**Date:** 2026-04-20
**Status:** Draft (awaiting user review)
**Sub-project:** #4 of 4 (final) in the "update all docs" effort
**Depends on:** PR #8 (flat-prefix `docs/`), PR #9 (CLAUDE.md Gotchas with `_(verify)_` markers), PR #10 (service READMEs with `_(verify)_` markers). This spec's branch is based on `docs/service-readmes` (PR #10). Rebases onto `main` after all three merge.
**Follow-up:** None planned — this closes the "update all docs" effort. Future work on `_(stale — needs rewrite)_` items is a separate concern.

---

## 1. Purpose

Verify every `docs/*.md` file and every `_(verify)_` marker introduced in earlier sub-projects against current code. Produce a final docs state where:

- No `_(verify)_` markers remain. Each is either promoted (marker removed) or removed entirely (bullet/section deleted) based on verification.
- Every `docs/*.md` file has been opened and assessed, with trivial inaccuracies fixed inline, stale sections deleted, and ambiguous content tagged `_(stale — needs rewrite)_`.
- `docs/design-legacy-notes.md` is gone; any still-accurate content has been promoted into an appropriate target doc.
- The repo's documentation set reflects current code to a well-defined bar.

## 2. Scope

### In scope — file list

**Docs to verify/fix:**
- `docs/architecture-system.md` (~1400 lines, merged from 4 sources in #1)
- `docs/deploy-docker-run.md`
- `docs/deploy-platform-schema.md`
- `docs/deploy-tenant-schema.md`
- `docs/ops-backup.md`
- `docs/ops-fix-ssl-keycloak.md`
- `docs/ops-prisma-upgrade-script.md`
- `docs/ops-start-dev-base.md`
- `docs/domain-inventory-calculations.md` (~6458 lines — surface-level only)
- `docs/design-micro-report-go.md`
- `docs/design-micro-report-ts.md`

**Docs to promote-from-then-delete:**
- `docs/design-legacy-notes.md` (~671 lines)

**`_(verify)_` markers to resolve:**
- `CLAUDE.md` Gotchas section (5 bullets).
- Service / package READMEs: `apps/backend-gateway`, `apps/micro-business`, `apps/micro-cluster`, `apps/micro-file`, `apps/micro-keycloak-api`, `apps/micro-notification`, `packages/log-events-library`, `packages/prisma-shared-schema-tenant`.

### Out of scope

- Code changes (beyond fixing a doc's path/name reference when the doc itself is wrong — the fix goes to the doc, not the code).
- Reorganizing `docs/` structure.
- Rewriting docs from scratch.
- Resolving `_(stale — needs rewrite)_` markers introduced by this sub-project. Those are a future effort.
- Field-level verification of `docs/domain-inventory-calculations.md` (per user choice — surface-level only).
- Security history cleanup (credential leak from #8).

### Non-goals

- Byte-for-byte identity between every doc sentence and current code.
- Merging the two `design-micro-report-*` docs.

## 3. Disposition Rules

| Finding | Action | Marker |
|---|---|---|
| Trivial inaccuracy (wrong port, renamed class, minor path) | Fix inline | none |
| Stale section referencing removed code/features | Delete the section | none |
| Ambiguous — claim may be true but can't verify in reasonable time | Keep content, add `_(stale — needs rewrite)_` at section start | `_(stale — needs rewrite)_` |
| Verified accurate | Remove any existing `_(verify)_` marker | none |
| Verified wrong | Delete or fix per trivial/stale rules | none |

**Marker transitions introduced by this sub-project:**
- All `_(verify)_` markers → resolved (removed or replaced).
- New `_(stale — needs rewrite)_` markers may be introduced when verification is inconclusive.

**Commit-level expectation:** every commit message names what was verified, what was fixed, what was deleted, and what was tagged.

## 4. Verification Strategy — "verify once, propagate"

When the same underlying fact appears in multiple places (CLAUDE.md Gotcha + a service README note, for example), verify once and apply the result to every location that mentions it. Tracking uses a temporary working file:

### Fact map (working file)

`docs/archive-verify-fact-map.md` — temporary working contract for this sub-project. Deleted in the final commit. Columns:

```
| # | Fact | Locations | Check | Result | Action propagated |
```

Every unique fact gets one row before verification begins. No `_(verify)_` marker is touched until its fact has a row.

## 5. Pass-by-pass approach

### Pass 1 — Architecture + ops/deploy docs (grounded)

Target files (10):
- `docs/architecture-system.md`
- `docs/deploy-*.md` (3 files)
- `docs/ops-*.md` (4 files)

Grounding sources:
- Gateway: `apps/backend-gateway/src/main.ts` (ports).
- Microservices: each service's `main.ts`.
- `docker-compose.yml`, `docker-compose.dev.yml` for service topology.
- `k8s/` directory for K8s-specific claims.
- `package.json` scripts (root + per-package).
- `scripts/` directory.
- `.env.example` files.

Check, per file:
- Every port number → match `main.ts`.
- Every service name → exists in `apps/`.
- Every Prisma schema reference → `packages/prisma-shared-schema-*` exists.
- Every command → in some `package.json`.
- Every path → resolves.

Disposition per §3.

### Pass 2 — `_(verify)_` marker sweep

Build the fact map. Canonical fact list (may expand during marker enumeration):

1. **Service consolidation history.** Check: `ls apps/` shows no `micro-authen`/`micro-tenant-*`. Verified true if absent.
2. **TCP message pattern drift warning.** Check: enumerate `@MessagePattern` names in `micro-business` vs `@Client.send` patterns in `backend-gateway`; spot-check 3–5 pairs. If all match, demote to "historical caution." If any mismatch, promote as active warning.
3. **Prisma `findMany` spread+select conflict.** Check: grep for `findMany` calls with spread; find one example. Check Prisma docs / Prisma version in `package.json` to see if the behavior has changed.
4. **Tenant recipe migration gap.** Check: `ls packages/prisma-shared-schema-tenant/prisma/migrations/` — if recent migrations (post-consolidation date) touch recipe tables, gap may be closed. Ambiguous → tag rather than delete.
5. **Credentials in pre-PR-#8 history.** Check: `git log --all -S '8wzw8O77O0VAGDnt' | head`. Verified true if token appears pre-#8.
6. **Both Prisma clients in micro-business.** Check: `grep -r '@repo/prisma-shared-schema' apps/micro-business/src/`. Verified if both imports present.
7. **Global audit interceptor registration.** Check: `grep -E 'Interceptor' apps/*/src/main.ts` for globalInterceptor registrations.
8. **micro-file presigned URL generation.** Check: `grep -r 'presigned\|signUrl\|getObjectUrl' apps/micro-file/src/`.
9. **micro-cluster gateway port dependency.** Check: grep `CLUSTER_SERVICE` env in gateway + confirm micro-cluster main.ts uses same pair.
10. **Socket.io rooms scoped per user/BU.** Check: grep `join\|room` in `apps/micro-notification/src/`; inspect room naming.
11. **Socket.io Redis adapter need.** Check: `grep '@socket.io/redis-adapter' apps/micro-notification/`. If present → demote (already handled). If absent → verified warning.
12. **log-events-library concurrent writes.** Check: read the writer file for file locking or queue mechanism.
13. **log-events-library exports.** Check: open `packages/log-events-library/src/index.ts`; compare exported names against README's listed exports.

(Implementer adds rows for any `_(verify)_` marker not covered above.)

For each fact: run the check; record Result; propagate the action (remove marker / delete bullet / replace with accurate version) to every location listed.

### Pass 3 — Domain doc surface check

Target: `docs/domain-inventory-calculations.md`.

Approach (grep-based, per user choice):

```
# Extract all tb_* references from the doc
grep -oE 'tb_[a-z_]+' docs/domain-inventory-calculations.md | sort -u > /tmp/doc-models.txt

# Extract all model names from the schema
grep -oE '^model [a-zA-Z_]+' packages/prisma-shared-schema-tenant/prisma/schema.prisma | awk '{print $2}' | sort -u > /tmp/schema-models.txt

# Diff — items in doc but not in schema = stale references
comm -23 /tmp/doc-models.txt /tmp/schema-models.txt
```

For each model-name hit in doc-but-not-in-schema:
- If mentioned in a single-line reference → fix (rename or delete line).
- If the model name heads a multi-line section (function docs etc.) → tag that section `_(stale — needs rewrite)_`.

Also extract function names:
```
# Naive pass — function definitions in the doc
grep -oE 'CREATE OR REPLACE FUNCTION [a-z_]+' docs/domain-inventory-calculations.md | awk '{print $5}' | sort -u
```
Check each against migrations:
```
grep -r 'CREATE OR REPLACE FUNCTION <name>' packages/prisma-shared-schema-tenant/prisma/migrations/
```
Missing = tag or delete.

Explicitly NOT done: line-by-line field checks within models.

### Pass 4 — Design docs

Targets: `docs/design-micro-report-go.md`, `docs/design-micro-report-ts.md`.

Check: does a `micro-report` directory exist under `apps/`?
- **No** → add a `> **Status:** proposed — not yet implemented.` line at the top of each file. No other changes.
- **Yes** → spot-check 3–5 key design decisions against the implementation. If there's clear drift, add `> **Note:** design diverged from implementation — see [apps/micro-report/](../apps/micro-report/) for current state.` at top. Don't rewrite the design content.

### Pass 5 — Legacy-notes promotion

Target: `docs/design-legacy-notes.md` (671 lines, 6 sections by source file).

For each of the 6 sections:
1. Read section fully.
2. Identify subsections worth keeping.
3. Decide promotion target:
   - Architecture-related content → `docs/architecture-system.md` (append under an appropriate existing heading).
   - Domain rules → `docs/domain-inventory-calculations.md` (if the topic is inventory).
   - Env/config/deployment → `docs/deploy-*.md` or `docs/ops-*.md`.
   - Issues / gotchas that are still relevant → `CLAUDE.md` Gotchas (if agent-relevant) or dropped (noted in log, we don't retain).
4. Append promoted content with a heading that indicates provenance: `## <topic> (from legacy notes — verified 2026-04-20)`.
5. **Verify at promotion time.** Promoted content must NOT carry `_(verify)_` markers — either quickly confirm against current code (add to fact map if a new fact) or drop the ambiguous portion. The point of Pass 5 is moving *verified* content; if a section can't be verified in under a few minutes, don't promote it — skip and note.
6. Commit per promotion (one source file → one or more commits).

After all sections processed, `git rm docs/design-legacy-notes.md` in a final commit.

### Pass 6 — Final cleanup

- `git rm docs/archive-verify-fact-map.md`.
- Run `bunx lychee --offline` on all touched files.
- Fix only real broken links (false-positive discipline from #1).

## 6. Process

1. **Branch.** `docs/docs-verification` in worktree `../carmen-turborepo-backend-v2-docs-verify`, based on `docs/service-readmes` (PR #10).
2. **Spec + plan commit** first.
3. **Build the fact map** (commit).
4. **Pass 1** — per file commits (10 files).
5. **Pass 2** — marker sweep. One commit grouping all marker changes across CLAUDE.md + READMEs (commit message lists each fact + files touched).
6. **Pass 3** — domain doc surface check. One commit.
7. **Pass 4** — design docs top-note. One commit.
8. **Pass 5** — legacy-notes promotion. One commit per source section promoted; one commit to delete the file.
9. **Pass 6** — delete fact map, link-check, open PR.

## 7. Done Criteria

- **No `_(verify)_` markers remain** in CLAUDE.md or any service/package README. `grep -rE '_\(verify\)_' CLAUDE.md apps/ packages/ docs/ --include='*.md'` returns 0 hits.
- Every `docs/*.md` file shows at least one edit, tag, or explicit "verified unchanged" note in a commit message during this branch's history.
- `docs/design-legacy-notes.md` is deleted; at least one promotion commit exists for content extracted from it.
- `docs/archive-verify-fact-map.md` is deleted in the final commit.
- `bunx lychee --offline` passes on all `docs/**/*.md`, root `README.md`, and `CLAUDE.md`.
- Fact map file had one row per unique `_(verify)_` fact resolved.
- PR opened with appropriate base.

### Explicitly NOT done criteria

- All `_(stale — needs rewrite)_` markers resolved.
- Field-level Prisma accuracy of the domain doc.

## 8. Risks & Mitigations

| # | Risk | Mitigation |
|---|------|------------|
| 1 | Sweep balloons beyond a reviewable PR. | Surface-level per user Q3 for the 6458-line domain doc (grep-based). Commit-per-pass keeps aborts reviewable. |
| 2 | False-negative stale tagging. | When uncertain → tag, don't delete. `_(stale — needs rewrite)_` is the escape hatch. |
| 3 | Propagation fails — marker removed in one file but missed elsewhere. | Fact map is the single source of truth; commit message for the marker-sweep commit lists every fact + every file touched. |
| 4 | Legacy-notes promotion targets a not-yet-verified section. | Pass 5 runs after Passes 1–4, so target docs are verified. Promotions go under existing heading structures, never stuffed into a tagged-stale section. |
| 5 | Rebase conflicts with #8/#9/#10 when #4 goes onto main. | Branch from #10 so prior work is present. Surgical edits at marker locations should rebase cleanly. |
| 6 | Domain-doc grep produces many tagged sections. | Accept. Tags are informational; future pass can resolve. |
| 7 | Link-check false positives (like #1's credential-redaction misfire). | Explicit guidance: don't edit prose to suppress. Only fix real path mismatches. |

## 9. Assumptions

- PRs #8, #9, #10 are open or merged; none is discarded. If one is discarded, markers it introduced may not exist in base; the fact map will catch that.
- `lychee` via `bunx` remains workable (fallback `markdown-link-check`).
- No concurrent PR mutating the same markers.

## 10. Implementation ordering (for the plan)

1. Create worktree; commit spec + plan.
2. Build fact map — enumerate every `_(verify)_` marker, group by underlying fact, add check procedure per row.
3. Pass 1 (10 commits, one per file in `docs/architecture-*`, `docs/deploy-*`, `docs/ops-*`).
4. Pass 2 (one commit after fact-map results populated).
5. Pass 3 (one commit).
6. Pass 4 (one commit).
7. Pass 5 (N commits — one per promoted section, plus one to delete legacy-notes file).
8. Pass 6 — delete fact map; link-check; push + open PR.

---

**Next step:** user reviews this spec, then invoke `writing-plans` for the implementation plan.
