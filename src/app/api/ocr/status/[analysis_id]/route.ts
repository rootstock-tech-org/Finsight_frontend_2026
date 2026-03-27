import { NextRequest, NextResponse } from 'next/server';
import { ocrApi } from '@/lib/services/ocr-api';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  return auth ? auth.replace('Bearer ', '').trim() : null;
}

function fapiHeaders(userId: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${userId}` };
}

function extractCompanyName(analysis: any): string | null {
  return analysis?.company_name
    ?? analysis?.['Company Name']
    ?? analysis?.company
    ?? analysis?.companyName
    ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysis_id: string }> }
) {
  try {
    const { analysis_id } = await params;
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // Fetch record from FastAPI
    const res = await fetch(`${FASTAPI}/analysis_results/${analysis_id}`, {
      headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" }
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: res.status === 404 ? 404 : 500 });
    }

    const analysis = await res.json();

    // If still processing + has external document_id, poll external OCR API
    if (analysis.status === 'processing' && analysis.document_id) {
      try {
        const statusResult = await ocrApi.getProcessingStatus(analysis.document_id);

        if (statusResult.status === 'completed' && statusResult.analysis) {
          const companyName = extractCompanyName(statusResult.analysis);
          const patch = {
            status: 'completed',
            company_name: companyName ?? analysis.company_name,
            analysis_data: statusResult.analysis,
            completed_at: new Date().toISOString(),
          };

          // Persist back to FastAPI (fire-and-forget)
          fetch(`${FASTAPI}/analysis_results/${analysis_id}`, {
            method: 'PATCH',
            headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" },
            body: JSON.stringify(patch),
          }).catch(() => {});

          return NextResponse.json({ ...analysis, ...patch, external_status: statusResult.status });
        }

        if (statusResult.status === 'failed') {
          const patch = {
            status: 'failed',
            error_message: statusResult.error ?? 'External processing failed',
          };

          fetch(`${FASTAPI}/analysis_results/${analysis_id}`, {
            method: 'PATCH',
            headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" },
            body: JSON.stringify(patch),
          }).catch(() => {});

          return NextResponse.json({ ...analysis, ...patch, external_status: statusResult.status });
        }

        return NextResponse.json({
          ...analysis,
          external_status: statusResult.status,
          external_message: statusResult.message,
        });
      } catch (externalError) {
        console.error('Error checking external status:', externalError);
        return NextResponse.json({
          ...analysis,
          external_error: externalError instanceof Error ? externalError.message : 'Unknown',
        });
      }
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('GET /api/ocr/status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ analysis_id: string }> }
) {
  try {
    const { analysis_id } = await params;
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { status, error_message, analysis_data } = body;

    const validStatuses = ['processing', 'completed', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: processing | completed | failed' },
        { status: 400 }
      );
    }

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) patch.status = status;
    if (error_message) patch.error_message = error_message;
    if (analysis_data) {
      patch.analysis_data = analysis_data;
      const cn = extractCompanyName(analysis_data);
      if (cn) patch.company_name = cn;
    }
    if (status === 'completed') patch.completed_at = new Date().toISOString();

    const res = await fetch(`${FASTAPI}/analysis_results/${analysis_id}`, {
      method: 'PATCH',
      headers: { ...fapiHeaders(userId), "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.detail ?? 'Failed to update analysis' },
        { status: res.status === 404 ? 404 : 500 }
      );
    }

    const updatedAnalysis = await res.json();
    return NextResponse.json({ success: true, analysis: updatedAnalysis });
  } catch (error) {
    console.error('PUT /api/ocr/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}