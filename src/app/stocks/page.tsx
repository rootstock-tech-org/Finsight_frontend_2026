'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import AuthGuard from '@/components/AuthGuard';
import StockSelection from '@/components/StockSelection';

export default function StocksPage() {
  const router = useRouter();
  const { darkMode } = useAuthStore();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <AuthGuard requireAuth={true}>
      <StockSelection darkMode={darkMode} onComplete={handleComplete} />
    </AuthGuard>
  );
}
