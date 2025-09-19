import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = supabase
      .from('market_data')
      .select('*')
      .order('date', { ascending: false });

    if (symbol) {
      query = query.eq('symbol', symbol);
    }

    if (date) {
      query = query.eq('date', date);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch market data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ marketData: data || [] });

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
    const { symbol, open_price, high_price, low_price, close_price, volume, date } = body;

    if (!symbol || !date) {
      return NextResponse.json(
        { error: 'Symbol and date are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('market_data')
      .upsert({
        symbol,
        open_price,
        high_price,
        low_price,
        close_price,
        volume,
        date
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to create/update market data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ marketData: data?.[0] });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
