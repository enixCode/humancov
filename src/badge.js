// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: true
// AI-Provenance-Tested: true

function getBadgeColor(pct) {
  if (pct >= 100) return 'brightgreen';
  if (pct >= 75) return 'green';
  if (pct >= 25) return 'yellow';
  return 'red';
}

export function generateBadgeUrl({ summary }) {
  const { ai, reviewed } = summary;

  if (ai === 0) {
    return 'https://img.shields.io/badge/human--reviewed-no%20AI%20files-lightgrey';
  }

  const pct = Math.round((reviewed / ai) * 100);
  const color = getBadgeColor(pct);
  const label = `${pct}%25%20of%20AI%20files`;

  return `https://img.shields.io/badge/human--reviewed-${label}-${color}`;
}

export function jsonBadge(scanResult) {
  const { ai, reviewed } = scanResult.summary;
  const pct = ai === 0 ? 100 : Math.round((reviewed / ai) * 100);
  const url = generateBadgeUrl(scanResult);
  return JSON.stringify({
    percentage: pct,
    color: getBadgeColor(pct),
    url,
    markdown: `![Human Reviewed](${url})`,
  }, null, 2);
}

export function printBadge(scanResult) {
  const url = generateBadgeUrl(scanResult);

  console.log('');
  console.log('Badge URL:');
  console.log(url);
  console.log('');
  console.log('Markdown:');
  console.log(`![Human Reviewed](${url})`);
  console.log('');
}
