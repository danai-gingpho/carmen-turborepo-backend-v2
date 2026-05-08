# Doc Inventory & Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggressively clean up the Carmen repo's doc footprint so only `README.md` + `CLAUDE.md` live at root, every file in `docs/` matches `^(architecture|deploy|ops|domain|design)-[a-z0-9-]+\.md$`, and no salvageable content is lost.

**Architecture:** One branch (`docs/cleanup-inventory`). Working decision table (`docs/archive-inventory-decisions.md`) drives all actions. Commits grouped by action type for reviewable diffs: salvage → rename → merge → relocate scripts → reference-fix → delete. Git history is the archive.

**Tech Stack:** git, `grep`, `bunx lychee` (markdown link checker), plain file I/O.

**Source spec:** `docs/superpowers/specs/2026-04-20-doc-inventory-cleanup-design.md`

---

## Pre-flight checklist (do before Task 1)

- [ ] Confirm clean working tree: `git status` shows no staged/unstaged changes except the spec + plan files.
- [ ] Confirm on a sensible base branch (`main` per repo convention).
- [ ] Confirm `bunx` is available: `which bunx` or `bun --version`.
- [ ] Confirm no in-flight PR touches any of the files in scope (ask user if unsure).

---

## Task 1: Create working branch and commit the spec + plan

**Files:**
- Commit (already exist): `docs/superpowers/specs/2026-04-20-doc-inventory-cleanup-design.md`, `docs/superpowers/plans/2026-04-20-doc-inventory-cleanup.md`

- [ ] **Step 1: Create and switch to branch**

Run:
```bash
git checkout -b docs/cleanup-inventory
```
Expected: `Switched to a new branch 'docs/cleanup-inventory'`

- [ ] **Step 2: Stage spec and plan**

Run:
```bash
git add docs/superpowers/specs/2026-04-20-doc-inventory-cleanup-design.md \
        docs/superpowers/plans/2026-04-20-doc-inventory-cleanup.md
```

