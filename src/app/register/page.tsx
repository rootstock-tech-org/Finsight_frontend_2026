'use client';

import React, { useState, useEffect } from "react";
import { useTranslation } from "../../context/LanguageContext";
import { Eye, EyeOff, AlertCircle, ChevronLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { fastapiAuthService } from "@/lib/services/fastapi-auth-service";
import { useAuthStore } from "@/lib/store/auth-store";

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

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
  const [showCommunicationDropdown, setShowCommunicationDropdown] = useState(false);
  const [showFrequencyDropdown, setShowFrequencyDropdown] = useState(false);

  const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) return { isValid: false, message: t('register.passwordTooShort') };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: t('register.passwordNoUppercase') };
    if (!/[a-z]/.test(password)) return { isValid: false, message: t('register.passwordNoLowercase') };
    if (!/\d/.test(password)) return { isValid: false, message: t('register.passwordNoNumber') };
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, message: t('register.passwordNoSpecial') };
    const weakPasswords = ['12345678', 'password', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.includes(password.toLowerCase())) return { isValid: false, message: t('register.passwordTooWeak') };
    return { isValid: true, message: t('register.passwordStrong') };
  };

  const passwordStrength = validatePasswordStrength(password);

  // Only redirect once we know real auth state
  useEffect(() => {
    if (isHydrated && user) {
      router.push('/dashboard');
    }
  }, [user, isHydrated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!firstName.trim()) throw new Error(t('register.firstNameRequired'));
      if (!lastName.trim()) throw new Error(t('register.lastNameRequired'));
      if (!mobileNumber.trim()) throw new Error(t('register.mobileNumberRequired'));
      if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) throw new Error(t('register.mobileNumberInvalid'));
      if (password !== confirmPassword) throw new Error(t('register.passwordsDoNotMatch'));
      if (!passwordStrength.isValid) throw new Error(passwordStrength.message);

      const { user, error } = await fastapiAuthService.signUp({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobileNumber: mobileNumber.trim(),
        communicationPreference,
        stockUpdateFrequency,
      });

      if (error) {
        setError(error);
      } else if (user) {
        setSuccessMessage('Registration successful! Redirecting to dashboard...');
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setError('Google sign-up is not available in this version. Please use email & password.');
  };

  const getCommunicationIcon = (pref: string) => ({ whatsapp: '📱', sms: '💬', telegram: '📨' }[pref] || '📱');
  const getFrequencyIcon = (freq: string) => ({ daily: '📅', weekly: '📊', monthly: '📈' }[freq] || '📅');

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900">

      <div className="fixed top-4 left-4 z-40">
        <button onClick={() => router.push('/login')}
          className="flex items-center space-x-2 p-2 rounded-lg transition-colors bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md">
          <ChevronLeft className="w-4 h-4" />
          <span className="font-medium text-sm">{t('register.backToLogin')}</span>
        </button>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-2 sm:p-8 bg-white dark:bg-gray-900">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/navbar.png" alt="FinSight Logo" className="h-12 sm:h-16 md:h-11 object-contain" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">FinSight</h1>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl mb-2 text-gray-900 dark:text-white">{t('register.motto')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('register.subtitle')}</p>
            <div className="text-center mt-4">
              <div className="flex justify-center items-center space-x-6 text-xs">
                {[
                  { icon: '📄', label: 'Document to Decision', tip: 'Upload reports. Get clarity. No jargon.' },
                  { icon: '🔔', label: 'Personalized Alerts', tip: 'Get AI-curated updates on IPOs, bulk deals & insider moves.' },
                  { icon: '🎯', label: 'So What Score™️', tip: 'Every insight ends in action — for you.' },
                ].map(({ icon, label, tip }) => (
                  <div key={label} className="group relative flex items-center space-x-1">
                    <span>{icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: t('register.firstName'), value: firstName, setter: setFirstName, placeholder: t('register.firstNamePlaceholder') },
                { label: t('register.lastName'), value: lastName, setter: setLastName, placeholder: t('register.lastNamePlaceholder') },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    {label}<span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                  />
                </div>
              ))}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.mobileNumber')}<span className="text-red-500">*</span>
              </label>
              <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)}
                placeholder={t('register.mobileNumberPlaceholder')} required maxLength={10}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
              />
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">{t('register.mobileNumberHelp')}</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.email')}<span className="text-red-500">*</span>
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t('register.emailPlaceholder')} required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.password')}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('register.passwordPlaceholder')} required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <p className={`text-xs mt-1 ${passwordStrength.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {passwordStrength.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.confirmPassword')}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('register.confirmPasswordPlaceholder')} required
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 rounded-xl border transition-colors focus:outline-none focus:ring-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-green-700 dark:focus:ring-green-400 focus:border-green-700 dark:focus:border-green-400"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Communication Preference */}
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.communicationPreference')}<span className="text-red-500">*</span>
              </label>
              <button type="button" onClick={() => setShowCommunicationDropdown(!showCommunicationDropdown)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 flex items-center justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-green-700 dark:focus:ring-green-400">
                <div className="flex items-center space-x-2">
                  <span>{getCommunicationIcon(communicationPreference)}</span>
                  <span className="capitalize">{communicationPreference}</span>
                </div>
                <ChevronLeft className={`w-4 h-4 transition-transform ${showCommunicationDropdown ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {showCommunicationDropdown && (
                <div className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  {(['sms', 'whatsapp', 'telegram'] as const).map((option) => (
                    <button key={option} type="button" onClick={() => { setCommunicationPreference(option); setShowCommunicationDropdown(false); }}
                      className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${communicationPreference === option ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
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

            {/* Stock Update Frequency */}
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                {t('register.stockUpdateFrequency')}<span className="text-red-500">*</span>
              </label>
              <button type="button" onClick={() => setShowFrequencyDropdown(!showFrequencyDropdown)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 flex items-center justify-between bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-green-700 dark:focus:ring-green-400">
                <div className="flex items-center space-x-2">
                  <span>{getFrequencyIcon(stockUpdateFrequency)}</span>
                  <span className="capitalize">{t(`register.${stockUpdateFrequency}`)}</span>
                </div>
                <ChevronLeft className={`w-4 h-4 transition-transform ${showFrequencyDropdown ? 'rotate-90' : '-rotate-90'}`} />
              </button>
              {showFrequencyDropdown && (
                <div className="absolute z-10 w-full mt-1 rounded-lg border shadow-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                  {(['daily', 'weekly', 'monthly'] as const).map((option) => (
                    <button key={option} type="button" onClick={() => { setStockUpdateFrequency(option); setShowFrequencyDropdown(false); }}
                      className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${stockUpdateFrequency === option ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      <span>{getFrequencyIcon(option)}</span>
                      <span className="capitalize">{t(`register.${option}`)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

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

            <div className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
              <span>{t('register.termsAgreement')} </span>
              <button type="button" onClick={() => window.open('/terms', '_blank')}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium">
                {t('register.termsOfService')}
              </button>
            </div>

            <div className="w-full">
              <button type="submit" disabled={loading}
                style={{ backgroundColor: '#3B82F6', color: '#F5F6F7' }}
                className={`w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 cursor-pointer ${loading ? 'opacity-70 cursor-not-allowed' : ''} hover:opacity-90`}>
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {t('register.processing')}
                  </span>
                ) : t('register.createAccount')}
              </button>
            </div>

            <div className="w-full">
              <button type="button" onClick={handleGoogleSignUp} disabled={loading}
                className="w-full px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 cursor-pointer bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>{t('login.signUpWithGoogle')}</span>
                </div>
              </button>
            </div>

            <div className="text-center">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('register.alreadyHaveAccount')}{" "}</span>
              <button type="button" onClick={() => router.push('/login')}
                className="font-medium underline text-xs sm:text-sm text-[#007F99] dark:text-[#00CFC1] hover:text-[#007F99]/80 dark:hover:text-[#00CFC1]/80">
                {t('register.signIn')}
              </button>
            </div>
          </form>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <span className="text-xs text-gray-400">{t('register.copyright')}</span>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <span className="text-xs text-gray-400">{t('register.poweredBy')}</span>
              <img src="/RootStock.jpeg" alt="Rootstock Technologies" className="w-4 h-4 object-contain bg-white rounded"/>
              <span className="text-xs text-gray-400">Rootstock Technologies</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative bg-gray-900 dark:bg-gray-600">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl sm:text-5xl font-bold mb-2 text-white dark:text-blue-400">{t('register.transformData')}</h2>
            <p className="text-base sm:text-2xl max-w-md mx-auto text-blue-400 dark:text-gray-300">{t('register.transformDescription')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}