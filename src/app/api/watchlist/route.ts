import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { externalStockApi } from '@/lib/services/external-stock-api';

// Use service role for API routes to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Watchlist API called');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    console.log('Watchlist API - User ID:', userId);

    if (!userId) {
      console.log('No user ID provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching watchlist for user:', userId);

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Failed to fetch watchlist: ${error.message}` },
        { status: 500 }
      );
    }

    // If no items, return early
    const watchlistItems = data || [];

    // Attach cached price and metadata from stocks table to avoid N+1 price fetches on client
    let enriched = watchlistItems;
    if (watchlistItems.length > 0) {
      const symbols = Array.from(new Set(watchlistItems.map((w: any) => w.symbol).filter(Boolean)));
      if (symbols.length > 0) {
        const { data: stocksData, error: stocksError } = await supabase
          .from('stocks')
          .select('symbol, company_name, current_price, price_change_percent, sector, volume, market_cap, last_updated')
          .in('symbol', symbols);

        if (!stocksError && stocksData) {
          const symbolToStock: Record<string, any> = Object.create(null);
          for (const s of stocksData) {
            symbolToStock[s.symbol] = s;
          }

          // Determine which symbols need refreshing (missing or stale)
          const now = Date.now();
          const STALE_MS = 5 * 60 * 1000; // 5 minutes
          const needsRefresh: string[] = [];
          for (const sym of symbols) {
            const s = symbolToStock[sym];
            const lastUpdatedMs = s?.last_updated ? Date.parse(s.last_updated) : 0;
            const isMissing = !s || typeof s.current_price !== 'number' || s.current_price <= 0;
            const isStale = s && lastUpdatedMs > 0 && now - lastUpdatedMs > STALE_MS;
            if (isMissing || isStale) needsRefresh.push(sym);
          }

          // Fetch missing/stale prices in small batches with short timeouts
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
                    price_change_percent: p.day_change_perc || p.change_percent || 0,
                    sector: null,
                    volume: p.volume || 0,
                    market_cap: p.market_cap || null,
                    last_updated: new Date().toISOString()
                  };
                  upserts.push({
                    symbol: p.symbol,
                    company_name: p.symbol,
                    current_price: p.last_price,
                    price_change: p.day_change || p.change || 0,
                    price_change_percent: p.day_change_perc || p.change_percent || 0,
                    volume: p.volume || 0,
                    market_cap: p.market_cap || null,
                    last_updated: new Date().toISOString(),
                    source: 'external'
                  });
                }
              }

              if (upserts.length > 0) {
                await supabase.from('stocks').upsert(upserts);
              }
            } catch (e) {
              console.warn('Batch price refresh failed (continuing with cached data):', e);
            }
          }

          enriched = watchlistItems.map((item: any) => {
            const s = symbolToStock[item.symbol];
            return s ? {
              ...item,
              stocks: {
                symbol: s.symbol,
                company_name: s.company_name || item.company_name || item.symbol,
                current_price: typeof s.current_price === 'number' ? s.current_price : 0,
                price_change_percent: typeof s.price_change_percent === 'number' ? s.price_change_percent : 0,
                sector: s.sector || null
              }
            } : item;
          });
        }
      }
    }

    console.log('Watchlist enriched count:', enriched.length);
    return NextResponse.json({ watchlist: enriched });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, symbol, company_name, notes } = body;

    if (!user_id || !symbol) {
      return NextResponse.json(
        { error: 'User ID and symbol are required' },
        { status: 400 }
      );
    }

    // Check if already in watchlist (idempotent add)
    const { data: existing } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user_id)
      .eq('symbol', symbol)
      .single();

    if (existing) {
      // Return 200 with the existing item to avoid spamming 409s on repeated clicks
      return NextResponse.json({ item: existing }, { status: 200 });
    }

    // Check watchlist limit (max 10 items)
    const { count: watchlistCount } = await supabase
      .from('watchlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if (watchlistCount && watchlistCount >= 10) {
      return NextResponse.json(
        { 
          error: 'Watchlist limit reached. You can only add 10 stocks. Please remove one stock to add another.',
          code: 'WATCHLIST_LIMIT_REACHED'
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id,
        symbol,
        company_name,
        notes
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data?.[0] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const symbol = searchParams.get('symbol');

    if (!userId || !symbol) {
      return NextResponse.json(
        { error: 'User ID and symbol are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('symbol', symbol);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
