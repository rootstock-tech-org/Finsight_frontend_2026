'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, X, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

interface UserProfile { first_name?: string; email?: string; }

export default function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const { user, isAuthenticated, darkMode, toggleDarkMode, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    const userId = user?.id ?? (typeof window !== 'undefined' ? localStorage.getItem('user_id') : null);
    if (!userId) return;

    fetch(`${FASTAPI}/users/${userId}`, {
  method: "GET",
  headers: {
    "Authorization": `Bearer ${userId}`,
    "ngrok-skip-browser-warning": "true"
  }
})
  .then(r => r.ok ? r.json() : null)
  .then(data => { if (data) setUserProfile(data); })
  .catch(() => {});
}, [user?.id]);

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout error:', e); }
  };

  const displayName = userProfile?.first_name
    ?? user?.email?.split('@')[0]
    ?? 'User';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600">
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <Link href="/" className="flex items-center space-x-2">
                <img src="/navbar.png" alt="FinSight Logo" className="h-8 w-auto" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">FinSight</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              {isMounted && (
                <button onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800">
                  {darkMode
                    ? <Sun className="w-5 h-5 text-yellow-500" />
                    : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{displayName}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}
                    className="flex items-center space-x-1 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button className="h-10 px-6 text-sm bg-gray-200 hover:bg-gray-100 text-gray-900 font-medium rounded-lg border-0">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="h-10 px-6 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg border-0">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={cn('fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-200',
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={onMenuToggle}
      />

      <nav className={cn(
        'fixed top-[61px] left-0 bottom-0 z-40 w-64 shadow-xl transform transition-transform duration-200 ease-in-out lg:hidden overflow-y-auto bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700',
        isMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="px-4 py-6">
          {isAuthenticated ? (
            <Button variant="ghost" onClick={handleLogout}
              className="w-full justify-start py-2 px-4 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={onMenuToggle}>
                <Button variant="outline" className="w-full border-gray-200 dark:border-slate-600">Login</Button>
              </Link>
              <Link href="/register" onClick={onMenuToggle}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}