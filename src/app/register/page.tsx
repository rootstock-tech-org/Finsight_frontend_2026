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


export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signUp, signInWithGoogle, user } = useSupabase();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [communicationPreference, setCommunicationPreference] = useState<"sms" | "whatsapp" | "telegram">("whatsapp");
  const [stockUpdateFrequency, setStockUpdateFrequency] = useState<"daily" | "weekly" | "monthly">("daily");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // Custom dropdown states
  const [showCommunicationDropdown, setShowCommunicationDropdown] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);

  // Password strength validation
  const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: t('register.passwordTooShort') };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: t('register.passwordNoUppercase') };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: t('register.passwordNoLowercase') };
    }
    if (!/\d/.test(password)) {
      return { isValid: false, message: t('register.passwordNoNumber') };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: t('register.passwordNoSpecial') };
    }
    // Check for common weak passwords
    const weakPasswords = ['12345678', 'password', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.includes(password.toLowerCase())) {
      return { isValid: false, message: t('register.passwordTooWeak') };
    }
    return { isValid: true, message: t('register.passwordStrong') };
  };

  const passwordStrength = validatePasswordStrength(password);

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
      // Validate required fields
      if (!firstName.trim()) {
        throw new Error(t('register.firstNameRequired'));
      }
      if (!lastName.trim()) {
        throw new Error(t('register.lastNameRequired'));
      }
      if (!mobileNumber.trim()) {
        throw new Error(t('register.mobileNumberRequired'));
      }
      // Validate mobile number format (basic validation for Indian numbers)
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(mobileNumber.trim())) {
        throw new Error(t('register.mobileNumberInvalid'));
      }
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error(t('register.passwordsDoNotMatch'));
      }
      // Validate password strength
      if (!passwordStrength.isValid) {
        throw new Error(passwordStrength.message);
      }
      // Register new user with Supabase
      const { user, error } = await signUp(
        email, 
        password, 
        firstName.trim(), 
        lastName.trim(), 
        mobileNumber.trim(), 
        communicationPreference, 
        stockUpdateFrequency
      );
      if (error) {
        setError(error.message);
      } else if (user) {
        setSuccessMessage('Registration successful! Redirecting to dashboard...');
        // User will be automatically redirected by useEffect
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message || 'Google sign-up failed. Please try again.');
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




  const getCommunicationIcon = (pref: string) => {
    switch (pref) {
      case 'whatsapp': return '📱';
      case 'sms': return '💬';
      case 'telegram': return '📨';
      default: return '📱';
    }
  };

  const getFrequencyIcon = (freq: string) => {
    switch (freq) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'monthly': return '📈';
      default: return '📅';
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
          <ChevronLeft className="w-4 h-4" />
          <span className="font-medium text-sm">{t('register.backToLogin')}</span>
        </button>
      </div>

      {/* Left Side - Registration Form */}
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
              {t('register.motto')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('register.subtitle')}
            </p>
            
            {/* Feature Highlights */}
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
                  <span className="font-medium text-gray-900 dark:text-white">So What Score™️</span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Every insight ends in action — for you.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* First Name and Last Name - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('register.firstName')}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('register.firstNamePlaceholder')}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('register.lastName')}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('register.lastNamePlaceholder')}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                  required
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.mobileNumber')}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder={t('register.mobileNumberPlaceholder')}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                required
                maxLength={10}
              />
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {t('register.mobileNumberHelp')}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.email')}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('register.emailPlaceholder')}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.password')}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.passwordPlaceholder')}
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
              {passwordStrength.isValid && (
                <p className="text-xs mt-1 text-green-600 dark:text-green-400">
                  {passwordStrength.message}
                </p>
              )}
              {!passwordStrength.isValid && password && (
                <p className="text-xs mt-1 text-red-600 dark:text-red-400">
                  {passwordStrength.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.confirmPassword')}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register.confirmPasswordPlaceholder')}
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

            {/* Communication Preference - Custom Dropdown */}
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.communicationPreference')}
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowCommunicationDropdown(!showCommunicationDropdown)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 flex items-center justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
              >
                <div className="flex items-center space-x-2">
                  <span>{getCommunicationIcon(communicationPreference)}</span>
                  <span className="capitalize">{communicationPreference}</span>
                </div>
                <ChevronLeft className={`w-4 h-4 transition-transform ${showCommunicationDropdown ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              
              {showCommunicationDropdown && (
                <div className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  {(['sms', 'whatsapp', 'telegram'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setCommunicationPreference(option);
                        setShowCommunicationDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        communicationPreference === option
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span>{getCommunicationIcon(option)}</span>
                      <span className="capitalize">{option}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                {t('register.communicationPreferenceDetail')}
                {communicationPreference === "whatsapp" && (
                  <span className="block mt-1 text-amber-600 dark:text-amber-400">
                    Note: You need to subscribe for receiving updates on whatsapp.
                  </span>
                )}
              </p>
            </div>

            {/* Stock Update Frequency - Custom Dropdown */}
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.stockUpdateFrequency')}
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 flex items-center justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
              >
                <div className="flex items-center space-x-2">
                  <span>{getFrequencyIcon(stockUpdateFrequency)}</span>
                  <span className="capitalize">{t(`register.${stockUpdateFrequency}`)}</span>
                </div>
                <ChevronLeft className={`w-4 h-4 transition-transform ${showFrequencyDropdown ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              
              {showFrequencyDropdown && (
                <div className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  {(['daily', 'weekly', 'monthly'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setStockUpdateFrequency(option);
                        setShowFrequencyDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        stockUpdateFrequency === option
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span>{getFrequencyIcon(option)}</span>
                      <span className="capitalize">{t(`register.${option}`)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>



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

            {/* Terms of Service Agreement */}
            <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
              <span>{t('register.termsAgreement')} </span>
              <button
                type="button"
                onClick={() => window.open('/terms', '_blank')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium"
              >
                {t('register.termsOfService')}
              </button>
            </div>

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
                    {t('register.processing')}
                  </span>
                ) : (
                  t('register.createAccount')
                )}
              </button>
            </div>

            {/* Google Sign Up Button */}
            <div className="w-full">
              <button
                type="button"
                onClick={handleGoogleSignUp}
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
                  <span>{t('login.signUpWithGoogle')}</span>
                </div>
              </button>
            </div>

            {/* Already have account - Login link */}
            <div className="text-center">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {t('register.alreadyHaveAccount')}{" "}
              </span>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="font-medium underline text-xs sm:text-sm text-[#007F99] dark:text-[#00CFC1] hover:text-[#007F99]/80 dark:hover:text-[#00CFC1]/80"
              >
                {t('register.signIn')}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-xs text-gray-400">
                {t('register.copyright')}
              </span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-xs text-gray-400">
                {t('register.poweredBy')}
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
              {t('register.transformData')}
            </h2>
            <p className="text-base sm:text-2xl max-w-md mx-auto text-blue-400 dark:text-gray-300">
              {t('register.transformDescription')}
            </p>
          </div>
        </div>
      </div>


    </div>
  );
} 