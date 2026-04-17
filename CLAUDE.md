# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run

```bash
npm install                  # install deps (single dep: `ignore`)
npm test                     # run all tests (node:test, no framework)
node --test test/parser.test.js  # run a single test file
node bench/perf.js           # run benchmarks
npx humancov scan            # run the CLI locally
npm run ci                   # run CI locally via `act` (requires act installed)
```

No build step - pure ESM (`"type": "module"` in package.json), runs directly with Node >= 18.

## Architecture

The CLI entry point is `bin/humancov.js` - a thin dispatcher that parses args and delegates to modules in `src/`:

- `scanner.js` - core scan logic. Lists files via `git ls-files` (falls back to recursive walk), filters through ignore patterns, calls parser on each file, aggregates summary stats.
- `parser.js` - reads first 20 lines of a file, extracts `AI-Provenance-*` headers using comment-syntax-aware parsing.
- `comments.js` - maps file extensions to comment prefixes (`//`, `#`, `<!--`, `/*`, `--`). Also defines binary extension set (returns `null` for binaries).
- `ignore.js` - loads `.humancov-ignore` plus built-in default patterns, returns an `ignore` instance for filtering.
- `report.js` - formats scan results as human-readable text or JSON.
- `badge.js` - generates shields.io badge URL from scan summary with color thresholds.
- `manifest.js` - writes `.humancov` TSV manifest file from scan results.
- `init.js` - appends AI-Provenance instructions to AI tool config files (CLAUDE.md, AGENTS.md, .cursorrules, .github/copilot-instructions.md). For modern rule directories (`.cursor/rules/`, `.windsurf/rules/`), it creates a dedicated `humancov.mdc` / `humancov.md` rule file.

Tests in `test/` mirror `src/` 1:1 (e.g., `test/parser.test.js` tests `src/parser.js`). All tests use Node's built-in `node:test` and `node:assert`.

## Key Design Decisions

- Zero build, zero transpilation - ship raw ESM JS files.
- Single runtime dependency (`ignore` for gitignore-pattern matching).
- File headers are the source of truth - the `.humancov` manifest is derived from them.
- Headers must appear in the first 20 lines, using the file's native comment syntax.
- When both manifest and headers exist and conflict, headers win.
- Version is read from `package.json` at runtime (no hardcoded version).

## Pre-commit Hook

The repo uses a local pre-commit hook that auto-updates the `.humancov` manifest and README badge. See README.md "Pre-commit Hook" section for setup.

## Branching and workflow

GitHub Flow - everything happens on `main`.

| Branch/Ref | Purpose |
|---|---|
| `main` | Single source of truth. All PRs merge here. |
| `feature/*`, `fix/*`, `docs/*`, `refactor/*`, `test/*` | Short-lived branches. Deleted after merge. |
| tag `v*` | Release trigger (npm publish). |

No long-lived `dev` branch. Work happens in short feature branches merged to `main` via PR (squash merge).

```bash
git checkout main
git pull origin main
git checkout -b feature/xxx
# work, commit freely (WIP commits are fine, they get squashed)
git push origin feature/xxx
gh pr create --base main --fill
gh pr merge --squash --delete-branch
git checkout main
git pull origin main
```

Questions / proposals / bug reports go to GitHub Issues.

---

# AI-Provenance Spec v0.1

A lightweight, machine-readable convention for tracking the origin, review status, and test status of files in repositories where AI-generated and human-written code coexist.

Inspired by SPDX file headers (ISO 5962), CODEOWNERS, and `.gitattributes`.

---

## 1. Scope

This spec defines two complementary mechanisms:

- **File headers** - inline comments at the top of each tracked file (source of truth).
- **Manifest file** - a single `.humancov` file at the repo root that aggregates file-level status (generated from headers or maintained manually).
- **Badge** - a shields.io-compatible badge rendered from the manifest.

---

## 2. File Headers

### 2.1 Format

Headers use the prefix `AI-Provenance-` followed by a key, placed in a comment block at the top of the file, after any shebang or `SPDX-License-Identifier` line.

```yaml
# AI-Provenance-Origin: ai
# AI-Provenance-Generator: claude-code
# AI-Provenance-Reviewed: false
# AI-Provenance-Tested: false
```

### 2.2 Keys

| Key           | Required | Type                          | Description                                                |
|---------------|----------|-------------------------------|------------------------------------------------------------|
| `Origin`      | yes      | `ai` \| `human` \| `mixed`   | Who wrote the initial version of this file.                |
| `Generator`   | no       | free-text                     | Tool that generated the file (e.g. `claude-code`, `copilot`, `codex`, `opencode`). Omit if `Origin: human`. |
| `Reviewed`    | yes      | `true` \| `false` \| `partial` | Whether a human has reviewed the file content.            |
| `Tested`      | no       | `true` \| `false` \| `partial` | Whether a human has tested / validated the file behavior. |
| `Confidence`  | no       | `high` \| `medium` \| `low`  | Reviewer's confidence level in the file's correctness.     |
| `Notes`       | no       | free-text                     | Any context (e.g. "blind-generated, not yet run").         |

