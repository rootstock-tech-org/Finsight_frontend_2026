'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useStockStore } from '@/lib/store/stock-store';
import { supabaseDatabaseService, UserProfileExternal } from '@/lib/services/supabase-database-service';
import { useAuthStore } from '@/lib/store/auth-store';
import { subscriptionService } from '@/lib/services/subscription-service';
import AuthGuard from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Settings, 
  CreditCard, 
  ChevronRight, 
  TrendingUp, 
  BarChart3, 
  Clock,
  MessageCircle,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Save,
  Moon,
  Sun
} from 'lucide-react';


export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut } = useSupabase();
  const { watchlist, userTier } = useStockStore();
  const { darkMode: appDarkMode } = useAuthStore();
  const [userProfile, setUserProfile] = useState<UserProfileExternal | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize dark mode on component mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    }
  }, []);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    // Apply dark mode to HTML element
    if (typeof document !== 'undefined') {
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };
  const [subscription, setSubscription] = useState<unknown>(null);
  const [usage, setUsage] = useState<{ analysesThisMonth: number; historyItems: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for editable fields
  const [communicationPreference, setCommunicationPreference] = useState<'whatsapp' | 'sms' | 'telegram'>('whatsapp');
  const [stockUpdateFrequency, setStockUpdateFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        try {
          setProfileLoading(true);
          
          const { data, error } = await supabaseDatabaseService.getUserProfile(user.id, user.user_metadata);
          
          if (error) {
            console.error('❌ Error fetching user profile:', error);
            console.error('Error details:', {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
            setError(`Failed to fetch profile: ${error.message}`);
          } else {
            setUserProfile(data);
            setError(null);
            
            // Set form state from fetched profile
            if (data) {
              setCommunicationPreference(data.communication_preference);
              setStockUpdateFrequency(data.stock_update_frequency);
            }
          }
        } catch (error) {
          console.error('💥 Exception while fetching user profile:', error);
          setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setProfileLoading(false);
        }
      } else {
        console.log('⚠️ No user ID available');
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user?.id]);


  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          // Load subscription data
          const subData = await subscriptionService.getCurrentSubscription();
          setSubscription(subData);
        } catch (error) {
          console.error('Error loading subscription data:', error);
        }
      }
    };

    loadUserData();
  }, [user]);

  // Handle profile updates
  const handleUpdateProfile = async () => {
    if (!user?.id) return;
    
    setIsUpdating(true);
    setUpdateSuccess(false);
    setError(null);
    
    try {
      const updates = {
        communication_preference: communicationPreference,
        stock_update_frequency: stockUpdateFrequency
      };
      
      const { data, error } = await supabaseDatabaseService.updateUserProfile(user.id, updates);
      
      if (error) {
        console.error('❌ Error updating profile:', error);
        setError(`Failed to update profile: ${error.message}`);
      } else {
        console.log('✅ Profile updated successfully:', data);
        setUserProfile(data);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      }
    } catch (error) {
      console.error('💥 Exception while updating profile:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };


  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE': return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
      case 'BASIC': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PREMIUM': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'PRO': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'FREE': return '🆓';
      case 'BASIC': return '⭐';
      case 'PREMIUM': return '💎';
      case 'PRO': return '🚀';
      default: return '🆓';
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
        {/* Top Navigation Bar */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <div className="h-4 sm:h-6 w-px bg-slate-300 dark:bg-slate-600 flex-shrink-0"></div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white truncate">
                  Profile & Settings
                </h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"
                >
                  {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                </Button>
                <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 hidden sm:inline">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
            {/* Left Sidebar - User Info */}
            <div className="xl:col-span-3">
              <div className="sticky top-4 sm:top-8 space-y-4 sm:space-y-6">
                {/* User Profile Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                      {userProfile?.first_name ? `${userProfile.first_name} ${userProfile.last_name}` : 'User Name'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                      {userProfile?.email || user?.email}
                    </p>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">Plan</span>
                      <Badge className={getTierColor(userTier)}>
                        <span className="flex items-center gap-1">
                          {getTierIcon(userTier)}
                          {userTier}
                        </span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">Status</span>
                      <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Verified</span>
                    </div>

                    {userProfile && (
                      <>
                        <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">Communication</span>
                          <span className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate">{userProfile.communication_preference}</span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">Updates</span>
                          <span className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="truncate">{userProfile.stock_update_frequency}</span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                {usage && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                      This Month
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">Analyses</span>
                        </div>
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">
                          {usage.analysesThisMonth}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">Watchlist</span>
                        </div>
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">
                          {watchlist.length}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300">History</span>
                        </div>
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">
                          {usage.historyItems}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-11 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      onClick={() => router.push('/pricing')}
                    >
                      <CreditCard className="w-4 h-4 mr-3" />
                      Manage Subscription
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-11 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                      onClick={() => router.push('/stocks')}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Manage Watchlist
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Main Content */}
            <div className="xl:col-span-9 space-y-6">
              {/* Personal Information */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                  Personal Information
                </h3>
                
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-600 dark:text-slate-400">Loading profile...</span>
                  </div>
                ) : userProfile ? (
                  <div className="space-y-6">
                    {/* Profile Summary */}
                    <div className="flex items-center space-x-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {userProfile.first_name} {userProfile.last_name}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {userProfile.email}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                          <span>📱 {userProfile.mobile_number}</span>
                          <span>💬 {userProfile.communication_preference}</span>
                          <span>📅 {userProfile.stock_update_frequency}</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information Display - Read Only */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            First Name
                          </label>
                          <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100">
                            {userProfile?.first_name || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Last Name
                          </label>
                          <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100">
                            {userProfile?.last_name || 'Not provided'}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Email Address
                        </label>
                        <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100">
                          {userProfile?.email || 'Not provided'}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Mobile Number
                        </label>
                        <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100">
                          {userProfile?.mobile_number || 'Not provided'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Communication Preference
                          </label>
                          <select
                            value={communicationPreference}
                            onChange={(e) => setCommunicationPreference(e.target.value as 'whatsapp' | 'sms' | 'telegram')}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="whatsapp">WhatsApp</option>
                            <option value="sms">SMS</option>
                            <option value="telegram">Telegram</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Stock Update Frequency
                          </label>
                          <select
                            value={stockUpdateFrequency}
                            onChange={(e) => setStockUpdateFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Subscription Tier
                        </label>
                        <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100">
                          <span className="capitalize">{userProfile?.subscription_tier || 'Free'}</span>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isUpdating}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                        >
                          {isUpdating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Success Message */}
                      {updateSuccess && (
                        <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                            <p className="text-green-700 dark:text-green-300 text-sm">Profile updated successfully!</p>
                          </div>
                        </div>
                      )}

                      {/* Error Messages */}
                      {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        </div>
                      )}

                      {/* Information Notice */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Profile Information
                            </h3>
                            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                              <p>
                                Personal details (name, email, mobile) are synced from your account and cannot be edited here. 
                                You can update your communication preferences and stock update frequency using the dropdowns above.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400">No profile data available.</p>
                    
                    {/* Debug Information */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-left">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Debug Info:</h4>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <p>User ID: {user?.id || 'Not available'}</p>
                          <p>User Email: {user?.email || 'Not available'}</p>
                          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'NOT SET'}</p>
                          <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'NOT SET'}</p>
                          <p>Profile Loading: {profileLoading ? 'Yes' : 'No'}</p>
                          <p>Error: {error || 'None'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Alert Settings Section */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Alert Settings
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* IPO Alerts */}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          IPO Alerts
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Main Board IPO</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="yes">YES</option>
                              <option value="no">NO</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">SME IPO</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="yes">YES</option>
                              <option value="no">NO</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Heat Map Alerts */}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Heat Map Alerts
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Portfolio Heat Map</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="daily">DAILY</option>
                              <option value="weekly">WEEKLY</option>
                              <option value="monthly">MONTHLY</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Sector Heat Map</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="daily">DAILY</option>
                              <option value="weekly">WEEKLY</option>
                              <option value="monthly">MONTHLY</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Global Markets</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="daily">DAILY</option>
                              <option value="weekly">WEEKLY</option>
                              <option value="monthly">MONTHLY</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Market Alerts */}
                      <div>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          Market Alerts
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Price Volume</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="realtime">REALTIME</option>
                              <option value="eod">EOD</option>
                              <option value="weekly">WEEKLY</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">News Alerts</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="realtime">REALTIME</option>
                              <option value="weekly">WEEKLY</option>
                              <option value="monthly">MONTHLY</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                            <span className="text-sm text-slate-700 dark:text-slate-300">Corporate News</span>
                            <select className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800">
                              <option value="realtime">REALTIME</option>
                              <option value="weekly">WEEKLY</option>
                              <option value="monthly">MONTHLY</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      className="h-11 px-8 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg"
                      onClick={() => {
                        alert('Alert settings saved successfully!');
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Alert Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

