import { NextRequest, NextResponse } from 'next/server';
import { TokenValidator } from '@/lib/auth/token-validator';

/**
 * POST /api/invitation/validate - Validate invitation token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('Validating token:', token);

    // Validate the token
    const validation = await TokenValidator.validateToken(token);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          valid: false,
          error: validation.error || 'Invalid token'
        },
        { status: 401 }
      );
    }

    console.log('Token validation successful for user:', validation.userId);

    return NextResponse.json({
      valid: true,
      userId: validation.userId,
      email: validation.email,
      expiresAt: validation.expiresAt
    });

  } catch (error) {
    console.error('Token validation API error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: `Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invitation/validate - Validate token from query parameter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token parameter is required' },
        { status: 400 }
      );
    }

    console.log('Validating token from query param:', token);

    // Validate the token
    const validation = await TokenValidator.validateToken(token);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          valid: false,
          error: validation.error || 'Invalid token'
        },
        { status: 401 }
      );
    }

    console.log('Token validation successful for user:', validation.userId);

    return NextResponse.json({
      valid: true,
      userId: validation.userId,
      email: validation.email,
      expiresAt: validation.expiresAt
    });

  } catch (error) {
    console.error('Token validation API error:', error);
    return NextResponse.json(
      { 
        valid: false,
        error: `Token validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
