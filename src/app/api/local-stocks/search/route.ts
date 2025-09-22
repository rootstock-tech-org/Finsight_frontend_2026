import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type CsvRow = {
  TckrSymb: string; // symbol
  FinInstrmNm: string; // name
  Industry: string; // sector/industry
  exchange: string; // NSE/BSE
};

// Module-level cache (persists across requests in the same serverless instance)
let CSV_CACHE: { rows: CsvRow[]; loadedAt: number } | null = null;

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0].split(',');
  const getIdx = (key: string) => header.indexOf(key);

  const idx = {
    TckrSymb: getIdx('TckrSymb'),
    FinInstrmNm: getIdx('FinInstrmNm'),
    Industry: getIdx('Industry'),
    exchange: getIdx('exchange')
  };

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(',');
    // Guard against malformed rows
    if (cols.length < header.length) continue;
    rows.push({
      TckrSymb: cols[idx.TckrSymb] || '',
      FinInstrmNm: cols[idx.FinInstrmNm] || '',
      Industry: cols[idx.Industry] || '',
      exchange: cols[idx.exchange] || ''
    });
  }
  return rows;
}

function ensureLoaded(): CsvRow[] {
  if (CSV_CACHE) return CSV_CACHE.rows;
  const csvPath = path.join(process.cwd(), 'nse_bse_filtered.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(content);
  // Deduplicate by symbol; prefer NSE over others
  const bestBySymbol = new Map<string, CsvRow>();
  for (const row of rows) {
    const key = row.TckrSymb?.trim();
    if (!key) continue;
    const existing = bestBySymbol.get(key);
    if (!existing) {
      bestBySymbol.set(key, row);
      continue;
    }
    const score = (r: CsvRow) => (r.exchange === 'NSE' ? 1 : 0);
    if (score(row) > score(existing)) bestBySymbol.set(key, row);
  }
  const deduped = Array.from(bestBySymbol.values());
  CSV_CACHE = { rows: deduped, loadedAt: Date.now() };
  return CSV_CACHE.rows;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const rows = ensureLoaded();
    const q = query.toLowerCase();

    // Basic ranking: startsWith > includes; prefer NSE/EQ already handled in dedupe
    const scored = rows
      .map(r => {
        const symbol = r.TckrSymb || '';
        const name = r.FinInstrmNm || '';
        const symbolLc = symbol.toLowerCase();
        const nameLc = name.toLowerCase();
        let score = -1;
        if (symbolLc.startsWith(q)) score = 3;
        else if (nameLc.startsWith(q)) score = 2;
        else if (symbolLc.includes(q)) score = 1;
        else if (nameLc.includes(q)) score = 0;
        return { r, score };
      })
      .filter(x => x.score >= 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aKey = (a.r.TckrSymb || a.r.FinInstrmNm || '').toString();
        const bKey = (b.r.TckrSymb || b.r.FinInstrmNm || '').toString();
        return aKey.localeCompare(bKey);
      })
      .slice(0, limit)
      .map(x => ({
        symbol: x.r.TckrSymb,
        name: x.r.FinInstrmNm || x.r.TckrSymb,
        exchange: x.r.exchange,
        sector: x.r.Industry || 'Unknown'
      }));

    return NextResponse.json({ results: scored });
  } catch (error) {
    console.error('Local CSV search error:', error);
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}


