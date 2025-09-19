import { createClient } from '@supabase/supabase-js'

interface SupabaseKeys {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

class SupabaseKeyManager {
  private keys: SupabaseKeys | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

  /**
   * Get Supabase keys with caching and automatic refresh
   */
  async getKeys(): Promise<SupabaseKeys> {
    const now = Date.now()
    
    // Return cached keys if they're still valid
    if (this.keys && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.keys
    }

    // Fetch fresh keys
    await this.refreshKeys()
    return this.keys!
  }

  /**
   * Refresh Supabase keys from environment or API
   */
  private async refreshKeys(): Promise<void> {
    try {
      // Method 1: Environment variables (recommended for production)
      if (this.getKeysFromEnvironment()) {
        console.log('✅ Using environment variables for Supabase keys')
        return
      }

      // Method 2: API endpoint for dynamic key fetching (if you set this up)
      if (await this.fetchKeysFromAPI()) {
        console.log('✅ Fetched Supabase keys from API')
        return
      }

      // Method 3: Fallback to hardcoded keys (not recommended)
      this.useFallbackKeys()
      
    } catch (error) {
      console.error('❌ Error refreshing Supabase keys:', error)
      this.useFallbackKeys()
    }
  }

  /**
   * Get keys from environment variables
   */
  private getKeysFromEnvironment(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (url && anonKey) {
      this.keys = {
        url,
        anonKey,
        serviceRoleKey: serviceRoleKey || undefined
      }
      this.lastFetch = Date.now()
      return true
    }

    return false
  }

  /**
   * Fetch keys from a custom API endpoint (optional)
   * You can set up an endpoint that returns fresh keys
   */
  private async fetchKeysFromAPI(): Promise<boolean> {
    try {
      // Example: Fetch from your own API endpoint
      // const response = await fetch('/api/supabase-keys')
      // if (response.ok) {
      //   this.keys = await response.json()
      //   this.lastFetch = Date.now()
      //   return true
      // }
      return false
    } catch (error) {
      console.warn('API key fetching not configured, using fallback')
      return false
    }
  }

  /**
   * Use fallback keys (development only)
   */
  private useFallbackKeys(): void {
    console.warn('⚠️ Using fallback Supabase keys - not recommended for production')
    
    this.keys = {
      url: 'https://pfbcpqifhbqpymnagzss.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYmNwcWlmaGJxcHltbmFnenNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTk3MjYsImV4cCI6MjA3MTc3NTcyNn0.GrGMT7osZzP56sJzF5cNp620e2eLJrv2veIjCbaQiVA',
    }
    this.lastFetch = Date.now()
  }

  /**
   * Force refresh of keys
   */
  async forceRefresh(): Promise<void> {
    this.lastFetch = 0
    await this.refreshKeys()
  }

  /**
   * Get current keys without refreshing
   */
  getCurrentKeys(): SupabaseKeys | null {
    return this.keys
  }

  /**
   * Check if keys are expired
   */
  isExpired(): boolean {
    if (!this.keys || !this.lastFetch) return true
    const now = Date.now()
    return (now - this.lastFetch) >= this.CACHE_DURATION
  }
}

// Export singleton instance
export const supabaseKeyManager = new SupabaseKeyManager()

/**
 * Create Supabase client with managed keys
 */
export const createManagedSupabaseClient = async () => {
  const keys = await supabaseKeyManager.getKeys()
  return createClient(keys.url, keys.anonKey)
}

/**
 * Create admin Supabase client with managed keys
 */
export const createManagedAdminClient = async () => {
  const keys = await supabaseKeyManager.getKeys()
  if (!keys.serviceRoleKey) {
    throw new Error('Service role key not available')
  }
  return createClient(keys.url, keys.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
