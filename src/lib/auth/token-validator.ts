const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

export interface TokenValidationResult {
  isValid: boolean;
  userId?: string;
  email?: string;
  expiresAt?: Date;
  error?: string;
}

export class TokenValidator {
  static async validateToken(token: string): Promise<TokenValidationResult> {
    try {
if (!token) return { isValid: false, error: 'Token is required' };

const res = await fetch(`${FASTAPI}/invitation/tokens/validate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  body: JSON.stringify({ token }),
});

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { isValid: false, error: err.detail ?? 'Invalid or expired token' };
      }

      const data = await res.json();
      return {
        isValid: true,
        userId: data.user_id,
        email: data.email,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      };
    } catch (error) {
      console.error('Token validation error:', error);
      return { isValid: false, error: 'Token validation failed' };
    }
  }

  static async markTokenAsUsed(token: string): Promise<boolean> {
    try {
const res = await fetch(`${FASTAPI}/invitation/tokens/use`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  },
  body: JSON.stringify({ token }),
});
      return res.ok;
    } catch {
      return false;
    }
  }

  static async createToken(
    userId: string,
    email: string,
    expiresInHours = 24
  ): Promise<{ token: string; expiresAt: Date } | null> {
    try {
      const res = await fetch(`${FASTAPI}/invitation/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ user_id: userId, email, expires_in_hours: expiresInHours }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { token: data.token, expiresAt: new Date(data.expires_at) };
    } catch {
      return null;
    }
  }

  static extractTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7);
    return new URL(request.url).searchParams.get('token');
  }
}