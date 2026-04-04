// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: true
// AI-Provenance-Tested: true

export function jsonReport(result) {
  return JSON.stringify(result, null, 2);
}

export function printReport({ summary }) {
  const { total, ai, human, mixed, unknown, reviewed, tested } = summary;

  console.log('');
  console.log('AI-Provenance Scan');
  console.log('==================');
  console.log(`Total files scanned:  ${total}`);
  console.log(`AI-generated:         ${ai}`);
  console.log(`Human-written:        ${human}`);
  console.log(`Mixed:                ${mixed}`);
  console.log(`Unknown (no header):  ${unknown}`);

  if (ai > 0) {
    const reviewedPct = Math.round((reviewed / ai) * 100);
    const testedPct = Math.round((tested / ai) * 100);
    console.log('');
    console.log('Of AI files:');
    console.log(`  Reviewed:  ${reviewed} / ${ai}  (${reviewedPct}%)`);
    console.log(`  Tested:    ${tested} / ${ai}  (${testedPct}%)`);
  }

  console.log('');
}
