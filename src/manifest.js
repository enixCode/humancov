// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const COLUMNS = ['file', 'origin', 'reviewed', 'tested', 'generator', 'confidence'];

function toRow(f) {
  return [
    f.file,
    f.origin,
    f.reviewed || '-',
    f.tested || '-',
    f.generator || '-',
    f.confidence || '-',
  ];
}

export function generateManifest({ files }, rootDir) {
  const entries = files.filter(f => f.origin !== 'unknown');
  entries.sort((a, b) => a.file.localeCompare(b.file));
  const rows = entries.map(toRow);

  // Compute column widths from header + all rows
  const widths = COLUMNS.map((col, i) =>
    Math.max(col.length, ...rows.map(r => r[i].length))
  );

  const pad = (row) => row.map((val, i) => val.padEnd(widths[i])).join('   ');

  const lines = [
    '# .humancov',
    '# ' + pad(COLUMNS),
    ...rows.map(r => pad(r)),
  ];

  const outPath = join(rootDir, '.humancov');
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');

  const skipped = files.length - entries.length;
  console.log(`Manifest written to .humancov (${entries.length} entries, ${skipped} skipped as unknown)`);
}
