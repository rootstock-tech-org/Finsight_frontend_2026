import { NextRequest, NextResponse } from 'next/server';
import { externalStockApi } from '@/lib/services/external-stock-api';
import { normalizeToBackendSymbol } from '@/lib/services/symbol-resolver';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const upper = normalizeToBackendSymbol(symbol);
    const STALE_MS = 5 * 60 * 1000; // 5 minutes

    // 1) Try cached price first; if fresh, return immediately
    // Supabase has been removed, so caching in DB is disabled.
    let cached: any = null;

    // 2) Fetch live price from external provider (no mock/hardcoded fallback)
    let price: any;
    try {
      price = await externalStockApi.getStockPrice(upper);
      
      // We no longer return mock data here
    } catch (e) {
      console.warn('External price fetch failed:', e);
      // Attempt cached fallback before failing
      if (cached && typeof cached.current_price === 'number') {
        console.log(`💾 [STOCK-API] Returning stale cached data for ${upper} due to API failure`);
        return NextResponse.json({
          symbol: upper,
          last_price: cached.current_price,
          day_change: 0,
          day_change_perc: cached.price_change_percent || 0,
          volume: cached.volume || 0,
          market_cap: cached.market_cap || null,
          cached: true,
          stale: true
        });
      }
      // Return soft failure to avoid 5xx on UI
      return NextResponse.json({ 
        error: 'Price not available', 
        symbol: upper, 
        last_price: null,
        message: 'External API temporarily unavailable. Please try again later.'
      }, { status: 200 });
    }

    if (!price || price.last_price == null) {
      return NextResponse.json({ 
        error: 'Price not available', 
        symbol: upper, 
        last_price: null,
        message: 'Price data temporarily unavailable'
      }, { status: 200 });
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
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Unable to fetch price data at this time'
    }, { status: 500 });
  }
}