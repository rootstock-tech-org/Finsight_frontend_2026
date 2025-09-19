import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    console.log('Watchlist data:', data);
    return NextResponse.json({ watchlist: data || [] });

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

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user_id)
      .eq('symbol', symbol)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Stock already in watchlist' },
        { status: 409 }
      );
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
