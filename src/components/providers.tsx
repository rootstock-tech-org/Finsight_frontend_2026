'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { LanguageProvider } from '@/context/LanguageContext';
import { SupabaseProvider } from './providers/SupabaseProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthenticated, darkMode } = useAuthStore();

  // Note: Auth state management is now handled by SupabaseProvider
  // The SupabaseProvider will handle user authentication state

  // Use a mounted state to prevent hydration mismatches
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Only apply dark mode after component has mounted to prevent hydration mismatch
  React.useEffect(() => {
    if (mounted) {
      try {
        if (darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        // Handle cases where DOM manipulation fails (e.g., browser extensions)
        console.warn('Failed to apply dark mode:', error);
      }
    }
  }, [darkMode, mounted]);

  // Apply initial theme based on store
  React.useEffect(() => {
    if (mounted) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [mounted, darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
} 