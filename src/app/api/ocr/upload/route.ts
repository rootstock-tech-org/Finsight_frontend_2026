import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ocrApi, DocumentAnalysisRequest } from '@/lib/services/ocr-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/ocr/upload
 * Upload and analyze a document using OCR API
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const companyName = formData.get('company_name') as string;
    const maxPages = formData.get('max_pages') as string;
    const useCache = formData.get('use_cache') as string;
    const asyncMode = formData.get('async') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and image files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // Get user from request (you'll need to implement auth middleware)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract user ID from JWT token (simplified - you should use proper JWT verification)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('📄 Processing document upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      companyName,
      userId: user.id
    });

    // Quota enforcement using immutable monthly usage counter (per calendar month UTC)
    try {
      // 1) Read user's tier
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      const tier = (profile?.subscription_tier || 'free').toString().toLowerCase();
      const monthlyLimits: Record<string, number> = {
        free: 10,
        basic: 10,
        premium: 100,
        enterprise: 1000
      };
      const monthlyLimit = monthlyLimits[tier] ?? 10;

      // 2) Month window
      const startOfMonth = new Date();
      startOfMonth.setUTCDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);
      const monthStartIso = startOfMonth.toISOString();

      // 3) Read usage row
      const { data: usageRow, error: usageErr } = await supabase
        .from('user_analysis_usage')
        .select('analyses_count')
        .eq('user_id', user.id)
        .eq('month_start', monthStartIso)
        .single();

      if (usageErr && usageErr.code !== 'PGRST116') {
        console.error('Error reading usage row:', usageErr);
      }

      const used = usageRow?.analyses_count || 0;
      if (used >= monthlyLimit) {
        return NextResponse.json(
          {
            error: 'Monthly analysis quota reached for your plan.',
            details: `Limit: ${monthlyLimit} analyses/month. Upgrade to increase your limit.`,
            tier
          },
          { status: 403 }
        );
      }

      // 4) Optimistic increment
      const { error: upsertErr } = await supabase
        .from('user_analysis_usage')
        .upsert({
          user_id: user.id,
          month_start: monthStartIso,
          analyses_count: used + 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,month_start' });

      if (upsertErr) {
        console.error('Error upserting usage row:', upsertErr);
        return NextResponse.json(
          { error: 'Failed to update usage counter. Please try again.' },
          { status: 500 }
        );
      }
    } catch (quotaError) {
      console.error('Quota enforcement error:', quotaError);
      return NextResponse.json(
        { error: 'Quota check failed. Please try again.' },
        { status: 500 }
      );
    }

    // Prepare OCR API request
    const ocrRequest: DocumentAnalysisRequest = {
      file,
      company_name: companyName || undefined,
      max_pages: maxPages ? parseInt(maxPages) : undefined,
      use_cache: useCache ? useCache === 'true' : undefined
    };

    // Create initial database record
    const { data: analysisRecord, error: dbError } = await supabase
      .from('document_analysis')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type.split('/')[1], // Extract file extension
        company_name: companyName || null,
        status: 'processing',
        metadata: {
          original_name: file.name,
          upload_timestamp: new Date().toISOString(),
          file_type: file.type
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error creating analysis record:', dbError);
      return NextResponse.json(
        { error: 'Failed to create analysis record' },
        { status: 500 }
      );
    }

    try {
      let analysisResult;

      if (asyncMode === 'true') {
        // Asynchronous processing
        console.log('🔄 Starting async document analysis...');
        analysisResult = await ocrApi.analyzeDocumentAsync(ocrRequest);
        
        if (analysisResult.document_id) {
          // Update record with external document ID
          await supabase
            .from('document_analysis')
            .update({
              document_id: analysisResult.document_id,
              status: 'processing',
              metadata: {
                ...analysisRecord.metadata,
                external_document_id: analysisResult.document_id,
                processing_mode: 'async'
              }
            })
            .eq('id', analysisRecord.id);
        }
      } else {
        // Synchronous processing
        console.log('⚡ Starting sync document analysis...');
        analysisResult = await ocrApi.analyzeDocument(ocrRequest);
        
        if (analysisResult.status === 'completed' && analysisResult.analysis) {
          // Log the actual analysis response to debug company name extraction
          console.log('🔍 [OCR-UPLOAD] Analysis result structure:', {
            hasCompanyName: !!analysisResult.analysis.company_name,
            companyName: analysisResult.analysis.company_name,
            analysisKeys: Object.keys(analysisResult.analysis),
            fullAnalysis: JSON.stringify(analysisResult.analysis, null, 2)
          });

          // Extract company name from analysis data - try multiple possible locations
          const extractedCompanyName = analysisResult.analysis.company_name || 
                                     (analysisResult.analysis as any)['Company Name'] ||
                                     (analysisResult.analysis as any).company ||
                                     (analysisResult.analysis as any).companyName ||
                                     null;

          console.log('🏢 [OCR-UPLOAD] Extracted company name:', extractedCompanyName);

          // Update record with analysis results
          await supabase
            .from('document_analysis')
            .update({
              status: 'completed',
              company_name: extractedCompanyName || analysisRecord.company_name,
              analysis_data: analysisResult.analysis,
              metadata: {
                ...analysisRecord.metadata,
                processing_mode: 'sync',
                processing_time: Date.now() - new Date(analysisRecord.created_at).getTime()
              },
              completed_at: new Date().toISOString()
            })
            .eq('id', analysisRecord.id);
        } else if (analysisResult.status === 'failed') {
          // Update record with error
          await supabase
            .from('document_analysis')
            .update({
              status: 'failed',
              error_message: analysisResult.error || 'Analysis failed',
              metadata: {
                ...analysisRecord.metadata,
                processing_mode: 'sync',
                error_details: analysisResult.error
              }
            })
            .eq('id', analysisRecord.id);
        }
      }

      return NextResponse.json({
        success: true,
        analysis_id: analysisRecord.id,
        document_id: analysisResult.document_id,
        status: analysisResult.status,
        message: analysisResult.message || 'Document uploaded successfully',
        analysis: analysisResult.analysis,
        processing_mode: asyncMode === 'true' ? 'async' : 'sync'
      });

    } catch (ocrError) {
      console.error('OCR API error:', ocrError);
      
      // Update record with error
      await supabase
        .from('document_analysis')
        .update({
          status: 'failed',
          error_message: ocrError instanceof Error ? ocrError.message : 'OCR processing failed',
          metadata: {
            ...analysisRecord.metadata,
            error_details: ocrError instanceof Error ? ocrError.message : 'Unknown error'
          }
        })
        .eq('id', analysisRecord.id);

      return NextResponse.json(
        { 
          error: 'Document analysis failed',
          details: ocrError instanceof Error ? ocrError.message : 'Unknown error',
          analysis_id: analysisRecord.id
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ocr/upload
 * Get upload status and supported file types
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('analysis_id');

    if (analysisId) {
      // Get specific analysis status
      const { data: analysis, error } = await supabase
        .from('document_analysis')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error || !analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        );
      }

      // If it's async processing, check external API status
      if (analysis.status === 'processing' && analysis.document_id) {
        try {
          const statusResult = await ocrApi.getProcessingStatus(analysis.document_id);
          
          if (statusResult.status === 'completed' && statusResult.analysis) {
            // Update database with completed analysis
            await supabase
              .from('document_analysis')
              .update({
                status: 'completed',
                analysis_data: statusResult.analysis,
                completed_at: new Date().toISOString(),
                metadata: {
                  ...analysis.metadata,
                  external_status_checked: true,
                  external_processing_time: Date.now() - new Date(analysis.created_at).getTime()
                }
              })
              .eq('id', analysisId);

            return NextResponse.json({
              ...analysis,
              status: 'completed',
              analysis_data: statusResult.analysis,
              completed_at: new Date().toISOString()
            });
          } else if (statusResult.status === 'failed') {
            // Update database with failed status
            await supabase
              .from('document_analysis')
              .update({
                status: 'failed',
                error_message: statusResult.error || 'External processing failed',
                metadata: {
                  ...analysis.metadata,
                  external_status_checked: true,
                  external_error: statusResult.error
                }
              })
              .eq('id', analysisId);

            return NextResponse.json({
              ...analysis,
              status: 'failed',
              error_message: statusResult.error
            });
          }
        } catch (statusError) {
          console.error('Error checking external status:', statusError);
          // Return current database status if external check fails
        }
      }

      return NextResponse.json(analysis);
    }

    // Return supported file types and API info
    const supportedTypes = [
      { type: 'pdf', mime: 'application/pdf', maxSize: '50MB' },
      { type: 'jpeg', mime: 'image/jpeg', maxSize: '10MB' },
      { type: 'png', mime: 'image/png', maxSize: '10MB' },
      { type: 'jpg', mime: 'image/jpg', maxSize: '10MB' }
    ];

    // Check OCR API health
    const healthCheck = await ocrApi.healthCheck();

    return NextResponse.json({
      supported_file_types: supportedTypes,
      max_file_size: '50MB',
      processing_modes: ['sync', 'async'],
      ocr_api_status: healthCheck.status,
      ocr_api_message: healthCheck.message
    });

  } catch (error) {
    console.error('Upload status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


