import { NextRequest, NextResponse } from 'next/server';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const res = await fetch(`${FASTAPI}/news?${searchParams.toString()}`);
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    const data = await res.json();
    return NextResponse.json({
      news: data.news ?? data ?? [],
      total: data.total ?? 0,
      limit: Number(searchParams.get('limit') ?? 20),
      offset: Number(searchParams.get('offset') ?? 0),
    });
  } catch (error) {
    console.error('GET /api/news error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    const res = await fetch(`${FASTAPI}/news`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) return NextResponse.json({ error: 'Failed to create news article' }, { status: 500 });
    const data = await res.json();
    return NextResponse.json({ news: data });
  } catch (error) {
    console.error('POST /api/news error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}