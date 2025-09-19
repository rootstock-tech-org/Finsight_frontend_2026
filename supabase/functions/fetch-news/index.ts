import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Mock news data - replace with actual news API calls
const MOCK_NEWS = [
  {
    title: 'Reliance Industries Reports Strong Q3 Earnings',
    content: 'Reliance Industries Limited reported a 15% increase in quarterly revenue...',
    source: 'Economic Times',
    url: 'https://example.com/news1',
    published_at: new Date().toISOString(),
    sentiment_score: 0.8,
    related_symbols: ['RELIANCE']
  },
  {
    title: 'Jio Financial Services Expands Digital Banking',
    content: 'Jio Financial Services announced new digital banking initiatives...',
    source: 'Business Standard',
    url: 'https://example.com/news2',
    published_at: new Date(Date.now() - 3600000).toISOString(),
    sentiment_score: 0.6,
    related_symbols: ['JIOFIN']
  },
  {
    title: 'Tata Motors Launches New Electric Vehicle',
    content: 'Tata Motors unveiled its latest electric vehicle model...',
    source: 'Auto News',
    url: 'https://example.com/news3',
    published_at: new Date(Date.now() - 7200000).toISOString(),
    sentiment_score: 0.9,
    related_symbols: ['TATAMOTORS']
  }
];

Deno.serve(async (req: Request) => {
  try {
    console.log('Fetching news data...');

    // Insert new news articles
    const { data, error } = await supabase
      .from('news')
      .insert(MOCK_NEWS)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert news' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Inserted ${data?.length || 0} news articles`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted: data?.length || 0,
        news: data 
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
