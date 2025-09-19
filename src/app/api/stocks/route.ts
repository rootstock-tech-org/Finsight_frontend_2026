import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { externalStockApi } from '@/lib/services/external-stock-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const useExternal = searchParams.get('external') === 'true';

    // If external API is requested and we have a search query
    if (useExternal && search) {
      try {
        console.log('🔍 Using external API for search:', search);
        const { searchResults, prices } = await externalStockApi.searchAndGetPrice(search);
        
        // Combine search results with price data
        const combinedResults = searchResults.map((result, index) => ({
          symbol: result.symbol,
          company_name: result.name,
          sector: result.sector || 'Unknown',
          industry: result.industry || 'Unknown',
          exchange: result.exchange || 'Unknown',
          current_price: prices[index]?.last_price || null,
          last_price: prices[index]?.last_price || null,
          change_percent: prices[index]?.change_percent || null,
          volume: prices[index]?.volume || null,
          market_cap: prices[index]?.market_cap || null,
          last_updated: new Date().toISOString(),
          source: 'external'
        }));

        return NextResponse.json({
          stocks: combinedResults.slice(offset, offset + limit),
          total: combinedResults.length,
          limit,
          offset,
          source: 'external'
        });
      } catch (externalError) {
        console.error('External API error:', externalError);
        // Fall back to database search if external API fails
      }
    }

    // Database search (fallback or when external is not requested)
    let query = supabase
      .from('stocks')
      .select('*')
      .order('last_updated', { ascending: false });

    if (symbol) {
      query = query.eq('symbol', symbol);
    }

    if (search) {
      query = query.or(`symbol.ilike.%${search}%,company_name.ilike.%${search}%,sector.ilike.%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stocks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stocks: data || [],
      total: count || 0,
      limit,
      offset,
      source: 'database'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, company_name, sector, industry, current_price } = body;

    if (!symbol || !company_name) {
      return NextResponse.json(
        { error: 'Symbol and company name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('stocks')
      .upsert({
        symbol,
        company_name,
        sector,
        industry,
        current_price,
        last_updated: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create/update stock' },
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
