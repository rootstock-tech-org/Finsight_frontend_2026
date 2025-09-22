import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Skip ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  // Add experimental features to handle hydration issues better
  experimental: {
    // Improve hydration resilience
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  compiler: {
    // Strip console.* in production client bundles
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false
  }
};

export default nextConfig;