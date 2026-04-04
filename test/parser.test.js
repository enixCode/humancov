// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHeaders } from '../src/parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, '..', '.test-tmp-parser');

function setup() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
}

function cleanup() {
  rmSync(TMP, { recursive: true, force: true });
}

function writeTemp(name, content) {
  const p = join(TMP, name);
  writeFileSync(p, content, 'utf8');
  return p;
}

describe('parseHeaders', () => {
  it('parses all AI-Provenance headers from a JS file', () => {
    setup();
    const p = writeTemp('full.js', [
      '// AI-Provenance-Origin: ai',
      '// AI-Provenance-Generator: claude-code',
      '// AI-Provenance-Reviewed: true',
      '// AI-Provenance-Tested: true',
      '// AI-Provenance-Confidence: high',
      '// AI-Provenance-Notes: generated blind',
      '',
      'const x = 1;',
    ].join('\n'));

    const h = parseHeaders(p);
    assert.strictEqual(h.origin, 'ai');
    assert.strictEqual(h.generator, 'claude-code');
    assert.strictEqual(h.reviewed, 'true');
    assert.strictEqual(h.tested, 'true');
    assert.strictEqual(h.confidence, 'high');
    assert.strictEqual(h.notes, 'generated blind');
    cleanup();
  });

  it('returns unknown origin/reviewed when no headers', () => {
    setup();
    const p = writeTemp('empty.js', 'const x = 1;\n');
    const h = parseHeaders(p);
    assert.strictEqual(h.origin, 'unknown');
    assert.strictEqual(h.reviewed, 'unknown');
    cleanup();
  });

  it('parses hash-style comments in Python files', () => {
    setup();
    const p = writeTemp('script.py', [
      '# AI-Provenance-Origin: human',
      '# AI-Provenance-Reviewed: true',
      '',
      'def main(): pass',
    ].join('\n'));

    const h = parseHeaders(p);
    assert.strictEqual(h.origin, 'human');
    assert.strictEqual(h.reviewed, 'true');
    assert.strictEqual(h.generator, null);
    cleanup();
  });

  it('parses HTML-style comments', () => {
    setup();
    const p = writeTemp('page.html', [
      '<!-- AI-Provenance-Origin: ai -->',
      '<!-- AI-Provenance-Generator: copilot -->',
      '<!-- AI-Provenance-Reviewed: false -->',
      '<html></html>',
    ].join('\n'));

    const h = parseHeaders(p);
    assert.strictEqual(h.origin, 'ai');
    assert.strictEqual(h.generator, 'copilot');
    assert.strictEqual(h.reviewed, 'false');
    cleanup();
  });

  it('parses CSS-style comments', () => {
    setup();
    const p = writeTemp('style.css', [
      '/* AI-Provenance-Origin: mixed */',
      '/* AI-Provenance-Reviewed: partial */',
      'body { color: red; }',
    ].join('\n'));

    const h = parseHeaders(p);
    assert.strictEqual(h.origin, 'mixed');
    assert.strictEqual(h.reviewed, 'partial');
    cleanup();
  });

  it('returns null for binary files', () => {
    setup();
    const p = writeTemp('image.png', 'fake binary');
    const h = parseHeaders(p);
    assert.strictEqual(h, null);
    cleanup();
  });

  it('returns null for non-existent files', () => {
    const h = parseHeaders('/tmp/does-not-exist-12345.js');
    assert.strictEqual(h, null);
  });

  it('only reads first 20 lines', () => {
    setup();
    const lines = Array(25).fill('// some comment');
    lines[21] = '// AI-Provenance-Origin: ai';
    const p = writeTemp('deep.js', lines.join('\n'));
    const h = parseHeaders(p);
    assert.strictEqual(h.origin, 'unknown');
    cleanup();
  });

  it('ignores invalid keys', () => {
    setup();
    const p = writeTemp('invalid.js', [
      '// AI-Provenance-Origin: ai',
      '// AI-Provenance-FakeKey: something',
      '// AI-Provenance-Reviewed: true',
    ].join('\n'));

    const h = parseHeaders(p);
    assert.strictEqual(h.origin, 'ai');
    assert.strictEqual(h.reviewed, 'true');
    assert.ok(!('fakekey' in h));
    cleanup();
  });
});
