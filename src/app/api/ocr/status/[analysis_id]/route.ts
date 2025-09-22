import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ocrApi } from '@/lib/services/ocr-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/ocr/status/[analysis_id]
 * Get the status of a specific document analysis
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysis_id: string }> }
) {
  try {
    const { analysis_id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    console.log('📊 Checking analysis status:', {
      analysisId: analysis_id,
      userId: user.id
    });

    // Get analysis record from database
    const { data: analysis, error: dbError } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('id', analysis_id)
      .eq('user_id', user.id)
      .single();

    if (dbError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // If analysis is still processing and has external document ID, check external status
    if (analysis.status === 'processing' && analysis.document_id) {
      try {
        console.log('🔄 Checking external API status for document:', analysis.document_id);
        const statusResult = await ocrApi.getProcessingStatus(analysis.document_id);
        
        if (statusResult.status === 'completed' && statusResult.analysis) {
          // Log the actual analysis response to debug company name extraction
          console.log('🔍 [OCR-STATUS] Analysis result structure:', {
            hasCompanyName: !!statusResult.analysis.company_name,
            companyName: statusResult.analysis.company_name,
            analysisKeys: Object.keys(statusResult.analysis),
            fullAnalysis: JSON.stringify(statusResult.analysis, null, 2)
          });

          // Extract company name from analysis data - try multiple possible locations
          const extractedCompanyName = statusResult.analysis.company_name || 
                                     (statusResult.analysis as any)['Company Name'] ||
                                     (statusResult.analysis as any).company ||
                                     (statusResult.analysis as any).companyName ||
                                     null;

          console.log('🏢 [OCR-STATUS] Extracted company name:', extractedCompanyName);

          // Update database with completed analysis
          const { error: updateError } = await supabase
            .from('document_analysis')
            .update({
              status: 'completed',
              company_name: extractedCompanyName || analysis.company_name,
              analysis_data: statusResult.analysis,
              completed_at: new Date().toISOString(),
              metadata: {
                ...analysis.metadata,
                external_status_checked: true,
                external_processing_time: Date.now() - new Date(analysis.created_at).getTime(),
                last_status_check: new Date().toISOString()
              }
            })
            .eq('id', analysis_id);

          if (updateError) {
            console.error('Error updating analysis with completed status:', updateError);
          }

          return NextResponse.json({
            ...analysis,
            status: 'completed',
            analysis_data: statusResult.analysis,
            completed_at: new Date().toISOString(),
            external_status: statusResult.status
          });

        } else if (statusResult.status === 'failed') {
          // Update database with failed status
          const { error: updateError } = await supabase
            .from('document_analysis')
            .update({
              status: 'failed',
              error_message: statusResult.error || 'External processing failed',
              metadata: {
                ...analysis.metadata,
                external_status_checked: true,
                external_error: statusResult.error,
                last_status_check: new Date().toISOString()
              }
            })
            .eq('id', analysis_id);

          if (updateError) {
            console.error('Error updating analysis with failed status:', updateError);
          }

          return NextResponse.json({
            ...analysis,
            status: 'failed',
            error_message: statusResult.error,
            external_status: statusResult.status
          });

        } else {
          // Still processing
          return NextResponse.json({
            ...analysis,
            external_status: statusResult.status,
            external_message: statusResult.message
          });
        }

      } catch (externalError) {
        console.error('Error checking external status:', externalError);
        // Return current database status if external check fails
        return NextResponse.json({
          ...analysis,
          external_error: externalError instanceof Error ? externalError.message : 'Unknown error'
        });
      }
    }

    // Return current database status
    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Status API error:', error);
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
 * PUT /api/ocr/status/[analysis_id]
 * Update analysis status (for manual status updates)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ analysis_id: string }> }
) {
  try {
    const { analysis_id } = await params;
    const body = await request.json();
    const { status, error_message, analysis_data } = body;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Validate status
    const validStatuses = ['processing', 'completed', 'failed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: processing, completed, failed' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (error_message) updateData.error_message = error_message;
    if (analysis_data) {
      updateData.analysis_data = analysis_data;
      // Extract company name from analysis data if provided - try multiple possible locations
      const extractedCompanyName = analysis_data.company_name || 
                                 (analysis_data as any)['Company Name'] ||
                                 (analysis_data as any).company ||
                                 (analysis_data as any).companyName ||
                                 null;
      if (extractedCompanyName) {
        updateData.company_name = extractedCompanyName;
      }
    }
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { data: updatedAnalysis, error: updateError } = await supabase
      .from('document_analysis')
      .update(updateData)
      .eq('id', analysis_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error updating analysis:', updateError);
      return NextResponse.json(
        { error: 'Failed to update analysis' },
        { status: 500 }
      );
    }

    if (!updatedAnalysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: updatedAnalysis
    });

  } catch (error) {
    console.error('Update status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
