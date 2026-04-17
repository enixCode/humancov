// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: true

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ignore from 'ignore';

const DEFAULTS = [
  'node_modules/',
  '.git/',
  '.humancov',
  '.humancov-ignore',
  '*.md',
  '*.lock',
  'LICENSE',
  '.gitignore',
  '.github/',
];

const IGNORE_FILES = ['.gitignore', '.humancov-ignore'];

export function loadIgnore(rootDir) {
  const ig = ignore();
  ig.add(DEFAULTS);

  for (const file of IGNORE_FILES) {
    try {
      const content = readFileSync(join(rootDir, file), 'utf8');
      ig.add(content);
    } catch {
      // file not present - skip
    }
  }

  return ig;
}