- [ ] **Step 3: Commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
docs: add spec and plan for doc inventory cleanup (sub-project #1)

Spec: aggressive root cleanup, flat-prefix docs/ convention,
salvage-before-delete pipeline. See docs/superpowers/specs/.

Plan: bite-sized tasks per superpowers:writing-plans.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```
Expected: commit created, working tree clean.

- [ ] **Step 4: Verify**

Run:
```bash
git log -1 --stat
```
Expected: one commit adding the two files under `docs/superpowers/`.

---

## Task 2: Build the working decision table

**Files:**
- Create: `docs/archive-inventory-decisions.md`

- [ ] **Step 1: Enumerate in-scope files**

Run:
```bash
# Root .md, .docx, .txt, .json, cursorrule, and the generate file
ls -1 /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2/ \
  | grep -E '\.(md|docx|txt|json|cursor)$|^generate$' \
  | grep -v '^package-lock\.json$' \
  | grep -v '^bun\.lockb$'

# All docs/ tree
find /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2/docs \
  -type f -not -path '*/superpowers/*'
```
Expected: enumerates the files; use the output to populate the table below.

- [ ] **Step 2: Write `docs/archive-inventory-decisions.md`**

Create the file with this exact content (fill in salvage notes + judgment decisions in later tasks):

```markdown
# Doc Inventory Decisions (working file — deleted at end)

Working contract for the doc cleanup sub-project. Every in-scope file has a
row. Nothing is touched until its row has an action.

## Legend

- **keep** — stays as-is.
- **rename** — `git mv` to new path under flat-prefix convention.
- **merge** — content absorbed into another file.
- **delete** — removed after salvage pass.
- **relocate** — moved out of `docs/` into `scripts/` or similar (for non-doc files).

## Root files

| path | action | new path | salvage notes | references found |
|---|---|---|---|---|
| `README.md` | keep | — | — | (fill in after Task 5) |
| `CLAUDE.md` | keep | — | — | (fill in after Task 5) |
| `PRD.md` | delete | — | (fill in Task 4) | (fill in Task 5) |
| `PROJECT_DOCUMENTATION.md` | delete | — | (fill in Task 4) | (fill in Task 5) |
| `PROJECT_DOCUMENTATION.docx` | delete | — | binary — no salvage | (fill in Task 5) |
| `WARP.md` | delete | — | (fill in Task 4) | (fill in Task 5) |
| `cursorrule.cursor` | delete | — | (fill in Task 4) | (fill in Task 5) |
| `api-500-errors-investigation.txt` | delete | — | (fill in Task 4) | (fill in Task 5) |
| `api-crud-test-results.txt` | delete | — | one-off test output — no salvage | (fill in Task 5) |
| `api-test-results.txt` | delete | — | one-off test output — no salvage | (fill in Task 5) |
| `PROJECT_ISSUES_REPORT.txt` | delete | — | (fill in Task 4) | (fill in Task 5) |
| `get-good-received-note-payload-from-PO.json` | delete | — | test scratch — no salvage | (fill in Task 5) |
| `test_insert_report.json` | delete | — | test scratch — no salvage | (fill in Task 5) |
| `generate` | delete | — | empty file — no salvage | (fill in Task 5) |

## docs/ files (non-subfolder)

| path | action | new path | salvage notes | references found |
|---|---|---|---|---|
| `docs/architecture-diagram.md` | (judgment) | (judgment) | — | (Task 5) |
| `docs/infra-diagram.md` | (judgment) | (judgment) | — | (Task 5) |
| `docs/k8s-architecture-diagram.md` | (judgment) | (judgment) | — | (Task 5) |
| `docs/k8s-dynamic-clustering-architecture.md` | (judgment) | (judgment) | — | (Task 5) |
| `docs/deploy_new_tenant_schema.md` | rename | `docs/deploy-tenant-schema.md` | — | (Task 5) |
| `docs/deploy_new_platform_schema.md` | rename | `docs/deploy-platform-schema.md` | — | (Task 5) |
| `docs/docker-run.md` | rename | `docs/deploy-docker-run.md` | — | (Task 5) |
| `docs/fix-ssl-keycloak.md` | rename | `docs/ops-fix-ssl-keycloak.md` | — | (Task 5) |
| `docs/start_dev_base.md` | rename | `docs/ops-start-dev-base.md` | — | (Task 5) |
| `docs/prisma-upgrade-script.md` | rename | `docs/ops-prisma-upgrade-script.md` | — | (Task 5) |
| `docs/micro-report-design.md` | (judgment) | (judgment) | — | (Task 5) |
| `docs/micro-report-design-go.md` | (judgment) | (judgment) | — | (Task 5) |

## docs/inventory-calculations/ (judgment call — merge or flatten)

| path | action | new path | salvage notes | references found |
|---|---|---|---|---|
| `docs/inventory-calculations/busness-rules-inventory-calc.md` | (judgment) | (judgment) | note typo "busness" — fix in new name | (Task 5) |
| `docs/inventory-calculations/functional-requirements.md` | (judgment) | (judgment) | — | (Task 5) |
| `docs/inventory-calculations/inventory-calculations.md` | (judgment) | (judgment) | — | (Task 5) |

## docs/tools/ (judgment call — mostly NOT docs, needs relocation)

| path | action | new path | salvage notes | references found |
|---|---|---|---|---|
| `docs/tools/README.md` | (judgment — merge) | — | — | (Task 5) |
| `docs/tools/README_backup.md` | delete | — | redundant backup of README | (Task 5) |
| `docs/tools/backup.md` | (judgment — merge) | `docs/ops-backup.md` | — | (Task 5) |
| `docs/tools/auto_backup.sh` | relocate | `scripts/backup/auto_backup.sh` | script, not doc | (Task 5) |
| `docs/tools/backup_postgres.py` | relocate | `scripts/backup/backup_postgres.py` | script, not doc | (Task 5) |
| `docs/tools/cleanup_backups.py` | relocate | `scripts/backup/cleanup_backups.py` | script, not doc | (Task 5) |
| `docs/tools/convert-copy-to-insert.py` | relocate | `scripts/backup/convert-copy-to-insert.py` | script, not doc | (Task 5) |
| `docs/tools/env.example` | relocate | `scripts/backup/env.example` | config, not doc | (Task 5) |
| `docs/tools/env_config.txt` | relocate | `scripts/backup/env_config.txt` | config, not doc | (Task 5) |
| `docs/tools/requirements.txt` | relocate | `scripts/backup/requirements.txt` | python deps | (Task 5) |
| `docs/tools/restore_postgres.py` | relocate | `scripts/backup/restore_postgres.py` | script, not doc | (Task 5) |
| `docs/tools/setup.sh` | relocate | `scripts/backup/setup.sh` | script, not doc | (Task 5) |
| `docs/tools/setup_cron.sh` | relocate | `scripts/backup/setup_cron.sh` | script, not doc | (Task 5) |

## Judgment calls to resolve in Task 3

1. **Architecture docs** — merge 4 files into 1–2, or keep 4 separate with prefix renames?
2. **Inventory-calculations** — merge 3 files into one `docs/domain-inventory-calculations.md`, or keep 3 prefixed (fix typo)?
3. **tools/ docs** — merge `README.md` + `backup.md` into `docs/ops-backup.md`?
4. **Micro-report variants** — keep both `-ts` and `-go` designs, or merge?
5. **Scripts relocation target** — `scripts/backup/` (as above), `scripts/tools/`, or somewhere else already established in the repo?
```

- [ ] **Step 3: Commit the working file**

Run:
```bash
git add docs/archive-inventory-decisions.md
git commit -m "$(cat <<'EOF'
docs: add working decision table for inventory cleanup

Temporary working file — deleted in final cleanup commit.
Drives all file actions per spec section 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Resolve judgment calls with user

**Files:**
- Modify: `docs/archive-inventory-decisions.md`

This task is interactive. Present each judgment call to the user with a recommendation + 1–2 alternatives, wait for their call, then fill in the table.

- [ ] **Step 1: Present judgment call #1 — Architecture docs**

Show the user:
```
Current files:
  docs/architecture-diagram.md
  docs/infra-diagram.md
  docs/k8s-architecture-diagram.md
  docs/k8s-dynamic-clustering-architecture.md

Options:
  A) Merge all 4 into one `docs/architecture-system.md`
  B) Split into `docs/architecture-system.md` (system+infra) and
     `docs/architecture-k8s.md` (both k8s files) — RECOMMENDED
  C) Keep 4 separate with prefix renames:
       docs/architecture-system.md
       docs/architecture-infra.md
       docs/architecture-k8s.md
       docs/architecture-k8s-dynamic-clustering.md
```
Wait for answer. Record in table (set action + new path columns for the 4 rows).

- [ ] **Step 2: Present judgment call #2 — Inventory-calculations**

Show the user:
```
Current files (in docs/inventory-calculations/):
  busness-rules-inventory-calc.md  ← note typo "busness"
  functional-requirements.md
  inventory-calculations.md

Options:
  A) Merge all 3 into `docs/domain-inventory-calculations.md` — RECOMMENDED
  B) Flatten to 3 prefixed files:
       docs/domain-inventory-business-rules.md  (typo fixed)
       docs/domain-inventory-functional-requirements.md
       docs/domain-inventory-calculations.md
```
Wait for answer. Record in table.

- [ ] **Step 3: Present judgment call #3 — tools/ docs**

Show the user:
```
After deleting docs/tools/README_backup.md:
  docs/tools/README.md   (describes the backup tooling)
  docs/tools/backup.md   (backup guide)

Options:
  A) Merge both into `docs/ops-backup.md` — RECOMMENDED
  B) Keep 2 separate: `docs/ops-backup-overview.md` + `docs/ops-backup-guide.md`
```
Wait for answer. Record in table.

- [ ] **Step 4: Present judgment call #4 — Micro-report design**

Show the user:
```
Current files:
  docs/micro-report-design.md     (likely TypeScript design)
  docs/micro-report-design-go.md  (Go variant/alternative)

Options:
  A) Keep both, rename to `docs/design-micro-report-ts.md` +
     `docs/design-micro-report-go.md` — RECOMMENDED (language choice isn't
     decided yet; preserve both)
  B) Merge into one `docs/design-micro-report.md` with language sections
  C) Keep only the TS one (if Go variant is obsolete) — confirm with user
```
Wait for answer. Record in table.

- [ ] **Step 5: Present judgment call #5 — Scripts relocation**

Run first to check existing scripts layout:
```bash
ls /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2/scripts/
```
Show output to user, then present:
```
docs/tools/ contains 11 scripts/config files (backup tooling).
They must leave docs/ (flat-prefix rule).

Options:
  A) Relocate to `scripts/backup/` — RECOMMENDED if scripts/ already exists
  B) Relocate to `scripts/tools/`
  C) Relocate to a location the user prefers (ask)
```
Wait for answer. Update table rows with chosen path.

- [ ] **Step 6: Commit the filled-in table**

Run:
```bash
git add docs/archive-inventory-decisions.md
git commit -m "$(cat <<'EOF'
docs: resolve judgment calls in inventory decision table

All 5 judgment calls now have concrete action + destination.
Ready for salvage pass (Task 4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Salvage pass

**Files:**
- Create: `docs/design-legacy-notes.md`
- Read (do not modify): `PRD.md`, `PROJECT_DOCUMENTATION.md`, `WARP.md`, `cursorrule.cursor`, `PROJECT_ISSUES_REPORT.txt`, `api-500-errors-investigation.txt`

- [ ] **Step 1: Read each deletion-marked file that might contain salvageable content**

For each file, use the Read tool (not `cat`/`head`), then decide if any content is still accurate and worth preserving. Focus on:
- PRD/vision statements not yet in `README.md`
- Architecture descriptions not yet in `docs/architecture-*`
- Known-issue notes that aren't tracked elsewhere
- Env/config rules not in `CLAUDE.md`

Files to check:
```
PRD.md
PROJECT_DOCUMENTATION.md   ← 96KB, largest effort
WARP.md
cursorrule.cursor
PROJECT_ISSUES_REPORT.txt
api-500-errors-investigation.txt
```

For each file, append a summary of the salvage decision to the decision table's `salvage notes` column. Example entry:
- "Section 3 (data flow) still accurate — salvaged. Section 1 (vision) superseded by README — not salvaged."

- [ ] **Step 2: Create `docs/design-legacy-notes.md`**

Template:
```markdown
# Legacy Notes — Salvaged Content Pending Verification

This file collects content pulled from deleted legacy docs during the
doc inventory cleanup (sub-project #1). Content here is **not** verified
against current code — that happens in sub-project #4. Treat as
"possibly accurate, pending review."

Each section is headed by its source file and date of salvage.

---

## From `PROJECT_DOCUMENTATION.md` (salvaged 2026-04-20)

<paste salvaged content here, preserving subheaders>

---

## From `PRD.md` (salvaged 2026-04-20)

<paste salvaged content here>

---

## From `WARP.md` (salvaged 2026-04-20)

<paste salvaged content here>

---

## From `PROJECT_ISSUES_REPORT.txt` (salvaged 2026-04-20)

<paste salvaged content here>

---

## From `cursorrule.cursor` (salvaged 2026-04-20)

<paste salvaged content here>

---

## From `api-500-errors-investigation.txt` (salvaged 2026-04-20)

<paste salvaged content here>
```

If a file has zero salvage-worthy content, include the section anyway with the body `_Nothing salvaged — content superseded by [where it now lives] or obsolete._` — this documents that it was checked.

- [ ] **Step 3: Verify legacy-notes file is well-formed**

Run:
```bash
bunx lychee --offline --no-progress docs/design-legacy-notes.md
```
Expected: exit 0 (any internal links resolve).

- [ ] **Step 4: Commit salvage pass**

Run:
```bash
git add docs/design-legacy-notes.md docs/archive-inventory-decisions.md
git commit -m "$(cat <<'EOF'
docs: salvage content from legacy root docs

Extracted content worth preserving from PROJECT_DOCUMENTATION.md,
PRD.md, WARP.md, cursorrule.cursor, and legacy .txt reports.
All salvage decisions tracked in docs/archive-inventory-decisions.md.

Content pending verification in sub-project #4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Reference-grep pass

**Files:**
- Modify: `docs/archive-inventory-decisions.md` (fill in `references found` column)

- [ ] **Step 1: Grep for each file path that will be moved or deleted**

Run once per file (or batch with alternation). Use the Grep tool (not raw `grep`). Search pattern covers references like `./PRD.md`, `](PRD.md)`, `"PRD.md"`, etc.

Pattern to use with the Grep tool:
```
PROJECT_DOCUMENTATION|PRD\.md|WARP\.md|cursorrule\.cursor|api-test-results|api-crud-test-results|api-500-errors-investigation|PROJECT_ISSUES_REPORT|get-good-received-note-payload-from-PO|test_insert_report|docs/tools|docs/inventory-calculations|deploy_new_tenant_schema|deploy_new_platform_schema|docker-run\.md|fix-ssl-keycloak|start_dev_base|prisma-upgrade-script|architecture-diagram\.md|infra-diagram|k8s-architecture-diagram|k8s-dynamic-clustering-architecture|micro-report-design
```

Glob: `**/*` (exclude `node_modules`, `.git`, `docs/superpowers`)

- [ ] **Step 2: Record hits per file in the decision table**

For each in-scope file with a hit, fill in the `references found` column with a bullet list of `<file>:<line>`. If no hits, write `_none_`.

Example cell:
```
- README.md:42
- CLAUDE.md:15
- scripts/deploy.sh:8
```

- [ ] **Step 3: Commit the reference mapping**

Run:
```bash
git add docs/archive-inventory-decisions.md
git commit -m "$(cat <<'EOF'
docs: map external references to files in inventory cleanup scope

Each row in the decision table now records where moved/deleted
files are referenced. Reference-fix pass (Task 8) will update
each hit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Rename/move pass

**Files:**
- Move: all files in the decision table with action `rename`, plus the non-judgment-call standard renames.

This task uses `git mv` so history follows. Group all renames into one commit.

- [ ] **Step 1: Run the non-conditional renames**

These are fixed (not judgment calls):

```bash
cd /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2

git mv docs/deploy_new_tenant_schema.md docs/deploy-tenant-schema.md
git mv docs/deploy_new_platform_schema.md docs/deploy-platform-schema.md
git mv docs/docker-run.md docs/deploy-docker-run.md
git mv docs/fix-ssl-keycloak.md docs/ops-fix-ssl-keycloak.md
git mv docs/start_dev_base.md docs/ops-start-dev-base.md
git mv docs/prisma-upgrade-script.md docs/ops-prisma-upgrade-script.md
```

- [ ] **Step 2: Run judgment-call renames (non-merge paths only)**

For each row in the decision table with action `rename` and a new path, run `git mv`. Example (the actual commands depend on Task 3 answers):

```bash
# If user chose keep-4-separate for architecture:
git mv docs/architecture-diagram.md docs/architecture-system.md
git mv docs/infra-diagram.md docs/architecture-infra.md
git mv docs/k8s-architecture-diagram.md docs/architecture-k8s.md
git mv docs/k8s-dynamic-clustering-architecture.md docs/architecture-k8s-dynamic-clustering.md

# If user chose flatten for inventory-calculations:
git mv docs/inventory-calculations/busness-rules-inventory-calc.md \
       docs/domain-inventory-business-rules.md
git mv docs/inventory-calculations/functional-requirements.md \
       docs/domain-inventory-functional-requirements.md
git mv docs/inventory-calculations/inventory-calculations.md \
       docs/domain-inventory-calculations.md

# Micro-report rename (if user chose "keep both"):
git mv docs/micro-report-design.md docs/design-micro-report-ts.md
git mv docs/micro-report-design-go.md docs/design-micro-report-go.md
```

Skip any row whose action is `merge` — those are handled in Task 7.

- [ ] **Step 3: Verify renames**

Run:
```bash
git status --short
```
Expected: all moves show as `R  old_path -> new_path`.

- [ ] **Step 4: Commit the rename pass**

Run:
```bash
git commit -m "$(cat <<'EOF'
docs: apply flat-prefix rename convention

Renames all docs/ files to match ^(architecture|deploy|ops|domain|design)-.+\.md$.
Uses git mv so history follows each file.

Merges and relocations handled in follow-up commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Merge pass (conditional — one commit per merged topic)

**Files:**
- Create: new merged file(s) per judgment decisions.
- Delete: source files that were merged.

Run only the sub-tasks for merges the user chose in Task 3.

### 7a. Architecture merge (only if user chose option A or B)

- [ ] **Step 1: Create merged file**

Example for option B (system + k8s split):
```bash
# Pseudocode: use Read tool to read each source file, then Write to create merged file.
# File: docs/architecture-system.md (merge architecture-diagram.md + infra-diagram.md)
# File: docs/architecture-k8s.md (merge k8s-architecture-diagram.md + k8s-dynamic-clustering-architecture.md)
```

Use section headers to preserve provenance:
```markdown
# System Architecture

## System-level view
<contents of architecture-diagram.md>

## Infrastructure view
<contents of infra-diagram.md>
```

- [ ] **Step 2: Remove source files**

```bash
git rm docs/architecture-diagram.md docs/infra-diagram.md
# or the k8s pair, depending on which merge
```

- [ ] **Step 3: Commit**

```bash
git add docs/architecture-*.md
git commit -m "$(cat <<'EOF'
docs: merge architecture diagrams into canonical files

Merged per judgment call #1 in docs/archive-inventory-decisions.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### 7b. Inventory-calculations merge (only if user chose option A)

- [ ] **Step 1: Create merged file**

```markdown
# Inventory Calculations — Domain Rules

## Business rules
<contents of busness-rules-inventory-calc.md>

## Functional requirements
<contents of functional-requirements.md>

## Calculation reference
<contents of inventory-calculations.md>
```

Write to `docs/domain-inventory-calculations.md`.

- [ ] **Step 2: Remove source directory contents**

```bash
git rm docs/inventory-calculations/busness-rules-inventory-calc.md \
       docs/inventory-calculations/functional-requirements.md \
       docs/inventory-calculations/inventory-calculations.md
rmdir docs/inventory-calculations
```

- [ ] **Step 3: Commit**

```bash
git add docs/domain-inventory-calculations.md
git commit -m "$(cat <<'EOF'
docs: merge inventory-calculations/ into single domain file

Flattens docs/inventory-calculations/ (3 files) into
docs/domain-inventory-calculations.md per judgment call #2.
Fixes typo "busness" → "business" in section headers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### 7c. tools/ docs merge (only if user chose option A)

- [ ] **Step 1: Create merged file**

```markdown
# Backup & Restore Operations

## Overview
<contents of docs/tools/README.md>

## Backup guide
<contents of docs/tools/backup.md>
```

Write to `docs/ops-backup.md`.

- [ ] **Step 2: Remove source files** (leave scripts for Task 8)

```bash
git rm docs/tools/README.md docs/tools/backup.md
```

- [ ] **Step 3: Commit**

```bash
git add docs/ops-backup.md
git commit -m "$(cat <<'EOF'
docs: merge docs/tools/ docs into docs/ops-backup.md

Merges README.md + backup.md per judgment call #3.
Scripts relocated separately in Task 8.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

### 7d. Micro-report merge (only if user chose option B)

- [ ] **Step 1: Create merged file**

```markdown
# Micro-report Design

## TypeScript implementation
<contents of micro-report-design.md>

## Go implementation (alternative)
<contents of micro-report-design-go.md>
```

Write to `docs/design-micro-report.md`.

- [ ] **Step 2: Remove source files**

```bash
git rm docs/micro-report-design.md docs/micro-report-design-go.md
```

- [ ] **Step 3: Commit**

```bash
git add docs/design-micro-report.md
git commit -m "$(cat <<'EOF'
docs: merge micro-report design variants into single file

Combines TS and Go variant designs per judgment call #4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Relocate scripts out of docs/tools/

**Files:**
- Move: 11 script/config files from `docs/tools/` to the destination chosen in Task 3 (default: `scripts/backup/`).

- [ ] **Step 1: Create destination directory**

```bash
mkdir -p /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2/scripts/backup
```
Expected: directory exists.

- [ ] **Step 2: `git mv` all script files**

```bash
cd /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2

git mv docs/tools/auto_backup.sh scripts/backup/auto_backup.sh
git mv docs/tools/backup_postgres.py scripts/backup/backup_postgres.py
git mv docs/tools/cleanup_backups.py scripts/backup/cleanup_backups.py
git mv docs/tools/convert-copy-to-insert.py scripts/backup/convert-copy-to-insert.py
git mv docs/tools/env.example scripts/backup/env.example
git mv docs/tools/env_config.txt scripts/backup/env_config.txt
git mv docs/tools/requirements.txt scripts/backup/requirements.txt
git mv docs/tools/restore_postgres.py scripts/backup/restore_postgres.py
git mv docs/tools/setup.sh scripts/backup/setup.sh
git mv docs/tools/setup_cron.sh scripts/backup/setup_cron.sh
```
(Adjust destination path per user's Task 3 choice.)

- [ ] **Step 3: Verify `docs/tools/` is now empty (or only has `README_backup.md` pending delete)**

```bash
ls docs/tools/
```
Expected: `README_backup.md` only (deleted in Task 10).

- [ ] **Step 4: Update `docs/ops-backup.md` with new script paths**

Any mention of `docs/tools/auto_backup.sh`, etc., inside the merged `docs/ops-backup.md` must be updated to `scripts/backup/auto_backup.sh` (or chosen path). Use the Edit tool per match.

- [ ] **Step 5: Commit relocation**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: relocate backup scripts from docs/tools/ to scripts/backup/

Scripts and config files don't belong under docs/. Moved to scripts/backup/
and updated references in docs/ops-backup.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Reference-fix pass

**Files:**
- Modify: every file listed in the `references found` column of the decision table.

- [ ] **Step 1: For each hit recorded in Task 5, update the reference**

Use the Edit tool on each file. Example rules:

- If target was renamed: update path to new name.
- If target was merged: update path to the merged file + optionally the section anchor.
- If target was deleted without replacement: remove the reference OR replace with a short note (depends on context).
- If target was relocated (scripts): update path to new scripts location.

Common files likely to need updates:
- `README.md` — links to `PRD.md`, `PROJECT_DOCUMENTATION.md`, old `docs/` paths.
- `CLAUDE.md` — references to deleted/renamed docs.
- `docker-compose*.yml`, `k8s/*`, `scripts/*.sh` — paths to `.env.example` or doc files.
- `apps/*/README.md`, `packages/*/README.md` — cross-links.

- [ ] **Step 2: Verify no stale references remain**

Using the Grep tool, re-run the pattern from Task 5 with the same glob. Expected: zero hits outside `docs/superpowers/` and `docs/archive-inventory-decisions.md` (the working file still lists historical paths).

- [ ] **Step 3: Commit reference fixes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: update internal references to moved/renamed doc paths

Updates all .md/.sh/.yml references to files moved or renamed in
earlier commits of this cleanup branch. No content changes beyond
path updates.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Delete pass

**Files:**
- Delete (all via `git rm`):
  - Root: `PRD.md`, `PROJECT_DOCUMENTATION.md`, `PROJECT_DOCUMENTATION.docx`, `WARP.md`, `cursorrule.cursor`, `api-500-errors-investigation.txt`, `api-crud-test-results.txt`, `api-test-results.txt`, `PROJECT_ISSUES_REPORT.txt`, `get-good-received-note-payload-from-PO.json`, `test_insert_report.json`, `generate`
  - `docs/tools/README_backup.md`
  - `docs/tools/` (the now-empty directory, after `README_backup.md` deletion)
  - `docs/archive-inventory-decisions.md` (the working file)

- [ ] **Step 1: Delete root files**

```bash
cd /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2

git rm PRD.md PROJECT_DOCUMENTATION.md PROJECT_DOCUMENTATION.docx \
       WARP.md cursorrule.cursor \
       api-500-errors-investigation.txt api-crud-test-results.txt \
       api-test-results.txt PROJECT_ISSUES_REPORT.txt \
       get-good-received-note-payload-from-PO.json test_insert_report.json \
       generate
```

- [ ] **Step 2: Delete `docs/tools/README_backup.md` and the empty folder**

```bash
git rm docs/tools/README_backup.md
# After git rm the folder should be empty — remove it if still there
rmdir docs/tools 2>/dev/null || true
```

- [ ] **Step 3: Delete the working decision table**

```bash
git rm docs/archive-inventory-decisions.md
```

- [ ] **Step 4: Verify root is clean**

```bash
ls -1 | grep -E '\.(md|docx|txt|json|cursor)$|^generate$' \
  | grep -v '^package-lock\.json$' \
  | grep -v '^README\.md$' \
  | grep -v '^CLAUDE\.md$'
```
Expected: empty output.

- [ ] **Step 5: Verify `docs/` is flat and well-prefixed**

```bash
find docs -type f -name '*.md' \
  -not -path 'docs/superpowers/*' \
  | sort
```
Expected: every line matches `^docs/(architecture|deploy|ops|domain|design)-[a-z0-9-]+\.md$`. No subdirectories (except `docs/superpowers/`).

Also verify:
```bash
find docs -type d -not -path 'docs/superpowers*' -not -path 'docs'
```
Expected: empty output (no subdirectories except `docs/superpowers/`).

- [ ] **Step 6: Commit the delete pass**

```bash
git commit -m "$(cat <<'EOF'
docs: delete legacy docs and working cleanup files

Root deletions (salvaged where applicable, see docs/design-legacy-notes.md):
- PRD.md: superseded by README rewrite (sub-project #2).
- PROJECT_DOCUMENTATION.md: 96KB sprawl; salvaged sections in legacy notes.
- PROJECT_DOCUMENTATION.docx: binary, superseded.
- WARP.md: Warp-specific; CLAUDE.md is canonical.
- cursorrule.cursor: Cursor-specific; same reason.
- api-500-errors-investigation.txt: one-off investigation.
- api-crud-test-results.txt: one-off test output.
- api-test-results.txt: one-off test output.
- PROJECT_ISSUES_REPORT.txt: one-off report.
- get-good-received-note-payload-from-PO.json: test scratch.
- test_insert_report.json: test scratch.
- generate: empty file.

docs/ deletions:
- docs/tools/README_backup.md: redundant backup of README.
- docs/archive-inventory-decisions.md: working contract for this branch,
  no longer needed — git history is the record.

All content is recoverable via git history. See
docs/superpowers/specs/2026-04-20-doc-inventory-cleanup-design.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Link-check pass

**Files:**
- Verify-only: `README.md`, `CLAUDE.md`, every `docs/**/*.md`.

- [ ] **Step 1: Run offline link check**

```bash
bunx lychee --offline --no-progress 'docs/**/*.md' README.md CLAUDE.md
```
Expected: exit 0, summary line reads `All good` or equivalent.

- [ ] **Step 2: Fix any broken links found**

If lychee reports a broken link, use the Edit tool to fix each one. Typical fixes:
- Link points to renamed file → update path.
- Link points to deleted file → remove link or replace with a note.
- Anchor drift (heading changed when files were merged) → update `#anchor`.

- [ ] **Step 3: Re-run lychee to confirm clean**

```bash
bunx lychee --offline --no-progress 'docs/**/*.md' README.md CLAUDE.md
```
Expected: exit 0.

- [ ] **Step 4: Commit link fixes (only if any were needed)**

```bash
git add -A
git commit -m "$(cat <<'EOF'
docs: fix internal links broken by inventory cleanup

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If no fixes needed, skip this step.

---

## Task 12: Final verification against done criteria

**Files:**
- Verify-only.

Run every done-criteria check from spec §5. Each must pass before PR.

- [ ] **Step 1: Root contents check**

```bash
cd /Users/samutpra/GitHub/carmensoftware-organize/carmen-turborepo-backend-v2

for f in PROJECT_DOCUMENTATION.md PROJECT_DOCUMENTATION.docx PRD.md WARP.md \
         cursorrule.cursor generate \
         api-500-errors-investigation.txt api-crud-test-results.txt \
         api-test-results.txt PROJECT_ISSUES_REPORT.txt \
         get-good-received-note-payload-from-PO.json test_insert_report.json; do
  test ! -e "$f" || echo "STILL EXISTS: $f"
done
```
Expected: empty output.

- [ ] **Step 2: `docs/` regex check**

```bash
find docs -type f -name '*.md' -not -path 'docs/superpowers/*' \
  | while read f; do
    base=$(basename "$f")
    echo "$base" | grep -qE '^(architecture|deploy|ops|domain|design)-[a-z0-9-]+\.md$' \
      || echo "BAD NAME: $f"
  done
```
Expected: empty output.

- [ ] **Step 3: No subdirectories in `docs/` (except `superpowers/`)**

```bash
find docs -mindepth 1 -type d -not -path 'docs/superpowers*'
```
Expected: empty output.

- [ ] **Step 4: Reference grep clean**

Use the Grep tool:
- Pattern: `PROJECT_DOCUMENTATION|PRD\.md|WARP\.md|cursorrule\.cursor|api-test-results|api-crud-test-results|api-500-errors-investigation|PROJECT_ISSUES_REPORT`
- Glob: `**/*`
- Excludes: `node_modules`, `.git`, `docs/superpowers` (via path exclusion)

Expected: zero hits.

- [ ] **Step 5: Working file gone**

```bash
test ! -e docs/archive-inventory-decisions.md && echo OK || echo STILL EXISTS
```
Expected: `OK`.

- [ ] **Step 6: `git log` sanity**

```bash
git log --oneline main..docs/cleanup-inventory
```
Expected: commits in order — spec+plan, working table, judgment resolution, salvage, reference mapping, renames, (merges), script relocate, reference fix, delete, (link fixes).

```bash
git log --diff-filter=D --name-only main..docs/cleanup-inventory
```
Expected: lists all deleted paths from Task 10.

---

## Task 13: Open PR

- [ ] **Step 1: Push branch**

```bash
git push -u origin docs/cleanup-inventory
```

- [ ] **Step 2: Create PR**

```bash
gh pr create --title "docs: inventory cleanup — aggressive root/docs consolidation" \
  --body "$(cat <<'EOF'
## Summary

- Delete 12 legacy artifacts from repo root (`PRD.md`, `PROJECT_DOCUMENTATION.*`, `WARP.md`, `cursorrule.cursor`, one-off `.txt`/`.json` reports, `generate`).
- Flatten `docs/` subdirectories (`inventory-calculations/`, `tools/`) and apply flat-prefix convention `(architecture|deploy|ops|domain|design)-*.md`.
- Salvage worthwhile content into `docs/design-legacy-notes.md` (verification deferred to sub-project #4).
- Relocate backup scripts from `docs/tools/` to `scripts/backup/`.
- Fix all internal references to moved/deleted paths.

Root now contains only `README.md` + `CLAUDE.md` for doc files. Content rewrite of those two is deferred to sub-project #2.

Spec: `docs/superpowers/specs/2026-04-20-doc-inventory-cleanup-design.md`
Plan: `docs/superpowers/plans/2026-04-20-doc-inventory-cleanup.md`

## Test plan

- [ ] `ls` repo root shows no legacy `.md`/`.docx`/`.txt`/`.json` files outside `README.md`, `CLAUDE.md`.
- [ ] `find docs -type f -name '*.md' -not -path 'docs/superpowers/*'` — every filename matches `^(architecture|deploy|ops|domain|design)-[a-z0-9-]+\.md$`.
- [ ] `bunx lychee --offline 'docs/**/*.md' README.md CLAUDE.md` — exit 0.
- [ ] Grep for legacy filenames (`PRD.md`, `WARP.md`, etc.) in non-`docs/superpowers/` paths — zero hits.
- [ ] `git log --oneline main..HEAD` shows commits grouped by action type.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Share PR URL with user**

Expected: PR URL printed; share it with the user for review.

---

## Self-review checklist (pre-handoff)

- [x] **Spec coverage:** Every bullet in spec §3 (target state), §4 (process), §5 (done criteria) maps to a task or verification step.
- [x] **Placeholder scan:** No TBD/TODO. Every code block has concrete content. Salvage/reference steps use the working decision table as the source of truth.
- [x] **Type/path consistency:** New filenames in Task 6/7 match the regex in Task 12 §2. Working file `docs/archive-inventory-decisions.md` is created in Task 2 and deleted in Task 10. Salvage file `docs/design-legacy-notes.md` is created in Task 4, referenced in Task 10 commit message.
- [x] **Task granularity:** Each step is a single action — `git mv`, Read/Write, Edit, commit, or verification grep. No step bundles multiple distinct actions.
- [x] **Conditional handling:** Task 7 merge pass is conditional per judgment calls; sub-tasks 7a–7d each have their own commit path.
- [x] **Recovery:** Every delete is preceded by `git mv` or salvage. Rollback is one `git revert` per commit.
