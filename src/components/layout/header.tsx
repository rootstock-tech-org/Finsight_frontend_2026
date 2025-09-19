'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth-store';
import { supabaseDatabaseService, UserProfileExternal } from '@/lib/services/supabase-database-service';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, X, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const { user, isAuthenticated, darkMode, toggleDarkMode, logout } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileExternal | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          setProfileLoading(true);
          const { data, error } = await supabaseDatabaseService.getUserProfile(user.id);
          if (error) {
            console.error('Error fetching user profile:', error);
          } else {
            setUserProfile(data);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get display name for user
  const getDisplayName = () => {
    if (profileLoading) return 'User';
    if (userProfile?.first_name) return userProfile.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo - Left side */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              <Link href="/" className="flex items-center space-x-2">
                <img 
                  src="/navbar.png" 
                  alt="FinSight Logo" 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  FinSight
                </span>
              </Link>
            </div>

            {/* Navigation Options - Right side */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              {isMounted && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                  aria-label="Toggle dark mode"
                  title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {darkMode ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  )}
                </button>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {getDisplayName()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-1 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button className="h-10 px-6 text-sm bg-gray-200 hover:bg-gray-100 text-gray-900 font-medium rounded-lg border-0 shadow-none">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="h-10 px-6 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg border-0 shadow-none">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-gray-900/50 dark:bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity duration-200",
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!isMenuOpen}
        onClick={onMenuToggle}
      />
      
      <nav 
        className={cn(
          "fixed top-[61px] left-0 bottom-0 z-40 w-64 shadow-xl transform transition-transform duration-200 ease-in-out lg:hidden overflow-y-auto bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-4 py-6 space-y-6">
          <div className="pt-0">
            {isAuthenticated ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start py-2 px-4 rounded-lg font-medium transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            ) : (
              <div className="space-y-2">
                <Link href="/login" onClick={onMenuToggle}>
                  <Button variant="outline" className="w-full justify-center border-gray-200 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={onMenuToggle}>
                  <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
} 