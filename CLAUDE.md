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

Files matching patterns in `.humancov-ignore` (same syntax as `.gitignore`) are excluded from scanning and badge calculation. Typical ignores:

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