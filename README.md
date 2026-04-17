# humancov

[![CI](https://github.com/enixCode/humancov/actions/workflows/ci.yml/badge.svg)](https://github.com/enixCode/humancov/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/humancov)](https://www.npmjs.com/package/humancov)
[![license](https://img.shields.io/badge/license-CC0--1.0-brightgreen)](https://creativecommons.org/publicdomain/zero/1.0/)
[![node](https://img.shields.io/node/v/humancov)](https://nodejs.org/)
[![GitHub](https://img.shields.io/github/stars/enixCode/humancov?style=social)](https://github.com/enixCode/humancov)
![Human Reviewed](https://img.shields.io/badge/human--reviewed-16%25%20of%20AI%20files-red)

A lightweight CLI that tracks AI-generated vs human-written code in your repo.

Add provenance headers to your files, scan, and know exactly what's been human-reviewed.

---

## Install

Install as a dev dependency in your project:

```bash
npm install --save-dev humancov
npx humancov scan
```

Requires **Node >= 18**.

---

## AI Tool Setup

Run `humancov init` **first** - it teaches your AI coding tool to tag every file it generates with provenance headers automatically.

```bash
humancov init
```

It detects existing config files (or rule directories) and appends the instructions block. If a modern rules directory exists, a dedicated rule file is created instead.

| Tool | Config file |
|---|---|
| Claude Code | `CLAUDE.md` |
| AGENTS.md (cross-tool) | `AGENTS.md` |
| Cursor (legacy) | `.cursorrules` |
| Cursor (rules dir) | `.cursor/rules/humancov.mdc` |
| Windsurf (legacy) | `.windsurfrules` |
| Windsurf (rules dir) | `.windsurf/rules/humancov.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |

If the file already contains AI-Provenance instructions, it skips it. If no config files are found, it lists the supported files.

---

## Quick Start

**1. Add headers to your files** (first 20 lines):

```python
# AI-Provenance-Origin: ai
# AI-Provenance-Generator: claude-code
# AI-Provenance-Reviewed: false
# AI-Provenance-Tested: false
```

**2. Scan your repo:**

```bash
humancov scan
```

```
AI-Provenance Scan
==================
Total files scanned:  22
AI-generated:         18
Human-written:        0
Mixed:                0
Unknown (no header):  4

Of AI files:
  Reviewed:  3 / 18  (17%)
  Tested:    5 / 18  (28%)
```

**3. When you review a file**, update the header:

```python
# AI-Provenance-Origin: ai
# AI-Provenance-Reviewed: true
# AI-Provenance-Confidence: high
```

---

## Commands

| Command | Description |
|---|---|
| `humancov scan` | Scan repo and print report |
| `humancov scan --json` | Output results as JSON |
| `humancov scan --badge` | Output shields.io badge URL |
| `humancov scan --check <N>` | Exit 1 if reviewed% < N (for CI) |
| `humancov manifest` | Generate `.humancov` manifest file |
| `humancov init` | Add AI-Provenance instructions to AI tool configs |
| `humancov --version` | Print version |

### Examples

**`--json`** - per-file provenance data:

```json
{
  "files": [
    { "file": "src/scanner.js", "origin": "ai", "generator": "claude-code", "reviewed": "false", ... },
    { "file": "lib/utils.py", "origin": "human", "reviewed": "true", ... }
  ],
  "summary": { "total": 22, "ai": 18, "human": 0, "mixed": 0, "unknown": 4, "reviewed": 3, "tested": 5 }
}
```

**`--badge`** - shields.io URL + markdown snippet:

```
https://img.shields.io/badge/human--reviewed-17%25%20of%20AI%20files-red
![Human Reviewed](https://img.shields.io/badge/human--reviewed-17%25%20of%20AI%20files-red)
```

**`--check 80`** - CI gate (exits 1 on failure):

```
Reviewed: 17% (threshold: 80%)
FAIL: 17% < 80%
```

---

## Header Keys

Add `AI-Provenance-` headers in a comment block at the top of any file (first 20 lines). Use your language's comment syntax (`//`, `#`, `<!--`, `/*`, `--`).

| Key | Required | Values |
|---|---|---|
| `Origin` | yes | `ai`, `human`, `mixed` |
| `Generator` | no | tool name (`claude-code`, `copilot`, `codex`...) |
| `Reviewed` | yes | `true`, `false`, `partial` |
| `Tested` | no | `true`, `false`, `partial` |
| `Confidence` | no | `high`, `medium`, `low` |
| `Notes` | no | free-text |

---

## Ignore Files

humancov automatically respects your **`.gitignore`** - no extra setup needed. Anything ignored by git is ignored by humancov.

For humancov-specific ignores on top of `.gitignore`, create `.humancov-ignore` at repo root (same gitignore syntax):

```gitignore
*.md
LICENSE
*.lock
dist/
coverage/
```

**Resolution order:** built-in defaults → `.gitignore` → `.humancov-ignore`.

Built-in defaults: `node_modules/`, `.git/`, `.humancov`, `.humancov-ignore`, `*.md`, `*.lock`, `LICENSE`, `.gitignore`, `.github/`.

---

## Badge

Shows the percentage of AI files that have been human-reviewed:

```markdown
![Human Reviewed](https://img.shields.io/badge/human--reviewed-42%25%20of%20AI%20files-yellow)
```

| Reviewed % | Color |
|---|---|
| < 25% | red |
| 25-74% | yellow |
| 75-99% | green |
| 100% | brightgreen |

---

## CI Integration

Add to your pipeline to enforce a review threshold:

```yaml
# GitHub Actions example
- name: Check AI review coverage
  run: npx humancov scan --check 80
```

Exits with code 1 if the reviewed percentage is below the threshold.

---

## Pre-commit Hook

A pre-commit hook keeps the badge and `.humancov` manifest up to date automatically on every commit.

Run `humancov init` and your AI tool will propose installing the hook for you.

<details>
<summary>Manual setup</summary>

Create `.git/hooks/pre-commit` with this content:

```sh
#!/bin/sh

# humancov - auto-update badge and manifest before each commit
npx humancov manifest 2>/dev/null
if [ -f ".humancov" ]; then
  git add .humancov
fi

BADGE_URL=$(npx humancov scan --badge 2>/dev/null | head -1)
if [ -n "$BADGE_URL" ] && [ -f "README.md" ]; then
  node -e "
    const fs = require('fs');
    const url = process.argv[1];
    const readme = fs.readFileSync('README.md', 'utf8');
    const updated = readme.replace(
      /!\[Human Reviewed\]\(https:\/\/img\.shields\.io\/badge\/human--reviewed-[^)]*\)/,
      '![Human Reviewed](' + url + ')'
    );
    if (updated !== readme) { fs.writeFileSync('README.md', updated); }
  " "\$BADGE_URL"
  git add README.md
fi
```

Then make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

> **Note:** `.git/hooks/` is local and not shared via git. Each contributor needs to set up the hook on their machine. If your team uses [husky](https://typicode.github.io/husky/) or a similar tool, add the hook content to your shared hooks directory instead.

</details>

---

## Manifest

`humancov manifest` generates a `.humancov` file at repo root - a TSV summary of all files with provenance headers:

```
# .humancov
# file              origin   reviewed   tested   generator     confidence
src/scanner.js      ai       true       false    claude-code   high
src/parser.js       ai       false      false    claude-code   -
lib/utils.py        human    true       true     -             -
```

File headers are the source of truth. If both exist and conflict, headers win.

---

## How It Works

```
humancov scan
     |
     v
Load ignore patterns (.humancov-ignore)
     |
     v
List files (git ls-files, or recursive walk)
     |
     v
For each file:
  - Skip if ignored or binary
  - Read first 20 lines
  - Extract AI-Provenance-* headers
  - Classify: ai / human / mixed / unknown
     |
     v
Aggregate stats and output report
```

---

## Spec

See the [AI-Provenance Spec v0.1](https://github.com/enixCode/humancov/blob/main/CLAUDE.md) for the full specification.

---

## License

CC0 1.0 (public domain)
