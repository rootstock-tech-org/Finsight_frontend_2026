'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useTranslation } from "../../context/LanguageContext";
import {
  Eye,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabase } from "../../components/providers/SupabaseProvider";

function OTPForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithOtp, verifyOtp, updatePassword, user, loading: authLoading } = useSupabase();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<"email" | "otp" | "newPassword">("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // OTP timer and retry states
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [retries, setRetries] = useState(0);
  const maxRetries = 5;

  // Do not auto-redirect authenticated users on this page to allow password reset flow

  // Get email from URL params if available
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      setCurrentStep("otp");
      // Start timer when OTP step is reached
      setTimeLeft(60);
      setCanResend(false);
    }
  }, [searchParams]);

  // OTP Timer countdown
  useEffect(() => {
    if (currentStep === "otp" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, currentStep]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { error } = await signInWithOtp(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('OTP sent to your email!');
        setCurrentStep("otp");
        // Start timer
        setTimeLeft(60);
        setCanResend(false);
        setRetries(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { error } = await signInWithOtp(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('New OTP sent to your email!');
        setTimeLeft(60);
        setCanResend(false);
        setRetries(0);
        setOtp("");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    // Check retry limit
    if (retries >= maxRetries) {
      setError(`Too many attempts. Please request a new OTP.`);
      setLoading(false);
      return;
    }

    // Check if OTP has expired
    if (timeLeft === 0) {
      setError('OTP has expired. Please request a new one.');
      setLoading(false);
      return;
    }

    try {
      const { user, error } = await verifyOtp(email, otp);
      if (error) {
        setError(error.message);
        setRetries(prev => prev + 1);
      } else if (user) {
        setSuccessMessage('OTP verified successfully!');
        setCurrentStep("newPassword");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setRetries(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep === "otp") {
      setCurrentStep("email");
      setOtp("");
    } else if (currentStep === "newPassword") {
      setCurrentStep("otp");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900">

      {/* Back to Login Button */}
      <div className="fixed top-4 left-4 z-40">
        <button
          onClick={() => router.push('/login')}
          className="flex items-center space-x-2 p-2 rounded-lg transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">{t('login.backToLogin')}</span>
        </button>
      </div>

      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-2 sm:p-8 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          {/* Logo and Brand Name */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex items-center justify-center">
                <img
                  src="/navbar.png"
                  alt="FinSight Logo"
                  className="h-12 sm:h-16 md:h-11 object-contain"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                FinSight
              </h1>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl mb-2 text-gray-900 dark:text-white">
              Reset Password
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentStep === "email" && "Enter your email to receive an OTP"}
              {currentStep === "otp" && "Enter the OTP sent to your email"}
              {currentStep === "newPassword" && "Create a new password"}
            </p>
          </div>

          {/* Back Button for OTP and New Password steps */}
          {currentStep !== "email" && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span>Go Back</span>
              </button>
            </div>
          )}

          {/* Step 1: Email Form */}
          {currentStep === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
                className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-teal-glow cursor-pointer ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                } hover:opacity-90`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Form */}
          {currentStep === "otp" && (
            <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400 text-center text-lg tracking-widest"
                  required
                />
              </div>

              {/* Timer and Resend */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    OTP expires in {timeLeft} seconds
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              {/* Retry counter */}
              {retries > 0 && (
                <div className="text-center">
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Attempts: {retries}/{maxRetries}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || timeLeft === 0 || retries >= maxRetries}
                style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
                className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-teal-glow cursor-pointer ${
                  loading || timeLeft === 0 || retries >= maxRetries ? "opacity-70 cursor-not-allowed" : ""
                } hover:opacity-90`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : retries >= maxRetries ? (
                  "Too Many Attempts"
                ) : timeLeft === 0 ? (
                  "OTP Expired"
                ) : (
                  "Verify OTP"
                )}
              </button>
            </form>
          )}

          {/* Step 3: New Password Form */}
          {currentStep === "newPassword" && (
            <form onSubmit={handleUpdatePassword} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
                className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-teal-glow cursor-pointer ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                } hover:opacity-90`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Updating Password...
                  </span>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{error}</span>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="p-3 rounded-lg flex items-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm">{successMessage}</span>
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-xs text-gray-400">
                © 2024 FinSight. All rights reserved.
              </span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-xs text-gray-400">
                Powered by
              </span>
              <img 
                src="/RootStock.jpeg" 
                alt="Rootstock Technologies" 
                className="w-4 h-4 object-contain bg-white rounded"
              />
              <span className="text-xs text-gray-400">
                Rootstock Technologies
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Features/Benefits */}
      <div className="hidden lg:block lg:w-1/2 relative bg-gray-900 dark:bg-gray-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-2 text-white dark:text-blue-400">
              Secure Password Reset
            </h2>
            <p className="text-base sm:text-2xl max-w-md mx-auto text-blue-400 dark:text-gray-300">
              Get back to your account with our secure verification process
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OTPForm />
    </Suspense>
  );
}