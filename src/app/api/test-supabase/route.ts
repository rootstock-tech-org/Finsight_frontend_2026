import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: false,
      message: 'Supabase removed; this endpoint is deprecated. Use FastAPI endpoints instead.'
    }, { status: 501 });

    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.status || 'unknown',
        details: error
      }, { status: 500 });
    }

    // Test different tables to see what exists
    const tablesToTest = [
      'user_profiles',
      'profiles', 
      'users',
      'auth.users'
    ];

    const tableResults: Record<string, string> = {};

    for (const tableName of tablesToTest) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (tableError) {
          if (tableError.code === 'PGRST116') {
            tableResults[tableName] = 'table_does_not_exist';
          } else if (tableError.code === '42501') {
            tableResults[tableName] = 'permission_denied';
          } else {
            tableResults[tableName] = `error: ${tableError.message} (${tableError.code})`;
          }
        } else {
          tableResults[tableName] = 'accessible';
        }
      } catch (e) {
        tableResults[tableName] = `exception: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    // Test if we can list tables (requires different permissions)
    let schemaInfo = 'unknown';
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_schema_info');
      
      if (schemaError) {
        schemaInfo = `rpc_error: ${schemaError.message}`;
      } else {
        schemaInfo = 'rpc_accessible';
      }
    } catch (e) {
      schemaInfo = `rpc_exception: ${e instanceof Error ? e.message : String(e)}`;
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      session: data.session ? 'active' : 'none',
      tableResults,
      schemaInfo,
      projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'using_fallback',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      environment: process.env.NODE_ENV,
      recommendations: [
        'Check if RLS (Row Level Security) is enabled in your Supabase project',
        'Verify that your anon key has the right permissions',
        'Check if the user_profiles table exists and has proper policies'
      ]
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
