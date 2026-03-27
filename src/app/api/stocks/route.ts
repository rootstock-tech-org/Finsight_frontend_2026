import { NextRequest, NextResponse } from 'next/server';
import { externalStockApi } from '@/lib/services/external-stock-api';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') ?? '';
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search') ?? '';
    const useExternal = searchParams.get('external') === 'true';

    // External search path
    if (useExternal && search) {
      try {
        const { searchResults, prices } = await externalStockApi.searchAndGetPrice(search);
        const combined = searchResults.map((r, i) => ({
          symbol: r.symbol,
          company_name: r.name,
          sector: r.sector ?? 'Unknown',
          industry: r.industry ?? 'Unknown',
          exchange: r.exchange ?? 'Unknown',
          current_price: prices[i]?.last_price ?? null,
          last_price: prices[i]?.last_price ?? null,
          change_percent: prices[i]?.change_percent ?? null,
          volume: prices[i]?.volume ?? null,
          market_cap: prices[i]?.market_cap ?? null,
          last_updated: new Date().toISOString(),
          source: 'external',
        }));
        return NextResponse.json({
          stocks: combined.slice(offset, offset + limit),
          total: combined.length,
          limit, offset, source: 'external',
        });
      } catch (externalError) {
        console.error('External API error:', externalError);
        // fall through to FastAPI
      }
    }

    // FastAPI database search
    const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
    if (symbol) params.set('symbol', symbol);
    if (search) params.set('search', search);

    const res = await fetch(`${FASTAPI}/stocks?${params}`);
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 });
    const data = await res.json();

    return NextResponse.json({
      stocks: data.stocks ?? data ?? [],
      total: data.total ?? 0,
      limit, offset, source: 'database',
    });
  } catch (error) {
    console.error('GET /api/stocks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.symbol || !body.company_name) {
      return NextResponse.json({ error: 'Symbol and company name are required' }, { status: 400 });
    }

    const res = await fetch(`${FASTAPI}/stocks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ ...body, last_updated: new Date().toISOString() }),
    });

    if (!res.ok) return NextResponse.json({ error: 'Failed to create/update stock' }, { status: 500 });
    const data = await res.json();
    return NextResponse.json({ stock: data });
  } catch (error) {
    console.error('POST /api/stocks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}