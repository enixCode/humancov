// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scanFiles } from '../src/scanner.js';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

describe('scanFiles', () => {
  it('returns files and summary', () => {
    const result = scanFiles(ROOT);
    assert.ok(Array.isArray(result.files));
    assert.ok(typeof result.summary === 'object');
    assert.ok(result.summary.total > 0);
  });

  it('summary counts add up to total', () => {
    const { summary } = scanFiles(ROOT);
    const sum = summary.ai + summary.human + summary.mixed + summary.unknown;
    assert.strictEqual(sum, summary.total);
  });

  it('finds known source files', () => {
    const { files } = scanFiles(ROOT);
    const paths = files.map(f => f.file);
    assert.ok(paths.includes('src/parser.js'));
    assert.ok(paths.includes('src/badge.js'));
    assert.ok(paths.includes('bin/humancov.js'));
  });

  it('excludes ignored files', () => {
    const { files } = scanFiles(ROOT);
    const paths = files.map(f => f.file);
    assert.ok(!paths.some(p => p.startsWith('node_modules/')));
    assert.ok(!paths.some(p => p.startsWith('.git/')));
    assert.ok(!paths.some(p => p.endsWith('.md')));
  });

  it('reviewed count does not exceed ai count', () => {
    const { summary } = scanFiles(ROOT);
    assert.ok(summary.reviewed <= summary.ai);
    assert.ok(summary.tested <= summary.ai);
  });

  it('each file has origin field', () => {
    const { files } = scanFiles(ROOT);
    for (const f of files) {
      assert.ok(f.origin, `${f.file} missing origin`);
    }
  });
});
