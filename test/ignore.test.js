// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadIgnore } from '../src/ignore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, '..', '.test-tmp-ignore');

function setup() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
}

function cleanup() {
  rmSync(TMP, { recursive: true, force: true });
}

describe('loadIgnore', () => {
  it('ignores default patterns', () => {
    setup();
    const ig = loadIgnore(TMP);
    assert.ok(ig.ignores('node_modules/foo.js'));
    assert.ok(ig.ignores('.git/config'));
    assert.ok(ig.ignores('.humancov'));
    assert.ok(ig.ignores('README.md'));
    assert.ok(ig.ignores('package-lock.lock'));
    assert.ok(ig.ignores('LICENSE'));
    assert.ok(ig.ignores('.gitignore'));
    assert.ok(ig.ignores('.github/workflows/ci.yml'));
    cleanup();
  });

  it('does not ignore source files by default', () => {
    setup();
    const ig = loadIgnore(TMP);
    assert.ok(!ig.ignores('src/parser.js'));
    assert.ok(!ig.ignores('bin/humancov.js'));
    assert.ok(!ig.ignores('index.html'));
    cleanup();
  });

  it('loads custom ignore file', () => {
    setup();
    writeFileSync(join(TMP, '.humancov-ignore'), '*.test.js\ndist/\n', 'utf8');
    const ig = loadIgnore(TMP);
    assert.ok(ig.ignores('foo.test.js'));
    assert.ok(ig.ignores('dist/bundle.js'));
    // defaults still apply
    assert.ok(ig.ignores('node_modules/foo.js'));
    cleanup();
  });

  it('works without custom ignore file', () => {
    setup();
    const ig = loadIgnore(TMP);
    // should not throw, just use defaults
    assert.ok(ig.ignores('node_modules/x'));
    assert.ok(!ig.ignores('src/app.js'));
    cleanup();
  });
});
