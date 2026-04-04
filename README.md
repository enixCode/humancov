# humancov

[![CI](https://github.com/enixCode/humancov/actions/workflows/ci.yml/badge.svg)](https://github.com/enixCode/humancov/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/humancov)](https://www.npmjs.com/package/humancov)
[![license](https://img.shields.io/badge/license-CC0--1.0-brightgreen)](https://creativecommons.org/publicdomain/zero/1.0/)
[![node](https://img.shields.io/node/v/humancov)](https://nodejs.org/)
[![GitHub](https://img.shields.io/github/stars/enixCode/humancov?style=social)](https://github.com/enixCode/humancov)
![Human Reviewed](https://img.shields.io/badge/human--reviewed-17%25%20of%20AI%20files-red)

A lightweight CLI that tracks AI-generated vs human-written code in your repo.

Add provenance headers to your files, scan, and know exactly what's been human-reviewed.

---

## Install

```bash
npm install -g humancov
```

Or locally:

```bash
npm install humancov
npx humancov scan
```

Requires **Node >= 18**.

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

---

## AI Tool Setup

Use `humancov init` to automatically add provenance instructions to your AI coding tool configs.

It detects existing config files and appends the instructions block:

| Tool | Config file |
|---|---|
| Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |

```bash
humancov init
```

If the file already contains AI-Provenance instructions, it skips it. If no config files are found, it lists the supported files.

---

## Header Keys

Headers use the prefix `AI-Provenance-` in a comment at the top of the file.

| Key | Required | Values | Description |
|---|---|---|---|
| `Origin` | yes | `ai`, `human`, `mixed` | Who wrote the file |
| `Generator` | no | free-text | Tool used (`claude-code`, `copilot`, `codex`...) |
| `Reviewed` | yes | `true`, `false`, `partial` | Human review status |
| `Tested` | no | `true`, `false`, `partial` | Human test status |
| `Confidence` | no | `high`, `medium`, `low` | Reviewer confidence |
| `Notes` | no | free-text | Any context |

### Comment styles

Headers adapt to the file's language:

```javascript
// AI-Provenance-Origin: ai          // JS, TS, Java, Go, Rust, C...
```
```python
# AI-Provenance-Origin: ai           # Python, Ruby, Shell, YAML...
```
```html
<!-- AI-Provenance-Origin: ai -->     <!-- HTML, XML, SVG, Vue, Markdown -->
```
```css
/* AI-Provenance-Origin: ai */        /* CSS, SCSS, Less */
```
```sql
-- AI-Provenance-Origin: ai           -- SQL, Lua
```

---

## Ignore Files

Create `.humancov-ignore` at repo root (gitignore syntax) to exclude files from scanning:

```gitignore
*.md
LICENSE
*.lock
dist/
coverage/
```

Default ignores: `node_modules/`, `.git/`, `.humancov`, `.humancov-ignore`, `*.md`, `*.lock`, `LICENSE`, `.gitignore`, `.github/`.

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

**Option A - via `humancov init`:**

Run `humancov init` and your AI tool will propose installing the hook for you.

**Option B - manual setup:**

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

## Performance

Benchmarked on a standard machine with Node >= 18. Run `node bench/perf.js` to reproduce.

| Operation | Scope | Avg |
|---|---|---|
| Comment prefix lookup | 10,000 lookups | ~12ms |
| Ignore pattern loading | single load | ~0.1ms |
| Badge URL generation | 1,000 generations | ~0.1ms |
| Header parsing | 7 files | ~3ms |
| Full repo scan | 8 tracked files | ~90ms |

**Scaling (scanFiles):**

| Files | Avg | Min | Max |
|---|---|---|---|
| 100 | ~120ms | ~80ms | ~220ms |
| 500 | ~175ms | ~145ms | ~295ms |
| 1,000 | ~265ms | ~220ms | ~340ms |

Scales near-linearly. The main cost is `git ls-files` + file I/O in the scanner - utility modules add negligible overhead.

---

## Spec

See the [AI-Provenance Spec v0.1](https://github.com/enixCode/humancov/blob/main/CLAUDE.md) for the full specification.

---

## License

CC0 1.0 (public domain)
