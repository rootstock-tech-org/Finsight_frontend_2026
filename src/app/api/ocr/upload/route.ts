import { NextRequest, NextResponse } from 'next/server';
import { ocrApi, DocumentAnalysisRequest } from '@/lib/services/ocr-api';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8001';

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

    // ── Quota check via FastAPI (dev bypass if endpoint missing) ─────────────
    try {
      const quotaRes = await fetch(`${FASTAPI}/user_profiles/${userId}/quota`, {
        headers: fapiHeaders(userId),
      });
      if (quotaRes.ok) {
        const quota = await quotaRes.json();
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
      } else {
        console.warn('FastAPI quota check failed (dev bypass):', quotaRes.status, await quotaRes.text().catch(() => ''));
      }
    } catch (fetchError) {
      console.warn('FastAPI quota endpoint unreachable (dev bypass):', fetchError);
    }

    // ── Create initial record in FastAPI ─────────────────────────────────────
    const createRes = await fetch(`${FASTAPI}/analysis_results/`, {
      method: 'POST',
      headers: fapiHeaders(userId),
      body: JSON.stringify({
        user_id: userId,
        doc_name: file.name,
        doc_type: file.type.includes('pdf') ? 'AR' : 'CHART',
        status: 'processing',
        summary: `Processing ${file.name}...`,
        result: {},
      }),
    });

    let analysisRecord: any = {
      id: `local-${Date.now()}`,
      user_id: userId,
      status: 'processing',
    };

    const backendRecordCreated = createRes.ok;

    if (!createRes.ok) {
      const err = await createRes.text().catch(() => 'no body');
      console.warn('Failed to create analysis record (dev bypass):', createRes.status, err);
    } else {
      analysisRecord = await createRes.json();
      console.log('✅ Record created:', analysisRecord.id, 'status:', analysisRecord.status);
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
          await fetch(`${FASTAPI}/analysis_results/${analysisRecord.id}?user_id=${userId}`, {
            method: 'PATCH',
            headers: fapiHeaders(userId),
            body: JSON.stringify({
              status: 'processing',
              summary: `Async processing started for ${file.name}`,
              result: { document_id: analysisResult.document_id },
            }),
          }).catch((e) => console.warn('PATCH async failed:', e));
        }
      } else {
        analysisResult = await ocrApi.analyzeDocument(ocrRequest);

        if (analysisResult.status === 'completed' && analysisResult.analysis) {
          const cn = extractCompanyName(analysisResult.analysis);
          if (backendRecordCreated) {
            const patchUrl = `${FASTAPI}/analysis_results/${analysisRecord.id}?user_id=${userId}`;
            const patchBody = {
              status: 'completed',
              summary:
                (analysisResult.analysis as any)?.summary ||
                (analysisResult.analysis as any)?.['Summary'] ||
                (analysisResult.analysis as any)?.['Finsight-Insight'] ||
                (analysisResult.analysis as any)?.insights?.general_insights?.summary ||
                cn ||
                'Analysis completed',
              result: analysisResult.analysis || {},
            };
            console.log('🔧 PATCH URL:', patchUrl);
            console.log('🔧 PATCH body keys:', Object.keys(patchBody));
            console.log('🔧 analysisRecord.id:', analysisRecord.id);
            const patchRes = await fetch(patchUrl, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify(patchBody),
            });
            const patchResText = await patchRes.text().catch(() => '');
            if (!patchRes.ok) {
              console.error('❌ PATCH completed failed:', patchRes.status, patchResText);
            } else {
              console.log('✅ PATCH completed success:', patchRes.status, patchResText.slice(0, 100));
            }
          }
        } else if (analysisResult.status === 'failed') {
          if (backendRecordCreated) {
            await fetch(`${FASTAPI}/analysis_results/${analysisRecord.id}?user_id=${userId}`, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify({
                status: 'failed',
                summary: analysisResult.error ?? 'Analysis failed',
                result: {},
              }),
            }).catch((e) => console.warn('PATCH failed status error:', e));
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
        await fetch(`${FASTAPI}/analysis_results/${analysisRecord.id}?user_id=${userId}`, {
          method: 'PATCH',
          headers: fapiHeaders(userId),
          body: JSON.stringify({
            status: 'failed',
            summary: ocrError instanceof Error ? ocrError.message : 'OCR processing failed',
            result: {},
          }),
        }).catch((e) => console.warn('PATCH ocrError failed:', e));
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

      // Poll external status if still processing async
      if (analysis.status === 'processing' && analysis.result?.document_id) {
        try {
          const statusResult = await ocrApi.getProcessingStatus(analysis.result.document_id);

          if (statusResult.status === 'completed' && statusResult.analysis) {
            await fetch(`${FASTAPI}/analysis_results/${analysisId}?user_id=${userId}`, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify({
                status: 'completed',
                summary: (statusResult.analysis as any)?.summary || 'Analysis completed',
                result: statusResult.analysis,
              }),
            }).catch(() => {});
            return NextResponse.json({ ...analysis, status: 'completed', result: statusResult.analysis });
          }

          if (statusResult.status === 'failed') {
            await fetch(`${FASTAPI}/analysis_results/${analysisId}?user_id=${userId}`, {
              method: 'PATCH',
              headers: fapiHeaders(userId),
              body: JSON.stringify({
                status: 'failed',
                summary: statusResult.error ?? 'Analysis failed',
                result: {},
              }),
            }).catch(() => {});
            return NextResponse.json({ ...analysis, status: 'failed' });
          }
        } catch {
          // fall through to return current db status
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