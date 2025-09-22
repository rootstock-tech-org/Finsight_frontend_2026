import { supabase } from '../supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  error: AuthError | null
}

export interface SignUpParams {
  email: string
  password: string
  firstName: string
  lastName: string
  mobileNumber: string
  communicationPreference: 'whatsapp' | 'sms' | 'telegram'
  stockUpdateFrequency: 'daily' | 'weekly' | 'monthly'
}

export interface SignInParams {
  email: string
  password: string
}

export interface GoogleSignInParams {
  redirectTo?: string
}

export class SupabaseAuthService {
  // Sign up a new user
  async signUp({ 
    email, 
    password, 
    firstName, 
    lastName, 
    mobileNumber, 
    communicationPreference, 
    stockUpdateFrequency 
  }: SignUpParams): Promise<AuthResult> {
    try {
      console.log('Attempting signup with email:', email);
      console.log('Supabase client exists:', !!supabase);
      
      // Convert text values to integer IDs for database compatibility
      const commPrefMap: { [key: string]: number } = {
        'whatsapp': 1,
        'sms': 2,
        'telegram': 3
      };
      
      const stockFreqMap: { [key: string]: number } = {
        'daily': 1,
        'weekly': 2,
        'monthly': 3
      };
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            name: `${firstName} ${lastName}`,
            mobile_number: mobileNumber,
            communication_preference: communicationPreference,
            stock_update_frequency: stockUpdateFrequency,
            // Also store the integer IDs for the trigger
            comm_pref_id: commPrefMap[communicationPreference] || 1,
            stock_freq_id: stockFreqMap[stockUpdateFrequency] || 1,
          },
        },
      })

      if (error) {
        console.error('Signup error details:', error);
        console.error('Error code:', error.status);
        console.error('Error message:', error.message);
      } else {
        console.log('Signup successful:', data.user?.id);
      }

      return {
        user: data.user,
        error: error as AuthError,
      }
    } catch (error) {
      console.error('Signup exception:', error);
      return {
        user: null,
        error: error as AuthError,
      }
    }
  }

  // Sign in existing user
  async signIn({ email, password }: SignInParams): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      return {
        user: data.user,
        error: error as AuthError,
      }
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      }
    }
  }

  // Sign in with Google OAuth
  async signInWithGoogle({ redirectTo }: GoogleSignInParams = {}): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/dashboard`,
        },
      })

      return { error: error as AuthError }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Sign out current user
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { error: error as AuthError }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error: error as AuthError }
    } catch (error) {
      return { user: null, error: error as AuthError }
    }
  }

  // Get current session
  async getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error: error as AuthError }
    } catch (error) {
      return { session: null, error: error as AuthError }
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error: error as AuthError }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Send OTP for password reset
  async signInWithOtp(email: string): Promise<{ error: AuthError | null }> {
    try {
      console.log('🔐 Attempting to send OTP to:', email);
      
      const { data, error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          shouldCreateUser: true, // Allow creating user if they don't exist
        }
      })
      
      if (error) {
        console.error('❌ OTP Error Details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });
      } else {
        console.log('✅ OTP sent successfully:', data);
      }
      
      return { error: error as AuthError }
    } catch (error) {
      console.error('❌ OTP Exception:', error);
      return { error: error as AuthError }
    }
  }

  // Verify OTP
  async verifyOtp(email: string, token: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      return { 
        user: data.user,
        error: error as AuthError 
      }
    } catch (error) {
      return { 
        user: null,
        error: error as AuthError 
      }
    }
  }

  // Update user password
  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })
      return { error: error as AuthError }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  // Update user profile
  async updateProfile(updates: any): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      })

      return {
        user: data.user,
        error: error as AuthError,
      }
    } catch (error) {
      return {
        user: null,
        error: error as AuthError,
      }
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Export singleton instance
export const supabaseAuthService = new SupabaseAuthService()
