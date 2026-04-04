// AI-Provenance-Origin: ai
// AI-Provenance-Generator: claude-code
// AI-Provenance-Reviewed: false
// AI-Provenance-Tested: false

const COMMENT_PREFIXES = {
  // C-style single line
  '.js': ['//'], '.ts': ['//'], '.jsx': ['//'], '.tsx': ['//'],
  '.java': ['//'], '.c': ['//'], '.cpp': ['//'], '.h': ['//'],
  '.cs': ['//'], '.go': ['//'], '.rs': ['//'], '.swift': ['//'],
  '.kt': ['//'], '.scala': ['//'], '.groovy': ['//'],
  '.dart': ['//'], '.php': ['//'],
  // Hash-style
  '.py': ['#'], '.rb': ['#'], '.sh': ['#'], '.bash': ['#'],
  '.zsh': ['#'], '.yml': ['#'], '.yaml': ['#'], '.toml': ['#'],
  '.pl': ['#'], '.r': ['#'], '.ps1': ['#'], '.dockerfile': ['#'],
  '.tf': ['#'], '.cfg': ['#'], '.ini': ['#'], '.conf': ['#'],
  // HTML/XML
  '.html': ['<!--'], '.xml': ['<!--'], '.svg': ['<!--'],
  '.vue': ['<!--', '//'], '.svelte': ['<!--', '//'], '.md': ['<!--'],
  // CSS
  '.css': ['/*'], '.scss': ['/*', '//'], '.less': ['/*'],
  // SQL / Lua
  '.sql': ['--'], '.lua': ['--'], '.hs': ['--'], '.elm': ['--'],
};

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.wasm',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.mp3', '.mp4', '.wav', '.avi', '.mov',
  '.lock',
]);

export function getCommentPrefixes(filePath) {
  const ext = filePath.includes('.')
    ? '.' + filePath.split('.').pop().toLowerCase()
    : '';

  if (BINARY_EXTENSIONS.has(ext)) return null;

  // Special case: Dockerfile without extension
  const basename = filePath.split(/[/\\]/).pop();
  if (basename === 'Dockerfile' || basename === 'Makefile') return ['#'];

  return COMMENT_PREFIXES[ext] || ['#'];
}
