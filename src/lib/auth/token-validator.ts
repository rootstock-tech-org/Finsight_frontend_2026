import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TokenValidationResult {
  isValid: boolean;
  userId?: string;
  email?: string;
  expiresAt?: Date;
  error?: string;
}

export interface InvitationToken {
  id: string;
  token: string;
  user_id: string;
  email: string;
  expires_at: string;
  used: boolean;
  created_at: string;
  updated_at: string;
}

export class TokenValidator {
  /**
   * Validate an invitation token
   */
  static async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      if (!token) {
        return {
          isValid: false,
          error: 'Token is required'
        };
      }

      // Query the invitation_tokens table
      const { data, error } = await supabase
        .from('invitation_tokens')
        .select('*')
        .eq('token', token)
        .eq('used', false)
        .single();

      if (error) {
        console.error('Token validation error:', error);
        return {
          isValid: false,
          error: 'Invalid or expired token'
        };
      }

      if (!data) {
        return {
          isValid: false,
          error: 'Token not found'
        };
      }

      // Check if token is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();

      if (now > expiresAt) {
        return {
          isValid: false,
          error: 'Token has expired'
        };
      }

      return {
        isValid: true,
        userId: data.user_id,
        email: data.email,
        expiresAt: expiresAt
      };

    } catch (error) {
      console.error('Token validation exception:', error);
      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }

  /**
   * Mark a token as used
   */
  static async markTokenAsUsed(token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invitation_tokens')
        .update({ used: true, updated_at: new Date().toISOString() })
        .eq('token', token);

      if (error) {
        console.error('Error marking token as used:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception marking token as used:', error);
      return false;
    }
  }

  /**
   * Create a new invitation token
   */
  static async createToken(
    userId: string, 
    email: string, 
    expiresInHours: number = 24
  ): Promise<{ token: string; expiresAt: Date } | null> {
    try {
      const token = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const { data, error } = await supabase
        .from('invitation_tokens')
        .insert({
          token,
          user_id: userId,
          email,
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating token:', error);
        return null;
      }

      return {
        token: data.token,
        expiresAt: new Date(data.expires_at)
      };

    } catch (error) {
      console.error('Exception creating token:', error);
      return null;
    }
  }

  /**
   * Generate a secure random token
   */
  private static generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get token from request headers or query params
   */
  static extractTokenFromRequest(request: Request): string | null {
    // Try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to get from query parameters
    const url = new URL(request.url);
    return url.searchParams.get('token');
  }
}
