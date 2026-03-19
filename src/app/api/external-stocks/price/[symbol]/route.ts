import { NextRequest, NextResponse } from 'next/server';
import { normalizeToBackendSymbol } from '@/lib/services/symbol-resolver';

// Allow failover across multiple proxy hosts
const RUNPOD_HOSTS = (
  process.env.RUNPOD_PROXY_HOSTS ||
  'https://e9cwq4w7punvx7-1003.proxy.runpod.net,https://e9cwq4w7punvx7-1004.proxy.runpod.net'
).split(',').map(s => s.trim()).filter(Boolean);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const norm = normalizeToBackendSymbol(symbol);

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    // Try each host with a strict 2.5s timeout (overall ~5s max)
    let lastErr: any = null;
    for (const host of RUNPOD_HOSTS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      try {
        const response = await fetch(`${host}/api/stock/${encodeURIComponent(norm)}/price`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
        if (response.status === 404) {
          // Symbol not found in external provider; do not treat this as internal or timeout error.
          return NextResponse.json({ error: 'Symbol not found' }, { status: 404 });
        }
        lastErr = new Error(`External API error: ${response.status}`);
      } catch (e) {
        lastErr = e;
      }
    }

    // If all hosts failed
    if (lastErr instanceof Error && lastErr.name === 'AbortError') {
      console.warn('Timeout fetching external price from all hosts');
      return NextResponse.json(
        { error: 'Upstream price provider timeout' },
        { status: 504 }
      );
    }
    throw lastErr || new Error('Failed to fetch from all hosts');
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Timeout fetching external price (3s)');
      return NextResponse.json(
        { error: 'Upstream price provider timeout' },
        { status: 504 }
      );
    }
    console.error(`Error fetching price for symbol:`, error);
    return NextResponse.json(
      { error: `Failed to fetch price for symbol` },
      { status: 500 }
    );
  }
}
