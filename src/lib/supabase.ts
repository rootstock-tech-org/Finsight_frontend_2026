import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`
    Missing Supabase environment variables!
    
    Please create a .env.local file with:
    NEXT_PUBLIC_SUPABASE_URL=https://pfbcpqifhbqpymnagzss.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
    
    Current values:
    NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl || 'NOT SET'}
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'SET' : 'NOT SET'}
  `)
}

// Debug logging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase Configuration:')
  console.log('URL:', supabaseUrl)
  console.log('Anon Key exists:', !!supabaseAnonKey)
  console.log('Anon Key length:', supabaseAnonKey?.length || 0)
  console.log('Anon Key starts with:', supabaseAnonKey?.substring(0, 20) || 'N/A')
}

// Browser client for client-side usage
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Server client for server-side usage
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Admin client for server-side operations (use with caution)
export const createAdminClient = () => {
  if (!serviceRoleKey) {
    throw new Error('Service role key not available. Set SUPABASE_SERVICE_ROLE_KEY in your environment variables.')
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
