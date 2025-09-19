import { TokenValidator } from '@/lib/auth/token-validator';

export interface InvitationFormState {
  id?: string;
  user_id: string;
  token: string;
  form_data: any;
  step: string;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  userId?: string;
  email?: string;
  expiresAt?: string;
  error?: string;
}

export class InvitationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/invitation';
  }

  /**
   * Validate an invitation token
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          valid: false,
          error: data.error || 'Token validation failed'
        };
      }

      return data;
    } catch (error) {
      console.error('Error validating token:', error);
      return {
        valid: false,
        error: 'Network error during token validation'
      };
    }
  }

  /**
   * Get invitation form state
   */
  async getFormState(token: string): Promise<{ formState?: InvitationFormState; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/form-state?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Failed to fetch form state'
        };
      }

      return { formState: data.formState };
    } catch (error) {
      console.error('Error fetching form state:', error);
      return {
        error: 'Network error while fetching form state'
      };
    }
  }

  /**
   * Save invitation form state
   */
  async saveFormState(
    token: string,
    formData: any,
    step: string,
    completed: boolean = false
  ): Promise<{ formState?: InvitationFormState; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/form-state`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          form_data: formData,
          step,
          completed
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Failed to save form state'
        };
      }

      return { formState: data.formState };
    } catch (error) {
      console.error('Error saving form state:', error);
      return {
        error: 'Network error while saving form state'
      };
    }
  }

  /**
   * Update invitation form state
   */
  async updateFormState(
    token: string,
    updates: {
      form_data?: any;
      step?: string;
      completed?: boolean;
    }
  ): Promise<{ formState?: InvitationFormState; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/form-state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Failed to update form state'
        };
      }

      return { formState: data.formState };
    } catch (error) {
      console.error('Error updating form state:', error);
      return {
        error: 'Network error while updating form state'
      };
    }
  }

  /**
   * Delete invitation form state
   */
  async deleteFormState(token: string): Promise<{ success?: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/form-state`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Failed to delete form state'
        };
      }

      return { success: data.success };
    } catch (error) {
      console.error('Error deleting form state:', error);
      return {
        error: 'Network error while deleting form state'
      };
    }
  }

  /**
   * Extract token from URL
   */
  static extractTokenFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }

  /**
   * Extract token from hash
   */
  static extractTokenFromHash(): string | null {
    if (typeof window === 'undefined') return null;
    
    const hash = window.location.hash;
    const match = hash.match(/[?&]token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Extract token from URL or hash
   */
  static extractToken(): string | null {
    return this.extractTokenFromUrl() || this.extractTokenFromHash();
  }
}

// Export singleton instance
export const invitationService = new InvitationService();
