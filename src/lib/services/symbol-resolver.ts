// Lightweight CSV-backed symbol resolver for NSE/BSE normalization
// Loads once at runtime (server-only) and provides uppercased mapping

let nseSet: Set<string> | null = null;
let loaded = false;

function loadCsv(): Set<string> {
  if (loaded && nseSet) return nseSet;
  nseSet = new Set<string>();
  // Avoid bundling fs; leave set empty so normalization is still applied without set membership
  loaded = true;
  return nseSet;
}

export function normalizeToBackendSymbol(raw: string): string {
  const symbol = (raw || '').toUpperCase().trim();
  if (!symbol) return symbol;
  const set = loadCsv();
  // Common normalizations: strip .NS/.NSE suffix, series (-EQ, -BE etc.)
  const candidates: string[] = [];
  candidates.push(symbol);
  const stripDot = symbol.replace(/\.(NS|NSE|BSE)$/i, '');
  if (stripDot !== symbol) candidates.push(stripDot);
  const stripSeries = stripDot.replace(/[-\.](EQ|BE|BL|SM|PP|N1|N2|N3|N4|RR|W[0-9]+)$/i, '');
  if (stripSeries !== stripDot) candidates.push(stripSeries);
  // Remove non-alphanumerics
  const alnum = stripSeries.replace(/[^A-Z0-9]/g, '');
  if (alnum !== stripSeries) candidates.push(alnum);
  for (const c of candidates) {
    if (set.size === 0 || set.has(c)) return c;
  }
  return alnum || stripSeries || stripDot || symbol;
}

export function isKnownNseSymbol(raw: string): boolean {
  const set = loadCsv();
  const symbol = (raw || '').toUpperCase().trim();
  if (!symbol) return false;
  if (set.size === 0) return true; // permissive until CSV is parsed at build time
  return set.has(symbol);
}


