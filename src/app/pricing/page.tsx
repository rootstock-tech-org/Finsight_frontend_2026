'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import PricingPlans from '@/components/PricingPlans';
import AuthGuard from '@/components/AuthGuard';

export default function PricingPage() {
  const router = useRouter();
  const { darkMode } = useAuthStore();

  const handleClose = () => {
    router.back();
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen">
        <PricingPlans darkMode={darkMode} onClose={handleClose} />
      </div>
    </AuthGuard>
  );
}
