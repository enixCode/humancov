// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateManifest } from '../src/manifest.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, '..', '.test-tmp-manifest');

function setup() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
}

function cleanup() {
  rmSync(TMP, { recursive: true, force: true });
}

describe('generateManifest', () => {
  it('writes .humancov file with correct entries', () => {
    setup();
    const scanResult = {
      files: [
        { file: 'src/app.js', origin: 'ai', generator: 'claude-code', reviewed: 'true', tested: 'true', confidence: 'high' },
        { file: 'src/util.js', origin: 'human', generator: null, reviewed: 'true', tested: null, confidence: null },
      ],
      summary: {},
    };

    generateManifest(scanResult, TMP);
    const content = readFileSync(join(TMP, '.humancov'), 'utf8');
    assert.ok(content.includes('src/app.js'));
    assert.ok(content.includes('src/util.js'));
    assert.ok(content.includes('claude-code'));
    assert.ok(content.includes('high'));
    cleanup();
  });

  it('skips unknown origin files', () => {
    setup();
    const scanResult = {
      files: [
        { file: 'known.js', origin: 'ai', generator: 'copilot', reviewed: 'false', tested: null, confidence: null },
        { file: 'unknown.js', origin: 'unknown', reviewed: 'unknown' },
      ],
      summary: {},
    };

    generateManifest(scanResult, TMP);
    const content = readFileSync(join(TMP, '.humancov'), 'utf8');
    assert.ok(content.includes('known.js'));
    assert.ok(!content.includes('unknown.js'));
    cleanup();
  });

  it('sorts entries alphabetically', () => {
    setup();
    const scanResult = {
      files: [
        { file: 'z.js', origin: 'ai', generator: null, reviewed: 'false', tested: null, confidence: null },
        { file: 'a.js', origin: 'human', generator: null, reviewed: 'true', tested: null, confidence: null },
      ],
      summary: {},
    };

    generateManifest(scanResult, TMP);
    const content = readFileSync(join(TMP, '.humancov'), 'utf8');
    const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim());
    assert.ok(lines[0].startsWith('a.js'));
    assert.ok(lines[1].startsWith('z.js'));
    cleanup();
  });

  it('uses - for missing fields', () => {
    setup();
    const scanResult = {
      files: [
        { file: 'app.js', origin: 'ai', generator: null, reviewed: 'false', tested: null, confidence: null },
      ],
      summary: {},
    };

    generateManifest(scanResult, TMP);
    const content = readFileSync(join(TMP, '.humancov'), 'utf8');
    const dataLine = content.split('\n').find(l => l.startsWith('app.js'));
    // null fields should be replaced with -
    assert.ok(dataLine.includes('-'));
    cleanup();
  });
});
