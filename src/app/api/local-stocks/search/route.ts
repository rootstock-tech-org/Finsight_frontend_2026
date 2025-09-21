import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type CsvRow = {
  exchange: string;
  trading_symbol: string;
  groww_symbol: string;
  name: string;
  series: string;
  isin: string;
  exchange_token: string;
};

// Module-level cache (persists across requests in the same serverless instance)
let CSV_CACHE: { rows: CsvRow[]; loadedAt: number } | null = null;

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0].split(',');
  const getIdx = (key: string) => header.indexOf(key);

  const idx = {
    exchange: getIdx('exchange'),
    trading_symbol: getIdx('trading_symbol'),
    groww_symbol: getIdx('groww_symbol'),
    name: getIdx('name'),
    series: getIdx('series'),
    isin: getIdx('isin'),
    exchange_token: getIdx('exchange_token')
  };

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(',');
    // Guard against malformed rows
    if (cols.length < header.length) continue;
    rows.push({
      exchange: cols[idx.exchange] || '',
      trading_symbol: cols[idx.trading_symbol] || '',
      groww_symbol: cols[idx.groww_symbol] || '',
      name: cols[idx.name] || '',
      series: cols[idx.series] || '',
      isin: cols[idx.isin] || '',
      exchange_token: cols[idx.exchange_token] || ''
    });
  }
  return rows;
}

function ensureLoaded(): CsvRow[] {
  if (CSV_CACHE) return CSV_CACHE.rows;
  const csvPath = path.join(process.cwd(), 'groww_all_stocks.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(content);
  // Deduplicate by trading_symbol; prefer NSE and series EQ
  const bestBySymbol = new Map<string, CsvRow>();
  for (const row of rows) {
    const key = row.trading_symbol?.trim();
    if (!key) continue;
    const existing = bestBySymbol.get(key);
    if (!existing) {
      bestBySymbol.set(key, row);
      continue;
    }
    const score = (r: CsvRow) => (r.exchange === 'NSE' ? 2 : 0) + (r.series === 'EQ' ? 1 : 0);
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
        const symbol = r.trading_symbol || '';
        const name = r.name || '';
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
      .sort((a, b) => b.score - a.score || a.r.trading_symbol.localeCompare(b.r.trading_symbol))
      .slice(0, limit)
      .map(x => ({
        symbol: x.r.trading_symbol,
        name: x.r.name || x.r.trading_symbol,
        exchange: x.r.exchange,
        series: x.r.series,
        isin: x.r.isin
      }));

    return NextResponse.json({ results: scored });
  } catch (error) {
    console.error('Local CSV search error:', error);
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}


