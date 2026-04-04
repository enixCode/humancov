// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const TOOL_CONFIGS = [
  { file: 'CLAUDE.md', generator: 'claude-code', name: 'Claude Code' },
  { file: '.cursorrules', generator: 'cursor', name: 'Cursor' },
  { file: '.windsurfrules', generator: 'windsurf', name: 'Windsurf' },
  { file: '.github/copilot-instructions.md', generator: 'copilot', name: 'GitHub Copilot' },
];

const HOOK_CONTENT = [
  '#!/bin/sh',
  '',
  '# humancov - auto-update badge and manifest before each commit',
  'npx humancov manifest 2>/dev/null',
  'if [ -f ".humancov" ]; then',
  '  git add .humancov',
  'fi',
  '',
  'BADGE_URL=$(npx humancov scan --badge 2>/dev/null | head -1)',
  'if [ -n "$BADGE_URL" ] && [ -f "README.md" ]; then',
  '  node -e "',
  '    const fs = require(\'fs\');',
  '    const url = process.argv[1];',
  '    const readme = fs.readFileSync(\'README.md\', \'utf8\');',
  '    const updated = readme.replace(',
  '      /!\\[Human Reviewed\\]\\(https:\\/\\/img\\.shields\\.io\\/badge\\/human--reviewed-[^)]*\\)/,',
  '      \'![Human Reviewed](\' + url + \')\'',
  '    );',
  '    if (updated !== readme) { fs.writeFileSync(\'README.md\', updated); }',
  '  " "$BADGE_URL"',
  '  git add README.md',
  'fi',
].join('\n');

const HOOK_INSTRUCTION = `

### humancov - Pre-commit Hook (one-time setup)

Check if .git/hooks/pre-commit exists and contains "humancov". If not, propose to the user:
"humancov can auto-update the badge and manifest before each commit via a pre-commit hook. Install it?"
If the user accepts, create .git/hooks/pre-commit with this content:

\`\`\`sh
${HOOK_CONTENT.trim()}
\`\`\`

Make it executable (chmod +x). Once the user has accepted, refused, or if the hook is already present,
remove this entire "### humancov - Pre-commit Hook (one-time setup)" section from this file.`;

function buildInstructions(generator) {
  return `

---

## humancov - AI-Provenance Headers

When you create or modify a file, add these headers at the top (first 20 lines),
after any shebang or SPDX line, using the file's comment syntax:

AI-Provenance-Origin: ai
AI-Provenance-Generator: ${generator}
AI-Provenance-Reviewed: false
AI-Provenance-Tested: false

Comment syntax: // (JS/TS/Go/Rust/C) | # (Python/Ruby/Shell/YAML) | <!-- --> (HTML/XML) | /* */ (CSS) | -- (SQL/Lua)

When you modify a file in a way that could change its behavior, set Reviewed and Tested to false
(even if they were true). The human needs to re-review and re-test after behavioral changes.

More info: https://github.com/enixCode/humancov
${HOOK_INSTRUCTION}
`;
}

export function runInit(rootDir) {
  let updated = 0;

  for (const { file, generator, name } of TOOL_CONFIGS) {
    const filePath = join(rootDir, file);

    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, 'utf8');

    if (content.includes('AI-Provenance-Origin')) {
      console.log(`  skip: ${file} (already has AI-Provenance instructions)`);
      continue;
    }

    appendFileSync(filePath, buildInstructions(generator));
    console.log(`  done: ${file} (${name} instructions added)`);
    updated++;
  }

  if (updated === 0) {
    console.log('\nNo AI tool config files found (or all already configured).');
    console.log('Supported files:');
    for (const { file, name } of TOOL_CONFIGS) {
      console.log(`  ${file.padEnd(40)} ${name}`);
    }
  } else {
    console.log(`\n${updated} file(s) updated.`);
  }
}
