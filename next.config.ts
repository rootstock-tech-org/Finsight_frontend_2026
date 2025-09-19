import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add experimental features to handle hydration issues better
  experimental: {
    // Improve hydration resilience
    optimizePackageImports: ['@supabase/supabase-js'],
  },
};

export default nextConfig;
