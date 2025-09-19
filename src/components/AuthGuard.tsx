'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { useSupabase } from './providers/SupabaseProvider';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login' 
}) => {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, setUser, setAuthenticated } = useAuthStore();
  const { user, loading: supabaseLoading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!supabaseLoading) {
      setUser(user);
      setAuthenticated(!!user);
      setLoading(false);
      
      if (requireAuth && !user) {
        router.push(redirectTo);
      } else if (!requireAuth && user) {
        // User is logged in but trying to access login/register page
        router.push('/dashboard');
      }
    }
  }, [user, supabaseLoading, requireAuth, redirectTo, router, setUser, setAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect to login
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return <>{children}</>;
};

export default AuthGuard;
