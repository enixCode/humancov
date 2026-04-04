// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: true

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadIgnore } from './ignore.js';
import { parseHeaders } from './parser.js';

function listGitFiles(rootDir) {
  try {
    const out = execSync('git ls-files', { cwd: rootDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const files = out.trim().split('\n').filter(Boolean);
    return files.length > 0 ? files : null;
  } catch {
    return null;
  }
}

function listAllFiles(rootDir, ig) {
  const results = [];

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = relative(rootDir, join(dir, entry.name)).replace(/\\/g, '/');
      if (ig.ignores(rel + (entry.isDirectory() ? '/' : ''))) continue;
      if (entry.isDirectory()) {
        walk(join(dir, entry.name));
      } else {
        results.push(rel);
      }
    }
  }

  walk(rootDir);
  return results;
}

export function scanFiles(rootDir) {
  const ig = loadIgnore(rootDir);
  const gitFiles = listGitFiles(rootDir);
  const files = gitFiles || listAllFiles(rootDir, ig);

  const results = [];
  const summary = {
    total: 0, ai: 0, human: 0, mixed: 0, unknown: 0,
    reviewed: 0, tested: 0,
  };

  for (const file of files) {
    // git ls-files doesn't know about humancov ignores - filter here
    if (gitFiles && ig.ignores(file)) continue;

    const fullPath = join(rootDir, file);
    const headers = parseHeaders(fullPath);
    if (!headers) continue; // binary - skip

    summary.total++;
    const origin = headers.origin || 'unknown';
    if (origin in summary) summary[origin]++;

    if (headers.origin === 'ai') {
      if (headers.reviewed === 'true') summary.reviewed++;
      if (headers.tested === 'true') summary.tested++;
    }

    results.push({ file, ...headers });
  }

  return { files: results, summary };
}
