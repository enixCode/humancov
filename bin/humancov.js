#!/usr/bin/env node
// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: true
// AI-Provenance-Tested: true

import { resolve } from 'node:path';
import { scanFiles } from '../src/scanner.js';
import { printReport, jsonReport } from '../src/report.js';
import { generateBadgeUrl } from '../src/badge.js';
import { generateManifest } from '../src/manifest.js';
import { runInit } from '../src/init.js';

const USAGE = `
humancov - Track AI-generated vs human-written code

Usage:
  humancov scan                Scan repo and print report
  humancov scan --json         Output scan results as JSON
  humancov scan --badge        Output shields.io badge URL
  humancov scan --check <N>    Exit 1 if reviewed% < N
  humancov manifest            Generate .humancov manifest
  humancov init                Add AI-Provenance instructions to AI tool configs
`;

function getFlag(args, name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

const args = process.argv.slice(2);
const command = args[0];
const rootDir = resolve('.');

if (!command || command === '--help' || command === '-h') {
  console.log(USAGE);
  process.exit(0);
}

switch (command) {
  case 'scan': {
    const result = scanFiles(rootDir);
    const json = args.includes('--json');
    const badge = args.includes('--badge');
    const hasCheck = args.includes('--check');
    const checkVal = getFlag(args, '--check');

    if (json && badge) {
      console.error('Error: --json and --badge cannot be used together');
      process.exit(1);
    } else if (json) {
      console.log(jsonReport(result));
    } else if (badge) {
      const url = generateBadgeUrl(result);
      console.log(url);
      console.log(`![Human Reviewed](${url})`);
    } else if (hasCheck) {
      const min = Number(checkVal);
      if (checkVal === null || isNaN(min)) {
        console.error('Error: --check requires a number');
        process.exit(1);
      }
      const { ai, reviewed } = result.summary;
      const pct = ai === 0 ? 100 : Math.round((reviewed / ai) * 100);
      const pass = pct >= min;
      console.log(`Reviewed: ${pct}% (threshold: ${min}%)`);
      console.log(pass ? 'PASS' : `FAIL: ${pct}% < ${min}%`);
      if (!pass) process.exit(1);
    } else {
      printReport(result);
    }
    break;
  }

  case 'manifest': {
    const result = scanFiles(rootDir);
    generateManifest(result, rootDir);
    break;
  }

  case 'init':
    runInit(rootDir);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.log(USAGE);
    process.exit(1);
}
