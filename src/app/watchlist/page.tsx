'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Watchlist from '@/components/Watchlist';
import { useAuthStore } from '@/lib/store/auth-store';

export default function WatchlistPage() {
  const router = useRouter();
  const { darkMode } = useAuthStore();

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleSelectMoreStocks = () => {
    router.push('/stocks');
  };

  return (
    <AuthGuard>
      <Watchlist
        darkMode={darkMode}
        onBack={handleBack}
        onSelectMoreStocks={handleSelectMoreStocks}
      />
    </AuthGuard>
  );
}
