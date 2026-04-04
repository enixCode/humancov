// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const CLI = resolve(ROOT, 'bin/humancov.js');

function run(args) {
  return execSync(`node "${CLI}" ${args}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

describe('CLI', () => {
  it('scan outputs report', () => {
    const out = run('scan');
    assert.ok(out.includes('AI-Provenance Scan'));
    assert.ok(out.includes('Total files scanned'));
  });

  it('scan --json outputs valid JSON', () => {
    const out = run('scan --json');
    const data = JSON.parse(out);
    assert.ok(Array.isArray(data.files));
    assert.ok(typeof data.summary === 'object');
  });

  it('scan --badge outputs shields.io URL', () => {
    const out = run('scan --badge');
    assert.ok(out.includes('https://img.shields.io/badge/'));
  });

  it('scan --check 0 passes', () => {
    const out = run('scan --check 0');
    assert.ok(out.includes('PASS'));
  });

  it('scan --check 100 fails when not all reviewed', () => {
    try {
      run('scan --check 100');
      assert.fail('should have exited with code 1');
    } catch (err) {
      assert.ok(err.stdout.includes('FAIL') || err.stderr.includes('FAIL'));
    }
  });

  it('--help shows usage', () => {
    const out = run('--help');
    assert.ok(out.includes('humancov'));
    assert.ok(out.includes('scan'));
    assert.ok(out.includes('manifest'));
  });

  it('unknown command exits with error', () => {
    try {
      run('foobar');
      assert.fail('should have exited with code 1');
    } catch (err) {
      assert.ok(err.stderr.includes('Unknown command'));
    }
  });
});
