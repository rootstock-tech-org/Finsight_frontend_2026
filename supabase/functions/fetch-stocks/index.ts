import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Mock stock data - replace with actual API calls to Alpha Vantage, IEX Cloud, etc.
const MOCK_STOCKS = [
  { symbol: 'RELIANCE', company_name: 'Reliance Industries Limited', sector: 'Oil & Gas', current_price: 2456.78, price_change_percent: 1.25 },
  { symbol: 'JIOFIN', company_name: 'Jio Financial Services Limited', sector: 'Financial Services', current_price: 234.56, price_change_percent: -0.85 },
  { symbol: 'TATAMOTORS', company_name: 'Tata Motors Limited', sector: 'Automobile', current_price: 789.12, price_change_percent: 2.15 },
  { symbol: 'HDFCBANK', company_name: 'HDFC Bank Limited', sector: 'Banking', current_price: 1654.32, price_change_percent: 0.75 },
  { symbol: 'ETERNAL', company_name: 'ETERNAL LIMITED', sector: 'Technology', current_price: 456.78, price_change_percent: 3.45 },
  { symbol: 'BEL', company_name: 'Bharat Electronics Limited', sector: 'Defense', current_price: 123.45, price_change_percent: 1.85 }
];

Deno.serve(async (req: Request) => {
  try {
    console.log('Fetching stock data...');

    // Update stock prices with random variations
    const updatedStocks = MOCK_STOCKS.map(stock => ({
      ...stock,
      current_price: stock.current_price * (1 + (Math.random() - 0.5) * 0.02), // ±1% variation
      price_change_percent: (Math.random() - 0.5) * 10, // Random change
      last_updated: new Date().toISOString()
    }));

    // Upsert stocks to database
    const { data, error } = await supabase
      .from('stocks')
      .upsert(updatedStocks, { 
        onConflict: 'symbol',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update stocks' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Updated ${data?.length || 0} stocks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: data?.length || 0,
        stocks: data 
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
