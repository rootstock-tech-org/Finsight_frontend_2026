import { NextRequest, NextResponse } from 'next/server';
import { externalStockApi } from '@/lib/services/external-stock-api';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';
const STALE_MS = 5 * 60 * 1000;

function fapiHeaders(extra: Record<string, string> = {}) {
  return { 'Content-Type': 'application/json', ...extra };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const res = await fetch(`${FASTAPI}/watchlist?user_id=${userId}`, {
      headers: fapiHeaders({ Authorization: `Bearer ${userId}` }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? 'Failed to fetch watchlist' },
        { status: 500 }
      );
    }

    const data = await res.json();
    let watchlistItems: any[] = data.watchlist ?? data.items ?? data ?? [];

    // ── Enrich with price data ──────────────────────────────────────────────
    if (watchlistItems.length > 0) {
      const symbols: string[] = Array.from(
        new Set(watchlistItems.map((w: any) => w.symbol).filter(Boolean))
      );

      // Fetch cached prices from FastAPI
      const stocksRes = await fetch(
        `${FASTAPI}/stocks?symbols=${symbols.join(',')}`,
        { headers: fapiHeaders() }
      ).catch(() => null);

      const stocksData: any[] = stocksRes?.ok
        ? ((await stocksRes.json()).stocks ?? [])
        : [];

      const symbolToStock: Record<string, any> = Object.fromEntries(
        stocksData.map((s: any) => [s.symbol, s])
      );

      // Determine which symbols need refreshing
      const now = Date.now();
      const needsRefresh = symbols.filter((sym) => {
        const s = symbolToStock[sym];
        const lastMs = s?.last_updated ? Date.parse(s.last_updated) : 0;
        return !s || typeof s.current_price !== 'number' || s.current_price <= 0 || now - lastMs > STALE_MS;
      });

      if (needsRefresh.length > 0) {
        try {
          const prices = await externalStockApi.getMultipleStockPrices(needsRefresh);
          const upserts: any[] = [];

          for (const p of prices) {
            if (p && typeof p.last_price === 'number' && p.last_price > 0) {
              symbolToStock[p.symbol] = {
                symbol: p.symbol,
                company_name: p.symbol,
                current_price: p.last_price,
                price_change_percent: p.day_change_perc ?? p.change_percent ?? 0,
                last_updated: new Date().toISOString(),
              };
              upserts.push({
                symbol: p.symbol,
                company_name: p.symbol,
                current_price: p.last_price,
                price_change: p.day_change ?? p.change ?? 0,
                price_change_percent: p.day_change_perc ?? p.change_percent ?? 0,
                volume: p.volume ?? 0,
                market_cap: p.market_cap ?? null,
                last_updated: new Date().toISOString(),
                source: 'external',
              });
            }
          }

          if (upserts.length > 0) {
            fetch(`${FASTAPI}/stocks/batch`, {
              method: 'POST',
              headers: fapiHeaders(),
              body: JSON.stringify({ stocks: upserts }),
            }).catch(() => {});
          }
        } catch (e) {
          console.warn('Batch price refresh failed:', e);
        }
      }

      watchlistItems = watchlistItems.map((item: any) => {
        const s = symbolToStock[item.symbol];
        return s
          ? {
              ...item,
              stocks: {
                symbol: s.symbol,
                company_name: s.company_name ?? item.company_name ?? item.symbol,
                current_price: typeof s.current_price === 'number' ? s.current_price : 0,
                price_change_percent: typeof s.price_change_percent === 'number' ? s.price_change_percent : 0,
                sector: s.sector ?? null,
              },
            }
          : item;
      });
    }

    return NextResponse.json({ watchlist: watchlistItems });
  } catch (error) {
    console.error('GET /api/watchlist error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, symbol, company_name, notes } = body;
    if (!user_id || !symbol) {
      return NextResponse.json({ error: 'User ID and symbol are required' }, { status: 400 });
    }

    const res = await fetch(`${FASTAPI}/watchlist`, {
      method: 'POST',
      headers: fapiHeaders({ Authorization: `Bearer ${user_id}` }),
      body: JSON.stringify({ user_id, symbol, company_name, notes }),
    });

    if (res.status === 409) {
      // Already exists — fetch and return existing item
      const existing = await fetch(
        `${FASTAPI}/watchlist?user_id=${user_id}&symbol=${symbol}`,
        { headers: fapiHeaders({ Authorization: `Bearer ${user_id}` }) }
      );
      const data = await existing.json().catch(() => ({}));
      return NextResponse.json({ item: data.item ?? data }, { status: 200 });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const isLimit = err.code === 'WATCHLIST_LIMIT_REACHED' || res.status === 400;
      return NextResponse.json(
        { error: err.detail ?? err.error ?? 'Failed to add to watchlist', code: err.code },
        { status: isLimit ? 400 : 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('POST /api/watchlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const symbol = searchParams.get('symbol');

    if (!userId || !symbol) {
      return NextResponse.json({ error: 'User ID and symbol are required' }, { status: 400 });
    }

    const res = await fetch(
      `${FASTAPI}/watchlist?user_id=${userId}&symbol=${symbol}`,
      { method: 'DELETE', headers: fapiHeaders({ Authorization: `Bearer ${userId}` }) }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/watchlist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}