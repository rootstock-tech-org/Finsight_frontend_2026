import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE_URL = 'https://e9cwq4w7punvx7-1003.proxy.runpod.net';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
    }

    const response = await fetch(`${EXTERNAL_API_BASE_URL}/api/stock/${encodeURIComponent(symbol)}/price`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching price for symbol:`, error);
    return NextResponse.json(
      { error: `Failed to fetch price for symbol` },
      { status: 500 }
    );
  }
}
