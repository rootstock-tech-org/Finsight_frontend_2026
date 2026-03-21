import { NextRequest, NextResponse } from 'next/server';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (!auth) return null;
  return auth.replace('Bearer ', '').trim() || null;
}

function fapiHeaders(userId: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${userId}` };
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50'); // default raised to 50
    const status = searchParams.get('status') ?? '';
    const documentType = searchParams.get('document_type') ?? '';
    const search = searchParams.get('search') ?? '';
    const sortBy = searchParams.get('sort_by') ?? 'created_at';
    const sortOrder = searchParams.get('sort_order') ?? 'desc';

    const params = new URLSearchParams({
      page: page.toString(), limit: limit.toString(),
      sort_by: sortBy, sort_order: sortOrder,
    });
    if (status) params.set('status', status);
    if (documentType) params.set('document_type', documentType);
    if (search) params.set('search', search);

    const res = await fetch(`${FASTAPI}/analysis_results/?user_id=${userId}&${params}`, {
      headers: fapiHeaders(userId),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail ?? 'Failed to fetch history' }, { status: 500 });
    }

    const data = await res.json();

    const analyses: any[] = data.analyses ?? data.items ?? (Array.isArray(data) ? data : []);
    const total: number = data.total ?? analyses.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const statistics = data.statistics ?? {
      total,
      completed: analyses.filter((a: any) => a.status === 'completed').length,
      processing: analyses.filter((a: any) => a.status === 'processing').length,
      failed: analyses.filter((a: any) => a.status === 'failed').length,
      totalFileSize: analyses.reduce((s: number, a: any) => s + (a.file_size ?? 0), 0),
      documentTypes: analyses.reduce((acc: Record<string, number>, a: any) => {
        const t = a.document_type ?? a.doc_type ?? 'Unknown';
        acc[t] = (acc[t] ?? 0) + 1;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      analyses,
      pagination: { page, limit, total, totalPages, hasNext: offset + limit < total, hasPrev: page > 1 },
      statistics,
      filters: { status, document_type: documentType, search, sort_by: sortBy, sort_order: sortOrder },
    });
  } catch (error) {
    console.error('GET /api/ocr/history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { analysis_ids, delete_all } = body;

    // ── Delete all: fetch IDs first, then delete one by one ──────────────────
    if (delete_all) {
      const listRes = await fetch(
        `${FASTAPI}/analysis_results/?user_id=${userId}&limit=500&page=1`,
        { headers: fapiHeaders(userId) }
      );
      if (!listRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch analyses list for deletion' }, { status: 500 });
      }
      const listData = await listRes.json();
      const items: any[] = listData.analyses ?? listData.items ?? (Array.isArray(listData) ? listData : []);

      await Promise.all(
        items.map((item: any) =>
          fetch(`${FASTAPI}/analysis_results/${item.id}?user_id=${userId}`, {
            method: 'DELETE',
            headers: fapiHeaders(userId),
          }).catch(() => {})
        )
      );

      return NextResponse.json({ success: true, message: 'All analyses deleted', deleted_count: items.length });
    }

    // ── Delete selected: one by one ──────────────────────────────────────────
    if (!Array.isArray(analysis_ids) || analysis_ids.length === 0) {
      return NextResponse.json({ error: 'analysis_ids array is required' }, { status: 400 });
    }

    const results = await Promise.all(
      analysis_ids.map((id: string) =>
        fetch(`${FASTAPI}/analysis_results/${id}?user_id=${userId}`, {
          method: 'DELETE',
          headers: fapiHeaders(userId),
        }).catch(() => null)
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Analyses deleted successfully',
      deleted_count: results.filter(r => r?.ok).length,
    });
  } catch (error) {
    console.error('DELETE /api/ocr/history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}