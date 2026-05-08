# Doc Inventory & Cleanup — Design Spec

**Date:** 2026-04-20
**Status:** Draft (awaiting user review)
**Sub-project:** #1 of 4 in the larger "update all docs" effort
**Follow-ups (separate specs):** #2 Root docs refresh · #3 Per-service/package READMEs · #4 Architecture docs in `docs/` verification

---

## 1. Purpose

Produce a canonical doc map for the repo. Decide the fate of every human-readable artifact (`.md`, `.docx`, `.txt`, `cursorrule.cursor`, loose `.json` payloads) and land the repo in a state where:

- Exactly one root `README.md` and one root `CLAUDE.md` exist.
- Every file in `docs/` follows `docs/<prefix>-<topic>.md` (flat, no subfolders).
- No one-off investigation reports, binary `.docx`, or stale test payloads live at the repo root.
- Nothing salvageable is lost — git history is the archive.

## 2. Scope

### In scope

- All `.md` files in the repo, excluding `node_modules/` and `.git/`.
- Root `.txt` reports, `.docx` files, `cursorrule.cursor`, loose `.json` payloads (`get-good-received-note-payload-from-PO.json`, `test_insert_report.json`), and the empty `generate` file.
- File renames, moves, deletes inside `docs/`.
- Migrating any content worth keeping *before* deleting the source.
- Fixing any internal references (`.md`, CI, scripts) to paths changed/removed by this cleanup.

### Out of scope (deferred to follow-up sub-projects)

- Rewriting `README.md` content → sub-project #2.
- Writing per-service/package READMEs → sub-project #3.
- Verifying `docs/` content against current code → sub-project #4.
- Swagger / Bruno / `PRD.md` content updates.
- Any touch to code, configs (`turbo.json`, `tsconfig.json`, `package.json`), or build scripts.

### Non-goals

- Archiving to `docs/archive/`. Git history is the archive; no parallel archive folder.
- Content accuracy verification for kept files.
- Link-fixing for *external* references (Notion, wikis, emails) — flagged to user, not auto-handled.

## 3. Target End State

### Root

Only these doc-like files remain:

