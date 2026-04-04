// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCommentPrefixes } from '../src/comments.js';

describe('getCommentPrefixes', () => {
  it('returns // for JS files', () => {
    assert.deepStrictEqual(getCommentPrefixes('app.js'), ['//']);
  });

  it('returns // for TS files', () => {
    assert.deepStrictEqual(getCommentPrefixes('app.ts'), ['//']);
  });

  it('returns # for Python files', () => {
    assert.deepStrictEqual(getCommentPrefixes('main.py'), ['#']);
  });

  it('returns # for YAML files', () => {
    assert.deepStrictEqual(getCommentPrefixes('config.yml'), ['#']);
    assert.deepStrictEqual(getCommentPrefixes('config.yaml'), ['#']);
  });

  it('returns <!-- for HTML files', () => {
    assert.deepStrictEqual(getCommentPrefixes('index.html'), ['<!--']);
  });

  it('returns /* for CSS files', () => {
    assert.deepStrictEqual(getCommentPrefixes('style.css'), ['/*']);
  });

  it('returns -- for SQL files', () => {
    assert.deepStrictEqual(getCommentPrefixes('query.sql'), ['--']);
  });

  it('returns multiple prefixes for Vue files', () => {
    assert.deepStrictEqual(getCommentPrefixes('app.vue'), ['<!--', '//']);
  });

  it('returns multiple prefixes for SCSS files', () => {
    assert.deepStrictEqual(getCommentPrefixes('style.scss'), ['/*', '//']);
  });

  it('returns null for binary files', () => {
    assert.strictEqual(getCommentPrefixes('image.png'), null);
    assert.strictEqual(getCommentPrefixes('font.woff2'), null);
    assert.strictEqual(getCommentPrefixes('app.exe'), null);
    assert.strictEqual(getCommentPrefixes('package-lock.lock'), null);
  });

  it('returns # for Dockerfile', () => {
    assert.deepStrictEqual(getCommentPrefixes('Dockerfile'), ['#']);
  });

  it('returns # for Makefile', () => {
    assert.deepStrictEqual(getCommentPrefixes('Makefile'), ['#']);
  });

  it('defaults to # for unknown extensions', () => {
    assert.deepStrictEqual(getCommentPrefixes('file.xyz'), ['#']);
  });

  it('handles paths with directories', () => {
    assert.deepStrictEqual(getCommentPrefixes('src/utils/helper.js'), ['//']);
    assert.deepStrictEqual(getCommentPrefixes('config/settings.py'), ['#']);
  });

  it('is case-insensitive for extensions', () => {
    assert.deepStrictEqual(getCommentPrefixes('file.JS'), ['//']);
    assert.deepStrictEqual(getCommentPrefixes('file.PY'), ['#']);
  });
});
