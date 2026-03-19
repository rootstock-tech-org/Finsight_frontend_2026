'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

async function fapiUpdatePassword(resetToken: string, newPassword: string) {
  const res = await fetch(`${FASTAPI}/auth/update-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Failed to update password');
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Expect ?reset_token=xxx in the magic link from your FastAPI backend
    const token = searchParams.get('reset_token') ?? searchParams.get('access_token');
    if (token) {
      setResetToken(token);
    } else {
      setError('Invalid or expired reset link. Please request a new password reset.');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [searchParams, router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccessMessage(null);
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (!resetToken) { setError('No valid reset token found.'); return; }
    setLoading(true);
    try {
      await fapiUpdatePassword(resetToken, newPassword);
      setSuccessMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally { setLoading(false); }
  };

  if (!resetToken && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">This password reset link is invalid or has expired.</p>
          <button onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const spinnerSvg = (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900">
      <div className="fixed top-4 left-4 z-40">
        <button onClick={() => router.push('/login')}
          className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 shadow-md">
          <ArrowLeft className="w-4 h-4" /><span className="font-medium text-sm">Back to Login</span>
        </button>
      </div>

      <div className="w-full flex items-center justify-center p-2 sm:p-8 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/navbar.png" alt="FinSight Logo" className="h-12 sm:h-16 md:h-11 object-contain" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">FinSight</h1>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl mb-2 text-gray-900 dark:text-white">Set New Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Enter your new password below</p>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-6">
            {[
              { label: 'New Password', value: newPassword, setter: setNewPassword, show: showPassword, toggle: () => setShowPassword(v => !v) },
              { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(v => !v) },
            ].map(({ label, value, setter, show, toggle }) => (
              <div key={label}>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{label}</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} value={value} onChange={e => setter(e.target.value)}
                    placeholder={label} required minLength={6}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-700" />
                  <button type="button" onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}

            {error && (
              <div className="p-3 rounded-lg flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /><span className="text-xs sm:text-sm">{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="p-3 rounded-lg flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" /><span className="text-xs sm:text-sm">{successMessage}</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
              className={`w-full px-8 py-4 rounded-xl font-semibold transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}>
              {loading ? <span className="flex items-center justify-center">{spinnerSvg}Updating Password...</span> : 'Update Password'}
            </button>
          </form>

          <div className="text-center">
            <span className="text-xs text-gray-400">© 2024 FinSight. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<LoadingFallback />}><ResetPasswordForm /></Suspense>;
}