- `README.md` — stays (content rewrite is sub-project #2).
- `CLAUDE.md` — stays (content reconciliation is sub-project #2).

All code, config, scripts, and lockfiles are untouched.

### `docs/`

Flat directory, one level deep. Every file matches the regex:

```
^(architecture|deploy|ops|domain|design)-[a-z0-9-]+\.md$
```

Prefix meanings:

- `architecture-*` — system / infra / k8s diagrams and explanations.
- `deploy-*` — schema deployment, SSL fixes, docker.
- `ops-*` — backup, prisma upgrade, dev startup, tools.
- `domain-*` — business rules (e.g. inventory calculations).
- `design-*` — future / proposed designs not yet built.

No subfolders. No `tools/`, no `inventory-calculations/`.

### Deleted from root (moved nowhere — git is the archive)

| Path                                       | Reason                                                           |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `PROJECT_DOCUMENTATION.docx`               | Binary, superseded by `.md` version.                             |
| `PROJECT_DOCUMENTATION.md`                 | 96KB sprawl; salvageable pieces moved to `docs/` first.          |
| `PRD.md`                                   | Superseded by `README.md` rewrite in sub-project #2.             |
| `WARP.md`                                  | Warp-specific; `CLAUDE.md` is the canonical agent doc.           |
| `cursorrule.cursor`                        | Cursor-specific; same reason.                                    |
| `api-500-errors-investigation.txt`         | One-off investigation output.                                    |
| `api-crud-test-results.txt`                | One-off test output.                                             |
| `api-test-results.txt`                     | One-off test output.                                             |
| `PROJECT_ISSUES_REPORT.txt`                | One-off report.                                                  |
| `get-good-received-note-payload-from-PO.json` | Test scratch payload.                                         |
| `test_insert_report.json`                  | Test scratch payload.                                            |
| `generate`                                 | Empty file.                                                      |

### Deleted from `docs/`

| Path                         | Reason                                    |
| ---------------------------- | ----------------------------------------- |
| `docs/tools/README_backup.md`| Backup of a doc — redundant.              |

### Judgment calls deferred to implementation review

The spec does **not** pre-decide these. During implementation, each gets a recommendation + 1–2 alternatives presented to the user:

1. **Architecture diagrams merge.** `docs/architecture-diagram.md`, `docs/infra-diagram.md`, `docs/k8s-architecture-diagram.md`, `docs/k8s-dynamic-clustering-architecture.md` — merge into one or two files (`architecture-system.md`, `architecture-k8s.md`), or keep four separate with prefixed renames?
2. **Inventory-calculations flatten.** `docs/inventory-calculations/` has 3 files (`busness-rules-inventory-calc.md`, `functional-requirements.md`, `inventory-calculations.md`). Merge into one `docs/domain-inventory-calculations.md`, or keep three with prefixed renames?
3. **`docs/tools/` folder flatten.** After deleting `README_backup.md`, remaining `README.md` + `backup.md` — combine into `docs/ops-backup.md`, or keep two?
4. **Micro-report design variants.** `docs/micro-report-design.md` and `docs/micro-report-design-go.md` — keep both (implementation languages) or merge?

### Salvage destination

Content worth keeping from deleted files lands in **one new file**:

- `docs/design-legacy-notes.md` — catchall for salvaged content from `PROJECT_DOCUMENTATION.md`, `PRD.md`, `WARP.md`, `cursorrule.cursor`, and any `.txt` reports that have content worth preserving.

Rationale: keeps salvage centralized and reviewable; doesn't muddy existing `docs/` files with orphaned content that hasn't been verified (verification is sub-project #4).

## 4. Process & Safety

### Branch and commits

- One branch: `docs/cleanup-inventory`.
- Commits grouped by action type for reviewable diffs:
  1. Salvage commit — new `docs/design-legacy-notes.md` with extracted content.
  2. Rename commit — all `git mv` operations (flattening subfolders, applying prefix convention).
  3. Merge commits — one per merged topic (architecture, inventory-calculations, etc.), if judgment calls go that way.
  4. Reference-fix commit — updates to any `.md`, script, or CI file that linked to moved/deleted paths.
  5. Delete commit — all deletions, with commit message listing every deleted path + one-line reason each.
- Use `git mv` for renames so history follows.
- No force-push, no history rewrite.

### Ordering — salvage before delete

For every file marked for deletion:

1. Read the full file.
2. Decide if any content is worth preserving.
3. If yes, add it to `docs/design-legacy-notes.md` under a section header naming the source file.
4. Record the decision in the working decision table (see below).
5. Only after salvage → delete.

### Per-file decision table

During implementation, maintain `docs/archive-inventory-decisions.md` as the working contract. Columns:

| path | action (keep/rename/merge/delete) | new path (if any) | salvage notes | references found |

Every in-scope file has a row. **No file is touched without a row in this table.**

This file is deleted in the final commit — git history is the record.

### Reference verification before each delete/move

Before deleting or moving any file, run:

```bash
# From repo root
grep -r "<filename>" --include="*.md" --include="*.yml" --include="*.yaml" \
  --include="*.json" --include="*.ts" --include="*.js" --include="*.sh" \
  --exclude-dir=node_modules --exclude-dir=.git
```

For every hit, update the referring file to point to the new location (or remove the reference if the file is being deleted without replacement). Reference updates ship in the reference-fix commit.

### Internal link verification

After all moves/deletes are in, run a markdown link checker:

```bash
bunx lychee --offline --no-progress 'docs/**/*.md' README.md CLAUDE.md
```

Any broken internal link must be fixed before the branch is merged. External URLs may be checked with `bunx lychee` (network-on) but are not blocking.

### Rollback

Everything is one `git revert <commit-sha>` away. No `.docx` / `.json` / `.txt` is lost forever — all remain in git history.

## 5. Deliverables & Done Criteria

### Deliverables

1. New `docs/design-legacy-notes.md` containing salvaged content, section-headed by source filename.
2. Renames/moves applied via `git mv` in one commit (flattening + prefix convention).
3. Merges applied, one commit per merged topic.
4. Deletions applied in one commit with a full reason list in the message.
5. Reference updates applied to any `.md`, script, or CI file that pointed to moved/deleted paths.
6. Final `docs/` directory matches flat-prefix convention.
7. Working `docs/archive-inventory-decisions.md` deleted in the final commit.

### Done criteria (checkable)

- **Root contents** — only `README.md`, `CLAUDE.md`, code/config files, scripts, lockfiles. Confirm with `ls` that none of these exist at root:
  - `PROJECT_DOCUMENTATION.md`, `PROJECT_DOCUMENTATION.docx`
  - `PRD.md`, `WARP.md`, `cursorrule.cursor`, `generate`
  - `api-500-errors-investigation.txt`, `api-crud-test-results.txt`, `api-test-results.txt`, `PROJECT_ISSUES_REPORT.txt`
  - `get-good-received-note-payload-from-PO.json`, `test_insert_report.json`
- **`docs/` contents** — every file matches `^(architecture|deploy|ops|domain|design)-[a-z0-9-]+\.md$`. No subdirectories.
- **Reference grep clean:**
  ```
  grep -r "PROJECT_DOCUMENTATION\|PRD\.md\|WARP\.md\|cursorrule\.cursor\|api-test-results\|api-crud-test-results\|api-500-errors-investigation\|PROJECT_ISSUES_REPORT" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=docs/superpowers
  ```
  Returns zero hits. `docs/superpowers/` is excluded because this spec itself names the deleted files for traceability; the grep concerns active references, not historical ones. The deletion commit message isn't in grep scope either.
- **Link check passes:** `bunx lychee --offline --no-progress 'docs/**/*.md' README.md CLAUDE.md` exits 0.
- **Git log sanity:** `git log --diff-filter=D --name-only docs/cleanup-inventory` shows the expected deletions.
- **Working file gone:** `docs/archive-inventory-decisions.md` does not exist in the final tree.

### Explicitly NOT in done criteria

- Content accuracy of kept files — sub-project #4.
- Per-service/package README presence — sub-project #3.
- `README.md` / `CLAUDE.md` content quality — sub-project #2.
- External link references (Notion, wikis, emails) — flagged to user only.

## 6. Risks & Mitigations

| # | Risk                                                                                      | Mitigation                                                                                                                                    |
| - | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Content loss via salvage miss — 96KB `PROJECT_DOCUMENTATION.md` hides accurate pieces.    | Implementation reads the whole file and writes salvage notes into the decision table; user reviews the table before the delete commit fires. |
| 2 | External references break (Notion pages, onboarding emails linking to `WARP.md`, etc.).   | Out of repo scope — flagged to user during review. User decides tombstone vs. accept-break.                                                   |
| 3 | Judgment-call drift on deferred merges (architecture, inventory, tools, micro-report).    | Implementation presents each with a recommendation + 1–2 alternatives and waits for user call. Does not decide unilaterally.                  |
| 4 | Hidden doc links in code (`readFileSync('PROJECT_DOCUMENTATION.md')` or similar).         | Reference-grep step in §4 covers all file types that could contain paths (`.ts`, `.js`, `.sh`, `.yml`, `.yaml`, `.json`, `.md`).              |
| 5 | `CLAUDE.md` / `README.md` currently reference files being deleted.                        | Reference-fix commit updates both. This is path/mention fixes only, not content rewrite.                                                      |
| 6 | Salvaged content lands in `docs/design-legacy-notes.md` without being verified.           | Acceptable — verification is sub-project #4. File is named to signal "legacy / pending review."                                               |

## 7. Assumptions

- `lychee` is available via `bunx` without pre-install (it is — it's a Rust binary but the wrapper handles it; if it fails, fall back to `markdown-link-check`).
- No in-flight PR depends on the files being deleted.
- The user is the sole reviewer of judgment calls during implementation (no external stakeholder approvals required).
- Git history alone is sufficient archival — no need to tar/export deleted files before removal.

## 8. Implementation Ordering (for the plan)

1. Create branch `docs/cleanup-inventory`.
2. Build `docs/archive-inventory-decisions.md` — classify every in-scope file.
3. Present the table to the user; resolve judgment calls.
4. Salvage pass → create `docs/design-legacy-notes.md`. Commit.
5. Reference-grep pass → build a list of files that need updating.
6. Rename/move pass → `git mv` operations. Commit.
7. Merge pass (if any) → one commit per merged topic.
8. Reference-fix pass → update all referring files. Commit.
9. Delete pass → remove all delete-marked files + the decision table itself. Commit.
10. Link-check pass — `bunx lychee`. Fix any breaks in a follow-up commit.
11. Open PR against `main` for final review.

---

**Next step:** user review of this spec, then invoke `writing-plans` skill to produce the implementation plan.
