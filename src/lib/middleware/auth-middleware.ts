import { NextRequest, NextResponse } from 'next/server';
import { TokenValidator, TokenValidationResult } from '@/lib/auth/token-validator';

export interface AuthenticatedRequest extends NextRequest {
  auth?: {
    userId: string;
    email: string;
    token: string;
  };
}

export class AuthMiddleware {
  /**
   * Middleware to validate invitation tokens
   */
  static async validateInvitationToken(
    request: NextRequest
  ): Promise<NextResponse | { request: AuthenticatedRequest; validation: TokenValidationResult }> {
    try {
      // Extract token from request
      const token = TokenValidator.extractTokenFromRequest(request);
      
      if (!token) {
        return NextResponse.json(
          { error: 'Invitation token is required' },
          { status: 401 }
        );
      }

      // Validate the token
      const validation = await TokenValidator.validateToken(token);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid invitation token' },
          { status: 401 }
        );
      }

      // Add auth info to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.auth = {
        userId: validation.userId!,
        email: validation.email!,
        token: token
      };

      return { request: authenticatedRequest, validation };

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  }

  /**
   * Middleware to validate and optionally mark token as used
   */
  static async validateAndConsumeToken(
    request: NextRequest,
    markAsUsed: boolean = false
  ): Promise<NextResponse | { request: AuthenticatedRequest; validation: TokenValidationResult }> {
    const result = await this.validateInvitationToken(request);
    
    if (result instanceof NextResponse) {
      return result; // Error response
    }

    // Mark token as used if requested
    if (markAsUsed) {
      const success = await TokenValidator.markTokenAsUsed(result.validation.userId!);
      if (!success) {
        console.warn('Failed to mark token as used, but continuing with request');
      }
    }

    return result;
  }

  /**
   * Helper to create error responses
   */
  static createErrorResponse(message: string, status: number = 400): NextResponse {
    return NextResponse.json({ error: message }, { status });
  }

  /**
   * Helper to create success responses
   */
  static createSuccessResponse(data: any, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
  }
}
