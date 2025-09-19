'use client';

import React, { useState, useEffect } from "react";
import { useTranslation } from "../../context/LanguageContext";
import {
  Eye,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSupabase } from "../../components/providers/SupabaseProvider";

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithOtp, resetPassword, user, loading: authLoading } = useSupabase();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentForm, setCurrentForm] = useState<"signin" | "forgot">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Success message state for password reset
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (currentForm === "signin") {
        // Login existing user with Supabase
        const { user, error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else if (user) {
          // User will be automatically redirected by useEffect
          setSuccessMessage('Login successful! Redirecting...');
        }
      } else if (currentForm === "forgot") {
        // Try OTP first, fallback to password reset if it fails
        console.log('📧 Sending OTP for email:', email);
        const { error } = await signInWithOtp(email);
        if (error) {
          console.error('❌ OTP send failed:', error);
          
          // If OTP fails due to email config, try traditional password reset
          if (error.message.includes('Error sending magic link email') || error.status === 500) {
            console.log('🔄 Falling back to traditional password reset...');
            const { error: resetError } = await resetPassword(email);
            if (resetError) {
              setError('Failed to send password reset email. Please check your email configuration.');
            } else {
              setSuccessMessage('Password reset link sent to your email! Check your inbox.');
            }
          } else if (error.message.includes('rate limit')) {
            setError('Too many requests. Please wait a moment and try again.');
          } else if (error.message.includes('invalid email')) {
            setError('Please enter a valid email address.');
          } else {
            setError(error.message || 'Failed to send reset email. Please try again.');
          }
        } else {
          setSuccessMessage('OTP sent to your email!');
          // Redirect to OTP page
          setTimeout(() => {
            router.push(`/otp?email=${encodeURIComponent(email)}`);
          }, 1500);
        }
        return;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message || 'Google login failed. Please try again.');
      } else {
        // Google OAuth will redirect automatically
        setSuccessMessage('Redirecting to Google...');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const switchForm = (form: "signin" | "forgot") => {
    console.log('Switching form to:', form);
    setCurrentForm(form);
    setError(null);
    setSuccessMessage(null);
  };




  const handleGoToTermsOfService = () => {
    // Navigate to terms of service page
    router.push('/terms');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900">

      {/* Back to Register Button */}
      <div className="fixed top-4 left-4 z-40">
        <button
          onClick={() => router.push('/register')}
          className="flex items-center space-x-2 p-2 rounded-lg transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="font-medium text-sm">{t('login.backToRegister')}</span>
        </button>
      </div>

      {/* Left Side - Login Form */}
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
              {currentForm === "signin" ? t('login.motto') : "Reset Password"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentForm === "signin" ? t('login.subtitle') : "Enter your email to receive an OTP"}
            </p>

            
            {/* Feature Highlights - Only show in signin mode */}
            {currentForm === "signin" && (
              <div className="text-center mt-4">
              <div className="flex justify-center items-center space-x-6 text-xs">
                {/* Document to Decision */}
                <div className="group relative flex items-center space-x-1">
                  <span>📄</span>
                  <span className="font-medium text-gray-900 dark:text-white">Document to Decision</span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Upload reports. Get clarity. No jargon.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                {/* Personalized Alerts */}
                <div className="group relative flex items-center space-x-1">
                  <span className="text-blue-600">🔔</span>
                  <span className="font-medium text-gray-900 dark:text-white">Personalized Alerts</span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Get AI-curated updates on IPOs, bulk deals & insider moves.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                </div>

                {/* So What Score */}
                <div className="group relative flex items-center space-x-1">
                  <span>🎯</span>
                  <span className="font-medium text-gray-900 dark:text-white">So What Score</span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Every insight ends in action — for you.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Login Form */}
          {/* Form Header - Back Button for Signup and Forgot Password */}
          {currentForm !== "signin" && (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => switchForm("signin")}
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span>{t('login.backToLogin')}</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('login.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                required
              />
            </div>

            {/* Password Field - Only show for signin */}
            {currentForm === "signin" && (
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                    required={currentForm === "signin"}
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
            )}

            {/* Forgot Password - Only show in signin mode */}
            {currentForm === "signin" && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => switchForm("forgot")}
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
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

            {/* Submit Button */}
            <div className="w-full">
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
                    {t('login.processing')}
                  </span>
                ) : currentForm === "signin" ? (
                  t('login.signIn')
                ) : (
                  "Send OTP"
                )}
              </button>
            </div>

            {/* Google Sign In Button */}
            {currentForm === "signin" && (
              <div className="w-full">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-teal-glow cursor-pointer bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>{t('login.signInWithGoogle')}</span>
                  </div>
                </button>
              </div>
            )}

            {/* Don't have account - Register link */}
            {currentForm === "signin" && (
              <div className="text-center">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {t('login.dontHaveAccount')}{" "}
                </span>
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="font-medium underline text-xs sm:text-sm text-[#007F99] dark:text-[#00CFC1] hover:text-[#007F99]/80 dark:hover:text-[#00CFC1]/80"
                >
                  {t('login.signUp')}
                </button>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-xs text-gray-400">
                {t('login.copyright')}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-xs text-gray-400">
                {t('login.poweredBy')}
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
              {t('login.transformData')}
            </h2>
            <p className="text-base sm:text-2xl max-w-md mx-auto text-blue-400 dark:text-gray-300">
              {t('login.transformDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 