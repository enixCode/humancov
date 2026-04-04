// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { performance } from 'node:perf_hooks';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHeaders } from '../src/parser.js';
import { scanFiles } from '../src/scanner.js';
import { generateBadgeUrl } from '../src/badge.js';
import { loadIgnore } from '../src/ignore.js';
import { getCommentPrefixes } from '../src/comments.js';

// --- Helpers ---

function time(label, fn, iterations = 1) {
  // Warmup
  fn();

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log(`  ${label}`);
  console.log(`    avg: ${avg.toFixed(2)}ms  min: ${min.toFixed(2)}ms  max: ${max.toFixed(2)}ms  (${iterations} runs)`);
  return avg;
}

function generateTestFiles(dir, count) {
  mkdirSync(dir, { recursive: true });

  const extensions = ['.js', '.py', '.ts', '.html', '.css', '.yaml', '.sh'];
  const origins = ['ai', 'human', 'mixed'];

  for (let i = 0; i < count; i++) {
    const ext = extensions[i % extensions.length];
    const origin = origins[i % origins.length];
    const prefix = ext === '.html' ? '<!--' : ext === '.css' ? '/*' : ext === '.py' || ext === '.yaml' || ext === '.sh' ? '#' : '//';
    const suffix = ext === '.html' ? ' -->' : ext === '.css' ? ' */' : '';

    const header = [
      `${prefix} AI-Provenance-Origin: ${origin}${suffix}`,
      `${prefix} AI-Provenance-Generator: bench-tool${suffix}`,
      `${prefix} AI-Provenance-Reviewed: ${i % 2 === 0 ? 'true' : 'false'}${suffix}`,
      `${prefix} AI-Provenance-Tested: ${i % 3 === 0 ? 'true' : 'false'}${suffix}`,
      '',
      `${prefix} file ${i}${suffix}`,
    ].join('\n');

    writeFileSync(join(dir, `file_${i}${ext}`), header, 'utf8');
  }
}

// --- Benchmarks ---

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const TEMP = join(ROOT, '.bench-tmp');

function benchParser() {
  console.log('\n[Parser] parseHeaders on real project files');
  const srcFiles = [
    join(ROOT, 'src/scanner.js'),
    join(ROOT, 'src/parser.js'),
    join(ROOT, 'src/badge.js'),
    join(ROOT, 'src/comments.js'),
    join(ROOT, 'src/ignore.js'),
    join(ROOT, 'src/manifest.js'),
    join(ROOT, 'src/report.js'),
  ];

  time('7 source files', () => {
    for (const f of srcFiles) parseHeaders(f);
  }, 100);
}

function benchComments() {
  console.log('\n[Comments] getCommentPrefixes lookup');
  const paths = [
    'test.js', 'test.py', 'test.html', 'test.css', 'test.yaml',
    'test.rs', 'test.go', 'test.sql', 'test.png', 'Dockerfile',
  ];

  time('10 extensions x1000', () => {
    for (let i = 0; i < 1000; i++) {
      for (const p of paths) getCommentPrefixes(p);
    }
  }, 50);
}

function benchIgnore() {
  console.log('\n[Ignore] loadIgnore');
  time('load ignore patterns', () => {
    loadIgnore(ROOT);
  }, 100);
}

function benchBadge() {
  console.log('\n[Badge] generateBadgeUrl');
  const mockResult = {
    summary: { total: 100, ai: 80, human: 15, mixed: 5, unknown: 0, reviewed: 34, tested: 20 },
  };

  time('badge URL generation x1000', () => {
    for (let i = 0; i < 1000; i++) generateBadgeUrl(mockResult);
  }, 50);
}

function benchScanReal() {
  console.log('\n[Scanner] scanFiles on this repo');
  time('full scan', () => {
    scanFiles(ROOT);
  }, 20);
}

function benchScanScale() {
  console.log('\n[Scale] scanFiles on generated files');

  for (const count of [100, 500, 1000]) {
    const dir = join(TEMP, `scale_${count}`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });

    // Init git repo in temp dir
    execSync('git init', { cwd: dir, stdio: 'pipe' });
    execSync('git config user.email "bench@localhost"', { cwd: dir, stdio: 'pipe' });
    execSync('git config user.name "bench"', { cwd: dir, stdio: 'pipe' });
    generateTestFiles(dir, count);
    execSync('git add -A', { cwd: dir, stdio: 'pipe' });
    execSync('git commit -m "init" --no-gpg-sign', { cwd: dir, stdio: 'pipe' });

    time(`${count} files`, () => {
      scanFiles(dir);
    }, 10);

    rmSync(dir, { recursive: true, force: true });
  }
}

// --- Main ---

console.log('=== humancov performance benchmarks ===');

benchComments();
benchIgnore();
benchBadge();
benchParser();
benchScanReal();
benchScanScale();

// Cleanup
rmSync(TEMP, { recursive: true, force: true });

console.log('\n=== done ===\n');
