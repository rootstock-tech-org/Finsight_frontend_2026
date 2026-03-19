/**
 * FastAPI backend configuration
 * Replaces supabase-config.ts — all data now flows through your FastAPI backend.
 */

export const fastapiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_FASTAPI_URL ?? '',

  storage: {
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    allowedFileTypes: [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },

  development: {
    debug: process.env.NODE_ENV === 'development',
  },
};

/** Database table/endpoint names (used for documentation / type safety) */
export const apiEndpoints = {
  userProfiles:    '/users',
  analysisResults: '/analysis_results',
  watchlist:       '/watchlist',
  stocks:          '/stocks',
  marketData:      '/market-data',
  news:            '/news',
  quota: '/user_profiles/:id/quota',  
  searchHistory:   '/search-history',
  invitationTokens:'/invitation/tokens',
  invitationForms: '/invitation/form-state',
} as const;

export function validateFastapiConfig() {
  if (!fastapiConfig.baseUrl) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_FASTAPI_URL');
  }
  return true;
}

export function getEnvironmentConfig() {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction:  process.env.NODE_ENV === 'production',
    isTest:        process.env.NODE_ENV === 'test',
    fastapiUrl:    fastapiConfig.baseUrl,
    debug:         fastapiConfig.development.debug,
  };
}