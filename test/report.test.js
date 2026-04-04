// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jsonReport } from '../src/report.js';

describe('jsonReport', () => {
  it('returns valid JSON string', () => {
    const input = {
      files: [{ file: 'a.js', origin: 'ai', reviewed: 'true' }],
      summary: { total: 1, ai: 1, human: 0, mixed: 0, unknown: 0, reviewed: 1, tested: 0 },
    };
    const output = JSON.parse(jsonReport(input));
    assert.strictEqual(output.files.length, 1);
    assert.strictEqual(output.summary.total, 1);
    assert.strictEqual(output.summary.ai, 1);
  });

  it('preserves all summary fields', () => {
    const input = {
      files: [],
      summary: { total: 10, ai: 5, human: 3, mixed: 1, unknown: 1, reviewed: 2, tested: 3 },
    };
    const output = JSON.parse(jsonReport(input));
    assert.deepStrictEqual(output.summary, input.summary);
  });

  it('preserves file details', () => {
    const file = {
      file: 'src/app.js',
      origin: 'ai',
      generator: 'claude-code',
      reviewed: 'false',
      tested: 'true',
      confidence: 'high',
      notes: null,
    };
    const input = {
      files: [file],
      summary: { total: 1, ai: 1, human: 0, mixed: 0, unknown: 0, reviewed: 0, tested: 1 },
    };
    const output = JSON.parse(jsonReport(input));
    assert.deepStrictEqual(output.files[0], file);
  });
});
