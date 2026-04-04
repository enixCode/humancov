// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { readFileSync } from 'node:fs';
import { getCommentPrefixes } from './comments.js';

const HEADER_RE = /^AI-Provenance-(\w+):\s*(.+)$/;

const VALID_KEYS = new Set([
  'origin', 'generator', 'reviewed', 'tested', 'confidence', 'notes',
]);

export function parseHeaders(filePath) {
  const prefixes = getCommentPrefixes(filePath);
  if (!prefixes) return null; // binary file

  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }

  const lines = content.split(/\r\n|\r|\n/).slice(0, 20);
  const headers = {};

  for (const line of lines) {
    const trimmed = line.trim();
    for (const prefix of prefixes) {
      if (!trimmed.startsWith(prefix)) continue;

      let value = trimmed.slice(prefix.length).trim();
      // Strip closing comment markers
      if (prefix === '<!--') value = value.replace(/-->\s*$/, '').trim();
      if (prefix === '/*') value = value.replace(/\*\/\s*$/, '').trim();

      const match = value.match(HEADER_RE);
      if (match) {
        const key = match[1].toLowerCase();
        if (VALID_KEYS.has(key)) {
          headers[key] = match[2].trim().toLowerCase();
        }
      }
    }
  }

  if (Object.keys(headers).length === 0) {
    return { origin: 'unknown', reviewed: 'unknown' };
  }

  return {
    origin: headers.origin || 'unknown',
    generator: headers.generator || null,
    reviewed: headers.reviewed || 'unknown',
    tested: headers.tested || null,
    confidence: headers.confidence || null,
    notes: headers.notes || null,
  };
}
