// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: true

import { existsSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const TOOL_CONFIGS = [
  { file: 'CLAUDE.md', generator: 'claude-code', name: 'Claude Code' },
  { file: '.cursorrules', generator: 'cursor', name: 'Cursor' },
  { file: '.windsurfrules', generator: 'windsurf', name: 'Windsurf' },
  { file: '.github/copilot-instructions.md', generator: 'copilot', name: 'GitHub Copilot' },
];

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

More info: https://github.com/enixCode/humancov
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
