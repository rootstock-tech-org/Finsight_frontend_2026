import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      message:
        'Supabase removed; this endpoint is deprecated. Use FastAPI endpoints instead.',
    },
    { status: 501 }
  );
}