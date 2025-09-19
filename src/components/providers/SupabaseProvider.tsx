'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { supabaseAuthService } from '@/lib/services/supabase-auth-service'
import { useAuthStore } from '@/lib/store/auth-store'

interface SupabaseContextType {
  user: User | null
  session: Session | null
  loading: boolean
  supabase: typeof supabase
  signIn: (email: string, password: string) => Promise<{ user: any; error: any }>
  signUp: (email: string, password: string, firstName: string, lastName: string, mobileNumber: string, communicationPreference: 'whatsapp' | 'sms' | 'telegram', stockUpdateFrequency: 'daily' | 'weekly' | 'monthly') => Promise<{ user: any; error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  signInWithOtp: (email: string) => Promise<{ error: any }>
  verifyOtp: (email: string, token: string) => Promise<{ user: any; error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  updateProfile: (updates: any) => Promise<{ user: any; error: any }>
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

interface SupabaseProviderProps {
  children: React.ReactNode
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setAuthStoreUser, setAuthenticated } = useAuthStore()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          // Update auth store
          setAuthStoreUser(session?.user ?? null)
          setAuthenticated(!!session?.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.id);
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Handle password recovery
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔄 Password recovery detected, redirecting to reset page');
          // Don't redirect here, let the reset-password page handle it
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    return await supabaseAuthService.signIn({ email, password })
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
    return await supabaseAuthService.signUp({ 
      email, 
      password, 
      firstName, 
      lastName, 
      mobileNumber, 
      communicationPreference, 
      stockUpdateFrequency 
    })
  }

  const signInWithGoogle = async () => {
    return await supabaseAuthService.signInWithGoogle()
  }

  const signOut = async () => {
    return await supabaseAuthService.signOut()
  }

  const resetPassword = async (email: string) => {
    return await supabaseAuthService.resetPassword(email)
  }

  const signInWithOtp = async (email: string) => {
    return await supabaseAuthService.signInWithOtp(email)
  }

  const verifyOtp = async (email: string, token: string) => {
    return await supabaseAuthService.verifyOtp(email, token)
  }

  const updatePassword = async (newPassword: string) => {
    if (!user) {
      return { error: { message: 'No user logged in' } }
    }
    return await supabaseAuthService.updatePassword(newPassword)
  }

  const updateProfile = async (updates: any) => {
    if (!user) {
      return { user: null, error: { message: 'No user logged in' } }
    }
    return await supabaseAuthService.updateProfile(updates)
  }

  const value: SupabaseContextType = {
    user,
    session,
    loading,
    supabase,
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
