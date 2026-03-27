import { NextRequest, NextResponse } from 'next/server';
import { ocrApi, SearchRequest } from '@/lib/services/ocr-api';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  return auth ? auth.replace('Bearer ', '').trim() : null;
}

function fapiHeaders(userId: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${userId}` };
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { query, top_k = 5 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required and must be a string' }, { status: 400 });
    }

    // Run search via OCR API
    const searchResults = await ocrApi.searchDocuments({ query, top_k } as SearchRequest);

    // Persist search record to FastAPI (fire-and-forget, don't block response)
    fetch(`${FASTAPI}/search-history`, {
      method: 'POST',
      headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ user_id: userId, query, results: searchResults }),
    }).catch(() => {}); // non-critical

    return NextResponse.json({ success: true, query, results: searchResults, total: searchResults.length });
  } catch (error) {
    console.error('POST /api/ocr/search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const offset = (page - 1) * limit;

    const res = await fetch(
      `${FASTAPI}/search-history?user_id=${userId}&page=${page}&limit=${limit}`,
      { headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch search history' }, { status: 500 });
    }

    const data = await res.json();
    const searches = data.searches ?? data.items ?? [];
    const total = data.total ?? searches.length;

    return NextResponse.json({
      searches,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('GET /api/ocr/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}