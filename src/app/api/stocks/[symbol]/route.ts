import { NextRequest, NextResponse } from 'next/server';
import { externalStockApi } from '@/lib/services/external-stock-api';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

async function getStockFromFastAPI(symbol: string): Promise<any | null> {
  try {
    const res = await fetch(`${FASTAPI}/stocks/${symbol}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function upsertStockInFastAPI(payload: any): Promise<void> {
  await fetch(`${FASTAPI}/stocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const useExternal = searchParams.get('external') === 'true';
    const refreshPrice = searchParams.get('refresh') === 'true';

    let stock = await getStockFromFastAPI(symbol);
    let externalPriceData = null;

    if (useExternal || !stock || refreshPrice) {
      try {
        externalPriceData = await externalStockApi.getStockPrice(symbol);

        if (externalPriceData?.last_price != null) {
          const payload = {
            symbol: symbol.toUpperCase(),
            company_name: stock?.company_name ?? symbol.toUpperCase(),
            current_price: externalPriceData.last_price,
            price_change: externalPriceData.change ?? 0,
            price_change_percent: externalPriceData.change_percent ?? 0,
            volume: externalPriceData.volume ?? 0,
            market_cap: externalPriceData.market_cap ?? null,
            last_updated: new Date().toISOString(),
            source: 'external',
          };
          await upsertStockInFastAPI(payload);
          stock = { ...stock, ...payload };
        }
      } catch (externalError) {
        console.error('External API error for', symbol, ':', externalError);
      }
    }

    if (!stock) return NextResponse.json({ error: 'Stock not found' }, { status: 404 });

    // Fetch related data from FastAPI
    const [marketDataRes, newsRes] = await Promise.allSettled([
      fetch(`${FASTAPI}/market-data?symbol=${symbol}&limit=30`),
      fetch(`${FASTAPI}/news?symbol=${symbol}&limit=10`),
    ]);

    const marketData = marketDataRes.status === 'fulfilled' && marketDataRes.value.ok
      ? (await marketDataRes.value.json()).market_data ?? []
      : [];
    const news = newsRes.status === 'fulfilled' && newsRes.value.ok
      ? (await newsRes.value.json()).news ?? []
      : [];

    return NextResponse.json({
      stock,
      externalPriceData,
      marketData,
      news,
      source: externalPriceData ? 'external' : 'database',
    });
  } catch (error) {
    console.error('GET /api/stocks/[symbol] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const body = await request.json();

    const res = await fetch(`${FASTAPI}/stocks/${symbol}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, last_updated: new Date().toISOString() }),
    });

    if (!res.ok) return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
    const data = await res.json();
    return NextResponse.json({ stock: data });
  } catch (error) {
    console.error('PUT /api/stocks/[symbol] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}