import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { externalStockApi } from '@/lib/services/external-stock-api';
import { createAdminClient, createServerClient } from '@/lib/supabase';

// Initialize Supabase only when credentials are present (local dev may not have service key)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;
const supabaseAnon = supabaseUrl
  ? createServerClient()
  : null;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const upper = symbol.toUpperCase();
    const STALE_MS = 5 * 60 * 1000; // 5 minutes

    // 1) Try cached price first; if fresh, return immediately
    let cached: any = null;
    if (supabaseAnon) {
      try {
        const { data } = await supabaseAnon
          .from('stocks')
          .select('symbol, company_name, current_price, price_change_percent, volume, market_cap, last_updated')
          .eq('symbol', upper)
          .single();
        cached = data || null;
        const lastUpdatedMs = cached?.last_updated ? Date.parse(cached.last_updated) : 0;
        const isFresh = cached && typeof cached.current_price === 'number' && Date.now() - lastUpdatedMs <= STALE_MS;
        if (isFresh) {
          return NextResponse.json({
            symbol: upper,
            last_price: cached.current_price,
            day_change: 0,
            day_change_perc: cached.price_change_percent || 0,
            volume: cached.volume || 0,
            market_cap: cached.market_cap || null,
            cached: true
          });
        }
      } catch (_) {}
    }

    // 2) Fetch live price from external provider (guard errors)
    let price: any;
    try {
      price = await externalStockApi.getStockPrice(upper);
    } catch (e) {
      console.warn('External price fetch failed:', e);
      // Attempt cached fallback before failing
      if (cached && typeof cached.current_price === 'number') {
        return NextResponse.json({
          symbol: upper,
          last_price: cached.current_price,
          day_change: 0,
          day_change_perc: cached.price_change_percent || 0,
          volume: cached.volume || 0,
          market_cap: cached.market_cap || null,
          cached: true
        });
      }
      // Return soft failure to avoid 5xx on UI
      return NextResponse.json({ error: 'Price not available', symbol: upper, last_price: null }, { status: 200 });
    }
    if (!price || price.last_price == null) {
      // fallback to last known price from stocks table
      if (cached && typeof cached.current_price === 'number') {
        return NextResponse.json({
          symbol: upper,
          last_price: cached.current_price,
          day_change: 0,
          day_change_perc: cached.price_change_percent || 0,
          volume: cached.volume || 0,
          market_cap: cached.market_cap || null,
          cached: true
        });
      }
      return NextResponse.json({ error: 'Price not available', symbol: upper, last_price: null }, { status: 200 });
    }

    // Upsert into stocks table for persistence
    const stockPayload = {
      symbol: upper,
      company_name: upper,
      current_price: price.last_price,
      last_price: price.last_price,
      price_change: price.change || 0,
      price_change_percent: price.change_percent || 0,
      volume: price.volume || 0,
      market_cap: price.market_cap || null,
      last_updated: new Date().toISOString(),
      source: 'external'
    } as any;

    if (supabase) {
      try {
        await supabase
          .from('stocks')
          .upsert(stockPayload);
      } catch (e) {
        console.warn('Stocks upsert failed (continuing without persistence):', e);
      }
    }

    return NextResponse.json({
      symbol: upper,
      last_price: price.last_price,
      day_change: price.change || 0,
      day_change_perc: price.change_percent || 0,
      volume: price.volume || 0,
      market_cap: price.market_cap || null
    });
  } catch (error) {
    console.error('Price endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


