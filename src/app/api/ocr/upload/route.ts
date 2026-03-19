import { NextRequest, NextResponse } from 'next/server';
import { ocrApi, DocumentAnalysisRequest } from '@/lib/services/ocr-api';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyName = formData.get('company_name') as string;
    const maxPages = formData.get('max_pages') as string;
    const useCache = formData.get('use_cache') as string;
    const asyncMode = formData.get('async') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and image files are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // ── Quota check via FastAPI ──────────────────────────────────────────────
    let quota = null;
    try {
      const quotaRes = await fetch(`${FASTAPI}/user_profiles/${userId}/quota`, {
        headers: fapiHeaders(userId),
      });
      if (!quotaRes.ok) {
        const err = await quotaRes.text().catch(() => 'unknown');
        console.warn('FastAPI quota check failed (dev bypass):', quotaRes.status, err);
        quota = { used: 0, limit: 9999, tier: 1 };
      } else {
        quota = await quotaRes.json();
      }
      if (quota.used >= quota.limit) {
        return NextResponse.json(
          {
            error: 'Monthly analysis quota reached for your plan.',
            details: `Limit: ${quota.limit} analyses/month. Upgrade to increase your limit.`,
            tier: quota.tier,
          },
          { status: 403 }
        );
      }
    } catch (fetchError) {
      console.warn('FastAPI quota endpoint unreachable (dev bypass):', fetchError);
      quota = { used: 0, limit: 9999, tier: 1 };
    }

    // Increment usage: best-effort, log errors but continue
    try {
      await fetch(`${FASTAPI}/user_profiles/${userId}/quota/increment`, {
        method: 'POST',
        headers: fapiHeaders(userId),
      });
    } catch (err) {
      console.warn('Failed to increment quota, continuing:', err);
    }

    // ── Create initial record in FastAPI ─────────────────────────────────────
    const createRes = await fetch(`${FASTAPI}/analysis_results/`, {
      method: 'POST',
      headers: fapiHeaders(userId),
      body: JSON.stringify({
        user_id: userId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type.split('/')[1],
        company_name: companyName || null,
        status: 'processing',
        metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString(),
          file_type: file.type,
        },
      }),
    });

    let analysisRecord: any = {
      id: `local-${Date.now()}`,
      user_id: userId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type.split('/')[1],
      status: 'processing',
      metadata: {
        original_name: file.name,
        upload_timestamp: new Date().toISOString(),
        file_type: file.type,
      },
    };

    const backendRecordCreated = createRes.ok;

    if (!createRes.ok) {
      const err = await createRes.text().catch(() => 'no body');
      console.warn('Failed to create analysis record (dev bypass):', createRes.status, err);
    } else {
      analysisRecord = await createRes.json();
    }

    // ── Run OCR ───────────────────────────────────────────────────────────────
    const ocrRequest: DocumentAnalysisRequest = {
      file,
      company_name: companyName || undefined,
      max_pages: maxPages ? parseInt(maxPages) : undefined,
      use_cache: useCache ? useCache === 'true' : undefined,
    };

    try {
      let analysisResult: any;

      if (asyncMode === 'true') {
        analysisResult = await ocrApi.analyzeDocumentAsync(ocrRequest);

        if (analysisResult.document_id && backendRecordCreated) {
          await fetch(`${FASTAPI}/analysis_results/${analysisRecord.id}`, {
            method: 'PATCH',
            headers: fapiHeaders(userId),
            body: JSON.stringify({
              document_id: analysisResult.document_id,
              status: 'processing',
              metadata: { ...analysisRecord.metadata, processing_mode: 'async' },
            }),
          }).catch(() => {});
        }
      } else {
        analysisResult = await ocrApi.analyzeDocument(ocrRequest);

        if (analysisResult.status === 'completed' && analysisResult.analysis) {
          const cn = extractCompanyName(analysisResult.analysis);
          if (backendRecordCreated) {
            await fetch(`${FASTAPI}/analysis_results/${analysisRecord.id}`, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify({
                status: 'completed',
                company_name: cn ?? analysisRecord.company_name,
                analysis_data: analysisResult.analysis,
                completed_at: new Date().toISOString(),
                metadata: { ...analysisRecord.metadata, processing_mode: 'sync' },
              }),
            }).catch(() => {});
          }
        } else if (analysisResult.status === 'failed') {
          if (backendRecordCreated) {
            await fetch(`${FASTAPI}/analysis_results/${analysisRecord.id}`, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify({
                status: 'failed',
                error_message: analysisResult.error ?? 'Analysis failed',
                metadata: { ...analysisRecord.metadata, processing_mode: 'sync' },
              }),
            }).catch(() => {});
          }
        }
      }

      return NextResponse.json({
        success: true,
        analysis_id: analysisRecord.id,
        document_id: analysisResult.document_id,
        status: analysisResult.status,
        message: analysisResult.message ?? 'Document uploaded successfully',
        analysis: analysisResult.analysis,
        processing_mode: asyncMode === 'true' ? 'async' : 'sync',
      });
    } catch (ocrError) {
      console.error('OCR API error:', ocrError);

      if (backendRecordCreated) {
        await fetch(`${FASTAPI}/analysis_results/${analysisRecord.id}`, {
          method: 'PATCH',
          headers: fapiHeaders(userId),
          body: JSON.stringify({
            status: 'failed',
            error_message: ocrError instanceof Error ? ocrError.message : 'OCR processing failed',
          }),
        }).catch(() => {});
      }

      return NextResponse.json(
        {
          error: 'Document analysis failed',
          details: ocrError instanceof Error ? ocrError.message : 'Unknown error',
          analysis_id: analysisRecord.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('POST /api/ocr/upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysis_id');

    if (analysisId) {
      const userId = getUserId(request);
      if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

      const res = await fetch(`${FASTAPI}/analysis_results/${analysisId}`, {
        headers: fapiHeaders(userId),
      });

      if (!res.ok) return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
      const analysis = await res.json();

      // Poll external status if still processing
      if (analysis.status === 'processing' && analysis.document_id) {
        try {
          const statusResult = await ocrApi.getProcessingStatus(analysis.document_id);

          if (statusResult.status === 'completed' && statusResult.analysis) {
            await fetch(`${FASTAPI}/analysis_results/${analysisId}`, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify({
                status: 'completed',
                analysis_data: statusResult.analysis,
                completed_at: new Date().toISOString(),
              }),
            }).catch(() => {});
            return NextResponse.json({ ...analysis, status: 'completed', analysis_data: statusResult.analysis });
          }

          if (statusResult.status === 'failed') {
            await fetch(`${FASTAPI}/analysis_results/${analysisId}`, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify({ status: 'failed', error_message: statusResult.error }),
            }).catch(() => {});
            return NextResponse.json({ ...analysis, status: 'failed', error_message: statusResult.error });
          }
        } catch {
          // fall through to return current analysis
        }
      }

      return NextResponse.json(analysis);
    }

    // Info endpoint — no auth needed
    const healthCheck = await ocrApi.healthCheck();
    return NextResponse.json({
      supported_file_types: [
        { type: 'pdf',  mime: 'application/pdf', maxSize: '50MB' },
        { type: 'jpeg', mime: 'image/jpeg',       maxSize: '10MB' },
        { type: 'png',  mime: 'image/png',        maxSize: '10MB' },
        { type: 'jpg',  mime: 'image/jpg',        maxSize: '10MB' },
      ],
      max_file_size: '50MB',
      processing_modes: ['sync', 'async'],
      ocr_api_status: healthCheck.status,
      ocr_api_message: healthCheck.message,
    });
  } catch (error) {
    console.error('GET /api/ocr/upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}