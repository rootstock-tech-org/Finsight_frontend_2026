'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { LanguageProvider } from '@/context/LanguageContext';
import { fastapiAuthService } from '@/lib/services/fastapi-auth-service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const { darkMode } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Restore session once on app load — sets isHydrated=true when done
    fastapiAuthService.restoreSession();
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    try {
      document.documentElement.classList.toggle('dark', darkMode);
    } catch (e) {
      console.warn('Failed to apply dark mode:', e);
    }
  }, [darkMode, mounted]);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </QueryClientProvider>
  );
}