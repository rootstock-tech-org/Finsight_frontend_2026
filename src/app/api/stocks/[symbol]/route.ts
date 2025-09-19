import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { externalStockApi } from '@/lib/services/external-stock-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const useExternal = searchParams.get('external') === 'true';
    const refreshPrice = searchParams.get('refresh') === 'true';

    console.log('🔍 Stock details request:', { symbol, useExternal, refreshPrice });

    let stock = null;
    let externalPriceData = null;

    // Try to get stock from database first
    const { data: dbStock, error: stockError } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (!stockError && dbStock) {
      stock = dbStock;
    }

    // If external API is requested or stock not found in database
    if (useExternal || !stock || refreshPrice) {
      try {
        console.log('🔍 Fetching external price data for:', symbol);
        externalPriceData = await externalStockApi.getStockPrice(symbol);
        
        // If we have external price data, update or create stock record
        if (externalPriceData && externalPriceData.last_price !== null) {
          const stockData = {
            symbol: symbol.toUpperCase(),
            company_name: stock?.company_name || symbol.toUpperCase(),
            current_price: externalPriceData.last_price,
            last_price: externalPriceData.last_price,
            price_change: externalPriceData.change || 0,
            price_change_percent: externalPriceData.change_percent || 0,
            volume: externalPriceData.volume || 0,
            market_cap: externalPriceData.market_cap || null,
            last_updated: new Date().toISOString(),
            source: 'external'
          };

          const { data: updatedStock } = await supabase
            .from('stocks')
            .upsert(stockData)
            .select()
            .single();

          if (updatedStock) {
            stock = updatedStock;
          }
        }
      } catch (externalError) {
        console.error('External API error for', symbol, ':', externalError);
        // Continue with database data if external API fails
      }
    }

    if (!stock) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }

    // Get recent market data
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(30);

    if (marketError) {
      console.error('Market data error:', marketError);
    }

    // Get related news
    const { data: news, error: newsError } = await supabase
      .from('news')
      .select('*')
      .contains('related_symbols', [symbol])
      .order('published_at', { ascending: false })
      .limit(10);

    if (newsError) {
      console.error('News error:', newsError);
    }

    return NextResponse.json({
      stock,
      externalPriceData,
      marketData: marketData || [],
      news: news || [],
      source: externalPriceData ? 'external' : 'database'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const body = await request.json();
    const { current_price, price_change, price_change_percent, volume } = body;

    const { data, error } = await supabase
      .from('stocks')
      .update({
        current_price,
        price_change,
        price_change_percent,
        volume,
        last_updated: new Date().toISOString()
      })
      .eq('symbol', symbol)
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to update stock' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stock: data?.[0] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
