'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import DocumentIntelligence from '@/components/DocumentIntelligence';
import AuthGuard from '@/components/AuthGuard';

export default function DocumentIntelligencePage() {
  const router = useRouter();
  const { darkMode } = useAuthStore();

  const handleClose = () => {
    router.back();
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen">
        <DocumentIntelligence />
      </div>
    </AuthGuard>
  );
}


