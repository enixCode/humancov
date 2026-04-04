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

export function loadIgnore(rootDir) {
  const ig = ignore();
  ig.add(DEFAULTS);

  try {
    const content = readFileSync(join(rootDir, '.humancov-ignore'), 'utf8');
    ig.add(content);
  } catch {
    // no ignore file - use defaults only
  }

  return ig;
}