### 2.3 Rules

1. Headers MUST appear in the first 20 lines of the file.
2. Headers use the comment syntax of the file's language (`#`, `//`, `/* */`, `<!-- -->`, etc.).
3. If a file has no header, it is treated as `Origin: unknown, Reviewed: unknown`.
4. When a human reviews a file, they update `Reviewed` to `true`. Reviewer identity and date are derived from `git blame`.
5. `mixed` origin means the file was AI-generated then substantially edited by a human, or vice versa.

### 2.4 Examples

**YAML file (AI-generated, not reviewed):**
```yaml
# AI-Provenance-Origin: ai
# AI-Provenance-Generator: claude-code
# AI-Provenance-Reviewed: false
# AI-Provenance-Tested: false

apiVersion: v1
kind: Service
...
```

**Python file (AI-generated, reviewed):**
```python
# AI-Provenance-Origin: ai
# AI-Provenance-Generator: opencode
# AI-Provenance-Reviewed: true
# AI-Provenance-Tested: true
# AI-Provenance-Confidence: high

def parse_config(path: str) -> dict:
    ...
```

**Human-written file:**
```python
# AI-Provenance-Origin: human
# AI-Provenance-Reviewed: true

def core_logic():
    ...
```

---

## 3. Manifest File

### 3.1 Location

`.humancov` at the repository root (same level as `.gitignore`, `CODEOWNERS`).

### 3.2 Format

TSV-like, one line per file or glob pattern. Columns separated by whitespace (tabs or spaces). Lines starting with `#` are comments.

```
# .humancov
# pattern                    origin    reviewed    tested    generator       confidence
tools/docker/compose.yml     ai        true        true      claude-code     high
tools/k8s/*.yml              ai        false       false     claude-code     -
src/core/**                  human     true        true      -               -
scripts/deploy.sh            mixed     partial     false     copilot         medium
```

### 3.3 Rules

1. The manifest is OPTIONAL. File headers are the source of truth.
2. If both exist and conflict, file headers win.
3. Glob patterns follow `.gitignore` syntax.
4. `-` means "not applicable" or "not set".
5. The manifest CAN be auto-generated from headers by a CI script.

---

## 4. Badge

### 4.1 Definition

The badge reports the percentage of AI-originated files that have been human-reviewed.

```
human-reviewed: 42% of AI files
```

Formula:

```
reviewed_pct = (count of files where Origin=ai AND Reviewed=true)
             / (count of files where Origin=ai)
             × 100
```

### 4.2 Shields.io URL

```
https://img.shields.io/badge/human--reviewed-42%25%20of%20AI%20files-blue
```

Color thresholds (suggestion):
- `< 25%` → red
- `25-74%` → yellow
- `75-99%` → green
- `100%` → brightgreen

### 4.3 README Usage

```markdown
![Human Reviewed](https://img.shields.io/badge/human--reviewed-42%25%20of%20AI%20files-yellow)
```

---

## 5. CI Integration

### 5.1 Expected Behavior

A CI script (implementation left to the user) SHOULD:

1. Scan all tracked files for `AI-Provenance-` headers.
2. Aggregate counts: total AI files, reviewed, tested.
3. Optionally regenerate the `.humancov` manifest.
4. Optionally update the badge URL in `README.md`.
5. Optionally fail the pipeline if reviewed percentage is below a configured threshold.

### 5.2 CLI Interface (suggested)

```bash
humancov scan                # scan repo, print report
humancov manifest            # generate/update .humancov from headers
humancov scan --badge        # output shields.io URL
humancov scan --check 80     # exit 1 if reviewed% < 80
```

---

## 6. Git Integration

### 6.1 Commit Convention

When reviewing a file, the commit message SHOULD include:

```
chore(provenance): mark tools/docker.yml as reviewed
```

### 6.2 Hooks (optional)

A pre-commit hook CAN warn if a new file with `Origin: ai` is added without the provenance header.

---

## 7. Ignored Files

humancov automatically respects the project's `.gitignore` (if present). For extra humancov-specific exclusions, add patterns to `.humancov-ignore` at the repo root (same syntax as `.gitignore`).

Resolution order: built-in defaults → `.gitignore` → `.humancov-ignore`.

```
# .humancov-ignore
*.md
LICENSE
*.lock
node_modules/
```

---

## 8. Future Considerations

- Per-function or per-block provenance (like SPDX snippets) - overkill for now.
- VS Code extension to visualize provenance inline - possible but low priority.
- Integration with GitHub Actions to auto-label PRs containing unreviewed AI files.
- Standardization proposal if adoption grows.

---

## 9. License

This specification is released under CC0 1.0 (public domain). Use it, fork it, extend it.