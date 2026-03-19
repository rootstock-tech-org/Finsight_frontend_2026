'use client'

/**
 * SupabaseProvider.tsx — Supabase fully removed.
 *
 * Keeps the exact same context shape (useSupabase hook, all method names)
 * so login/register/dashboard pages need zero changes.
 *
 * Auth backend: FastAPI /user_profiles/ via fastapiAuthService.
 * Session: user_id persisted in localStorage under 'finsight_user_id'.
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { fastapiAuthService } from '@/lib/services/fastapi-auth-service'
import { useAuthStore, FinSightUser } from '@/lib/store/auth-store'

// ── Context shape — identical to old Supabase version so all consumers work ──

interface SupabaseContextType {
  user: FinSightUser | null
  session: null                  // no sessions in simple auth — always null
  loading: boolean
  supabase: null                 // no supabase client — always null
  signIn:           (email: string, password: string) => Promise<{ user: FinSightUser | null; error: { message: string } | null }>
  signUp:           (email: string, password: string, firstName: string, lastName: string, mobileNumber: string, communicationPreference: 'whatsapp' | 'sms' | 'telegram', stockUpdateFrequency: 'daily' | 'weekly' | 'monthly') => Promise<{ user: FinSightUser | null; error: { message: string } | null }>
  signInWithGoogle: () => Promise<{ error: { message: string } | null }>
  signOut:          () => Promise<{ error: null }>
  resetPassword:    (email: string) => Promise<{ error: { message: string } | null }>
  signInWithOtp:    (email: string) => Promise<{ error: { message: string } | null }>
  verifyOtp:        (email: string, token: string) => Promise<{ user: null; error: { message: string } | null }>
  updatePassword:   (newPassword: string) => Promise<{ error: { message: string } | null }>
  updateProfile:    (updates: any) => Promise<{ user: FinSightUser | null; error: { message: string } | null }>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) throw new Error('useSupabase must be used within a SupabaseProvider')
  return context
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const { user, setUser } = useAuthStore()

  // Restore session on mount (reads localStorage → hits FastAPI)
  useEffect(() => {
    fastapiAuthService.restoreSession().finally(() => setLoading(false))
  }, [])

  // ── Auth methods ──────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const { user, error } = await fastapiAuthService.signIn({ email, password })
    return { user, error: error ? { message: error } : null }
  }

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    mobileNumber: string,
    communicationPreference: 'whatsapp' | 'sms' | 'telegram',
    stockUpdateFrequency: 'daily' | 'weekly' | 'monthly'
  ) => {
    const { user, error } = await fastapiAuthService.signUp({
      email, password, firstName, lastName,
      mobileNumber, communicationPreference, stockUpdateFrequency,
    })
    return { user, error: error ? { message: error } : null }
  }

  const signOut = async () => {
    await fastapiAuthService.signOut()
    return { error: null }
  }

  const updateProfile = async (updates: any) => {
    const currentUser = fastapiAuthService.getCurrentUser()
    if (!currentUser) return { user: null, error: { message: 'No user logged in' } }
    const { user, error } = await fastapiAuthService.updateProfile(currentUser.id, updates)
    return { user, error: error ? { message: error } : null }
  }

  // ── Stubs for Supabase-only features (Google OAuth, OTP, password reset) ──
  // These features aren't available in the FastAPI simple-auth mode.
  // They return a clear error message so the UI shows something helpful
  // instead of crashing.

  const signInWithGoogle = async () => ({
    error: { message: 'Google sign-in is not available in this version. Please use email & password.' }
  })

  const resetPassword = async (_email: string) => ({
    error: { message: 'Password reset is not available yet. Please contact support.' }
  })

  const signInWithOtp = async (_email: string) => ({
    error: { message: 'OTP login is not available in this version. Please use email & password.' }
  })

  const verifyOtp = async (_email: string, _token: string) => ({
    user: null,
    error: { message: 'OTP verification is not available in this version.' }
  })

  const updatePassword = async (_newPassword: string) => ({
    error: { message: 'Password update is not available yet.' }
  })

  // ── Context value ─────────────────────────────────────────────────────────

  const value: SupabaseContextType = {
    user,
    session: null,
    loading,
    supabase: null,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    signInWithOtp,
    verifyOtp,
    updatePassword,
    updateProfile,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}