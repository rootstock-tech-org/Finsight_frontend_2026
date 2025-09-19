import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ocrApi } from '@/lib/services/ocr-api';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/ocr/history
 * Get document analysis history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from request
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const documentType = searchParams.get('document_type');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    const offset = (page - 1) * limit;

    console.log('📊 Fetching analysis history:', {
      userId: user.id,
      page,
      limit,
      status,
      documentType,
      search
    });

    // Build query
    let query = supabase
      .from('document_analysis')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    if (search) {
      query = query.or(`file_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'file_name', 'company_name', 'file_size'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    
    query = query.order(sortField, sortDirection);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: analyses, error, count } = await query;

    if (error) {
      console.error('Database error fetching history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis history' },
        { status: 500 }
      );
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('document_analysis')
      .select('status, document_type, file_size')
      .eq('user_id', user.id);

    const statistics = {
      total: count || 0,
      completed: stats?.filter(s => s.status === 'completed').length || 0,
      processing: stats?.filter(s => s.status === 'processing').length || 0,
      failed: stats?.filter(s => s.status === 'failed').length || 0,
      totalFileSize: stats?.reduce((sum, s) => sum + (s.file_size || 0), 0) || 0,
      documentTypes: stats?.reduce((acc, s) => {
        const type = s.document_type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    return NextResponse.json({
      analyses: analyses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      },
      statistics,
      filters: {
        status,
        document_type: documentType,
        search,
        sort_by: sortField,
        sort_order: sortOrder
      }
    });

  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ocr/history
 * Delete analysis records
 */
export async function DELETE(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { analysis_ids, delete_all } = body;

    if (delete_all) {
      // Delete all analyses for the user
      const { error } = await supabase
        .from('document_analysis')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error deleting all analyses:', error);
        return NextResponse.json(
          { error: 'Failed to delete analyses' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All analyses deleted successfully',
        deleted_count: 'all'
      });
    }

    if (!analysis_ids || !Array.isArray(analysis_ids) || analysis_ids.length === 0) {
      return NextResponse.json(
        { error: 'analysis_ids array is required' },
        { status: 400 }
      );
    }

    // Delete specific analyses
    const { error, count } = await supabase
      .from('document_analysis')
      .delete()
      .eq('user_id', user.id)
      .in('id', analysis_ids);

    if (error) {
      console.error('Database error deleting analyses:', error);
      return NextResponse.json(
        { error: 'Failed to delete analyses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analyses deleted successfully',
      deleted_count: count || 0
    });

  } catch (error) {
    console.error('Delete history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


