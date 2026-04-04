// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateBadgeUrl, jsonBadge } from '../src/badge.js';

function makeScanResult(ai, reviewed) {
  return { summary: { ai, reviewed }, files: [] };
}

describe('generateBadgeUrl', () => {
  it('returns red for 0% reviewed', () => {
    const url = generateBadgeUrl(makeScanResult(10, 0));
    assert.ok(url.includes('-red'));
    assert.ok(url.includes('0%25'));
  });

  it('returns yellow for 25% reviewed', () => {
    const url = generateBadgeUrl(makeScanResult(4, 1));
    assert.ok(url.includes('-yellow'));
  });

  it('returns green for 75% reviewed', () => {
    const url = generateBadgeUrl(makeScanResult(4, 3));
    assert.ok(url.includes('-green'));
    assert.ok(!url.includes('brightgreen'));
  });

  it('returns brightgreen for 100% reviewed', () => {
    const url = generateBadgeUrl(makeScanResult(5, 5));
    assert.ok(url.includes('-brightgreen'));
  });

  it('returns lightgrey for no AI files', () => {
    const url = generateBadgeUrl(makeScanResult(0, 0));
    assert.ok(url.includes('lightgrey'));
    assert.ok(url.includes('no%20AI%20files'));
  });

  it('generates valid shields.io URL', () => {
    const url = generateBadgeUrl(makeScanResult(10, 5));
    assert.ok(url.startsWith('https://img.shields.io/badge/'));
    assert.ok(url.includes('human--reviewed'));
  });
});

describe('jsonBadge', () => {
  it('returns valid JSON with all fields', () => {
    const result = JSON.parse(jsonBadge(makeScanResult(10, 5)));
    assert.strictEqual(result.percentage, 50);
    assert.strictEqual(result.color, 'yellow');
    assert.ok(result.url.startsWith('https://'));
    assert.ok(result.markdown.startsWith('![Human Reviewed]'));
  });

  it('returns 100% when no AI files', () => {
    const result = JSON.parse(jsonBadge(makeScanResult(0, 0)));
    assert.strictEqual(result.percentage, 100);
  });
});
