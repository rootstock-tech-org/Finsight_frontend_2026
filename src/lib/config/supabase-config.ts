export const supabaseConfig = {
  // Supabase project configuration - Use environment variables
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfbcpqifhbqpymnagzss.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    schema: 'public',
  },
  
  // Storage configuration
  storage: {
    bucketName: 'finsight-files',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  // Auth configuration
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
  },
  
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  
  // Edge functions configuration
  functions: {
    url: process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL,
  },
  
  // Analytics configuration
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
  },
  
  // Development configuration
  development: {
    debug: process.env.NODE_ENV === 'development',
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  },
}

// Validation function to check if required environment variables are set
export const validateSupabaseConfig = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName]
  )

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missingVars.join(', ')}`
    )
  }

  return true
}

// Get environment-specific configuration
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isProduction = process.env.NODE_ENV === 'production'
  const isTest = process.env.NODE_ENV === 'test'

  return {
    isDevelopment,
    isProduction,
    isTest,
    supabaseUrl: supabaseConfig.url,
    supabaseAnonKey: supabaseConfig.anonKey,
    debug: isDevelopment,
    logLevel: isDevelopment ? 'debug' : 'error',
  }
}

// Storage bucket configuration
export const storageBuckets = {
  documents: 'finsight-documents',
  images: 'finsight-images',
  exports: 'finsight-exports',
  temp: 'finsight-temp',
} as const

// Database table names
export const databaseTables = {
  userProfiles: 'user_profiles',
  analysisRecords: 'analysis_records',
  watchlist: 'watchlist',
  stocks: 'stocks',
  marketData: 'market_data',
  news: 'news',
  notifications: 'notifications',
  subscriptions: 'subscriptions',
} as const

// RPC function names
export const rpcFunctions = {
  searchAnalysisRecords: 'search_analysis_records',
  getUserStats: 'get_user_stats',
  getMarketSummary: 'get_market_summary',
} as const
