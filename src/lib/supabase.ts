/**
 * lib/supabase.ts — stub
 *
 * Supabase has been replaced by FastAPI.
 * This file exists only to prevent "Cannot find module '@/lib/supabase'"
 * errors from any files that haven't been updated yet.
 *
 * DO NOT use these exports — they are no-ops.
 */

// Minimal no-op supabase shape so destructuring imports don't crash at runtime
export const supabase = {
  auth: {
    getSession:         async () => ({ data: { session: null }, error: null }),
    getUser:            async () => ({ data: { user: null },    error: null }),
    onAuthStateChange:  (_cb: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase removed' } }),
    signUp:             async () => ({ data: { user: null, session: null }, error: { message: 'Supabase removed' } }),
    signOut:            async () => ({ error: null }),
    signInWithOAuth:    async () => ({ error: { message: 'Google OAuth not available' } }),
    signInWithOtp:      async () => ({ data: null, error: { message: 'OTP not available' } }),
    verifyOtp:          async () => ({ data: { user: null }, error: { message: 'OTP not available' } }),
    resetPasswordForEmail: async () => ({ error: { message: 'Password reset not available' } }),
    updateUser:         async () => ({ data: { user: null }, error: { message: 'Supabase removed' } }),
  },
  from:    (_table: string) => ({ select: () => ({ data: null, error: { message: 'Supabase removed' } }) }),
  storage: { from: (_bucket: string) => ({}) },
  channel: (_name: string) => ({
    on: function() { return this },
    subscribe: function() { return this },
    unsubscribe: () => {},
    send: async () => {},
    track: async () => {},
  }),
} as any

export const createServerClient = () => supabase
export const createAdminClient = () => supabase

export default supabase