// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInit } from '../src/init.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TMP = join(__dirname, '..', '.test-tmp-init');

function setup() {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
}

function cleanup() {
  rmSync(TMP, { recursive: true, force: true });
}

describe('runInit', () => {
  it('appends instructions to existing CLAUDE.md', () => {
    setup();
    writeFileSync(join(TMP, 'CLAUDE.md'), '# My project\n');
    runInit(TMP);
    const content = readFileSync(join(TMP, 'CLAUDE.md'), 'utf8');
    assert.ok(content.includes('AI-Provenance-Origin'));
    assert.ok(content.includes('claude-code'));
    cleanup();
  });

  it('appends instructions to existing AGENTS.md', () => {
    setup();
    writeFileSync(join(TMP, 'AGENTS.md'), '# Agents\n');
    runInit(TMP);
    const content = readFileSync(join(TMP, 'AGENTS.md'), 'utf8');
    assert.ok(content.includes('AI-Provenance-Origin'));
    assert.ok(content.includes('agents-md'));
    cleanup();
  });

  it('skips files that already contain AI-Provenance', () => {
    setup();
    writeFileSync(join(TMP, 'CLAUDE.md'), '# My project\nAI-Provenance-Origin: ai\n');
    runInit(TMP);
    const content = readFileSync(join(TMP, 'CLAUDE.md'), 'utf8');
    const matches = content.match(/AI-Provenance-Origin/g) || [];
    assert.equal(matches.length, 1);
    cleanup();
  });

  it('does not create files that do not exist (for append-only configs)', () => {
    setup();
    runInit(TMP);
    assert.ok(!existsSync(join(TMP, 'CLAUDE.md')));
    assert.ok(!existsSync(join(TMP, 'AGENTS.md')));
    assert.ok(!existsSync(join(TMP, '.cursorrules')));
    cleanup();
  });

  it('creates .cursor/rules/humancov.mdc when .cursor/rules dir exists', () => {
    setup();
    mkdirSync(join(TMP, '.cursor', 'rules'), { recursive: true });
    runInit(TMP);
    const filePath = join(TMP, '.cursor', 'rules', 'humancov.mdc');
    assert.ok(existsSync(filePath));
    const content = readFileSync(filePath, 'utf8');
    assert.ok(content.startsWith('---'));
    assert.ok(content.includes('alwaysApply: true'));
    assert.ok(content.includes('AI-Provenance-Origin'));
    cleanup();
  });

  it('creates .windsurf/rules/humancov.md when .windsurf/rules dir exists', () => {
    setup();
    mkdirSync(join(TMP, '.windsurf', 'rules'), { recursive: true });
    runInit(TMP);
    const filePath = join(TMP, '.windsurf', 'rules', 'humancov.md');
    assert.ok(existsSync(filePath));
    const content = readFileSync(filePath, 'utf8');
    assert.ok(content.includes('AI-Provenance-Origin'));
    cleanup();
  });

  it('skips rules dir files when parent dir does not exist', () => {
    setup();
    runInit(TMP);
    assert.ok(!existsSync(join(TMP, '.cursor', 'rules', 'humancov.mdc')));
    assert.ok(!existsSync(join(TMP, '.windsurf', 'rules', 'humancov.md')));
    cleanup();
  });

  it('handles multiple configs in one run', () => {
    setup();
    writeFileSync(join(TMP, 'CLAUDE.md'), '# Claude\n');
    writeFileSync(join(TMP, 'AGENTS.md'), '# Agents\n');
    writeFileSync(join(TMP, '.cursorrules'), '# Cursor legacy\n');
    mkdirSync(join(TMP, '.windsurf', 'rules'), { recursive: true });
    runInit(TMP);
    assert.ok(readFileSync(join(TMP, 'CLAUDE.md'), 'utf8').includes('AI-Provenance-Origin'));
    assert.ok(readFileSync(join(TMP, 'AGENTS.md'), 'utf8').includes('AI-Provenance-Origin'));
    assert.ok(readFileSync(join(TMP, '.cursorrules'), 'utf8').includes('AI-Provenance-Origin'));
    assert.ok(existsSync(join(TMP, '.windsurf', 'rules', 'humancov.md')));
    cleanup();
  });
});
