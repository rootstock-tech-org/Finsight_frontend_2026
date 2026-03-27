'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { Eye, EyeOff, AlertCircle, ChevronLeft, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

// ── API helpers ────────────────────────────────────────────────────────────
async function sendOtp(email: string) {
  const res = await fetch(`${FASTAPI}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Failed to send OTP');
}

async function verifyOtp(email: string, otp: string): Promise<string> {
  const res = await fetch(`${FASTAPI}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? data.error ?? 'OTP verification failed');
  // backend returns a short-lived reset token
  return data.reset_token as string;
}

async function updatePassword(resetToken: string, newPassword: string) {
  const res = await fetch(`${FASTAPI}/auth/update-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
    body: JSON.stringify({ reset_token: resetToken, new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? data.error ?? 'Failed to update password');
}

// ── Form ───────────────────────────────────────────────────────────────────
function OTPForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [retries, setRetries] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setCurrentStep('otp');
      setTimeLeft(60);
      setCanResend(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentStep !== 'otp' || timeLeft <= 0) {
      if (timeLeft === 0) setCanResend(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, currentStep]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccessMessage(null); setLoading(true);
    try {
      await sendOtp(email);
      setSuccessMessage('OTP sent to your email!');
      setCurrentStep('otp');
      setTimeLeft(60); setCanResend(false); setRetries(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally { setLoading(false); }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setError(null); setSuccessMessage(null); setLoading(true);
    try {
      await sendOtp(email);
      setSuccessMessage('New OTP sent!');
      setTimeLeft(60); setCanResend(false); setRetries(0); setOtp('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccessMessage(null);
    if (retries >= maxRetries) { setError('Too many attempts. Please request a new OTP.'); return; }
    if (timeLeft === 0) { setError('OTP has expired. Please request a new one.'); return; }
    setLoading(true);
    try {
      const token = await verifyOtp(email, otp);
      setResetToken(token);
      setSuccessMessage('OTP verified!');
      setCurrentStep('newPassword');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRetries(r => r + 1);
    } finally { setLoading(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccessMessage(null);
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true);
    try {
      await updatePassword(resetToken, newPassword);
      setSuccessMessage('Password updated! Redirecting...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally { setLoading(false); }
  };

  const goBack = () => {
    if (currentStep === 'otp') { setCurrentStep('email'); setOtp(''); }
    else if (currentStep === 'newPassword') { setCurrentStep('otp'); setNewPassword(''); setConfirmPassword(''); }
  };

  const spinnerSvg = (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900">
      <div className="fixed top-4 left-4 z-40">
        <button onClick={() => router.push('/login')}
          className="flex items-center space-x-2 p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">{t('login.backToLogin')}</span>
        </button>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-2 sm:p-8 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/navbar.png" alt="FinSight Logo" className="h-12 sm:h-16 md:h-11 object-contain" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">FinSight</h1>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl mb-2 text-gray-900 dark:text-white">Reset Password</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentStep === 'email' && 'Enter your email to receive an OTP'}
              {currentStep === 'otp' && 'Enter the OTP sent to your email'}
              {currentStep === 'newPassword' && 'Create a new password'}
            </p>
          </div>

          {currentStep !== 'email' && (
            <button type="button" onClick={goBack}
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <ChevronLeft className="w-5 h-5 mr-1" /> Go Back
            </button>
          )}

          {currentStep === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address" required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-700" />
              </div>
              <button type="submit" disabled={loading}
                style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
                className={`w-full px-8 py-4 rounded-xl font-semibold transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}>
                {loading ? <span className="flex items-center justify-center">{spinnerSvg}Sending OTP...</span> : 'Send OTP'}
              </button>
            </form>
          )}

          {currentStep === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">OTP Code</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP" maxLength={6} required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-green-700" />
              </div>
              <div className="text-center">
                {timeLeft > 0
                  ? <p className="text-sm text-gray-600 dark:text-gray-400">OTP expires in {timeLeft}s</p>
                  : <button type="button" onClick={handleResendOTP} disabled={loading}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 disabled:opacity-50">
                      Resend OTP
                    </button>}
              </div>
              {retries > 0 && <p className="text-xs text-center text-orange-600">Attempts: {retries}/{maxRetries}</p>}
              <button type="submit" disabled={loading || timeLeft === 0 || retries >= maxRetries}
                style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
                className={`w-full px-8 py-4 rounded-xl font-semibold transition-all ${loading || timeLeft === 0 || retries >= maxRetries ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}>
                {loading ? <span className="flex items-center justify-center">{spinnerSvg}Verifying...</span>
                  : retries >= maxRetries ? 'Too Many Attempts' : timeLeft === 0 ? 'OTP Expired' : 'Verify OTP'}
              </button>
            </form>
          )}

          {currentStep === 'newPassword' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-6">
              {[
                { label: 'New Password', value: newPassword, setter: setNewPassword, show: showPassword, toggle: () => setShowPassword(v => !v) },
                { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggle: () => setShowConfirmPassword(v => !v) },
              ].map(({ label, value, setter, show, toggle }) => (
                <div key={label}>
                  <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{label}</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} value={value} onChange={e => setter(e.target.value)}
                      placeholder={label} required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 rounded-xl border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-700" />
                    <button type="button" onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                      {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={loading}
                style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
                className={`w-full px-8 py-4 rounded-xl font-semibold transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'}`}>
                {loading ? <span className="flex items-center justify-center">{spinnerSvg}Updating...</span> : 'Update Password'}
              </button>
            </form>
          )}

          {error && (
            <div className="p-3 rounded-lg flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-lg flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{successMessage}</span>
            </div>
          )}

          <div className="text-center">
            <span className="text-xs text-gray-400">© 2024 FinSight. All rights reserved.</span>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-2 text-white">Secure Password Reset</h2>
          <p className="text-base sm:text-2xl max-w-md mx-auto text-blue-400">Get back to your account with our secure verification process</p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return <Suspense fallback={<LoadingFallback />}><OTPForm /></Suspense>;
}