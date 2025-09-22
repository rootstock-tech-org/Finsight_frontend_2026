'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStockStore } from '@/lib/store/stock-store';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useWatchlist } from '@/hooks/useWatchlist';
import { supabaseDatabaseService, UserProfileExternal } from '@/lib/services/supabase-database-service';
import Header from '@/components/Header';
import CarouselModal from '@/components/CarouselModal';
// Removed ChatInterface import - not used in this component
// Removed unused component imports - now using OCR service
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Eye, Plus, FileText, Upload, History, BarChart3, Download } from 'lucide-react';
import { PDFGenerator } from '@/lib/utils/pdf-generator';
import Link from 'next/link';
import OCRDocumentUpload from '@/components/OCRDocumentUpload';
import OCRAnalysisHistory from '@/components/OCRAnalysisHistory';
// Removed old analysis service imports - now using OCR service

type TabType = 'overview' | 'document-analysis' | 'analysis-history';

export default function DashboardPage() {
  const { user, signOut } = useSupabase();
  const { userTier } = useStockStore();
  const { watchlist } = useWatchlist();
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  // Removed unused state variables - now using OCR service
  // Removed old analysis session state - now using OCR service
  const [darkMode, setDarkMode] = useState(false);

  const PriceMini: React.FC<{ symbol: string; price?: number }> = ({ symbol, price }) => {
    const [p, setP] = useState<number | undefined>(price);
    const [loading, setLoading] = useState<boolean>(!price || price === 0);
    const [showRetry, setShowRetry] = useState<boolean>(false);
    const autoFetched = useRef<boolean>(false);
    const TTL_MS = 5 * 60 * 1000; // 5 minutes

    useEffect(() => {
      if (price && price > 0) {
        setP(price);
        setLoading(false);
        setShowRetry(false);
        try {
          // Cache the provided price
          localStorage.setItem(`price_cache_${symbol}`, JSON.stringify({ price, ts: Date.now() }));
        } catch (_) {}
        return;
      }
      // Try cached price for instant render
      try {
        const raw = localStorage.getItem(`price_cache_${symbol}`);
        if (raw) {
          const cached = JSON.parse(raw) as { price: number; ts: number };
          if (cached && typeof cached.price === 'number' && Date.now() - (cached.ts || 0) <= TTL_MS) {
            setP(cached.price);
            setLoading(false);
            setShowRetry(false);
            return;
          }
        }
      } catch (_) {}
      setLoading(true);
      const t = setTimeout(() => {
        setShowRetry(false);
        setLoading(false);
      }, 3500);
      return () => clearTimeout(t);
    }, [price]);

    const retry = async () => {
      try {
        setLoading(true);
        setShowRetry(false);
        const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/price`);
        const data = await res.json();
        const val = Number(data?.last_price) || 0;
        if (val > 0) {
          setP(val);
          try {
            localStorage.setItem(`price_cache_${symbol}`, JSON.stringify({ price: val, ts: Date.now() }));
          } catch (_) {}
        } else {
          setShowRetry(false);
        }
      } catch (_) {
        setShowRetry(false);
      } finally {
        setLoading(false);
      }
    };

    // Auto-attempt one background fetch on mount if no price and no fresh cache
    useEffect(() => {
      if (autoFetched.current) return;
      if (price && price > 0) return;
      try {
        const raw = localStorage.getItem(`price_cache_${symbol}`);
        const cached = raw ? (JSON.parse(raw) as { price: number; ts: number }) : null;
        const hasFreshCache = cached && typeof cached.price === 'number' && Date.now() - (cached.ts || 0) <= TTL_MS;
        if (!hasFreshCache) {
          autoFetched.current = true;
          // fire and forget; UI already shows spinner/then retry
          retry();
        }
      } catch (_) {
        autoFetched.current = true;
        retry();
      }
    }, [symbol]);

    if (p && p > 0) return <><p className="font-medium text-gray-900 dark:text-white">₹{p.toFixed(2)}</p></>;
    if (loading) return <div className="flex items-center justify-end text-gray-500 dark:text-gray-400"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></span>Loading...</div>;
    if (!p) return <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>;
    return <></>;
  };

  // Helpers to normalize labels and control ordering/icons for analysis cards
  const prettifyLabel = (key: string) => {
    if (/\s/.test(key)) {
      return key.toLowerCase().replace(/(^|[\s])([a-z])/g, (m) => m.toUpperCase());
    }
    const withSpaces = key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    return withSpaces.toLowerCase().replace(/(^|[\s])([a-z])/g, (m) => m.toUpperCase());
  };

  const knownKeyOrder: string[] = Array.from(new Set([
    'financial_highlights',
    'strategic_moves_and_corporate_actions',
    'segment_wise_performance',
    'innovation',
    'finsight_insight',
    'forward_looking_statements',
    'risks_and_threats',
    'tone_of_management',
    'valuation_metrics',
    'peer_comparison',
    'dividend_payout_ratio',
    'dividend_yield',
    'historical_trends',
    'business_overview',
    'market_presence',
    'financial_performance',
    'ipo_details',
    'RISK_ASSESSMENT',
    // Additional uppercase/snake-case variants
    'COMPANY_NAME',
    'EDUCATIONAL_HINTS',
    'MARKET_CONTEXT',
    'TECHNICAL_SETUP',
    // Label-style keys from other backends
    'Geopolitical Snapshot',
    'India Linkages',
    'Impact on Indian Markets',
    'Sector & Stock Read-through',
    'Risks & Cautions',
    'Finsight-Insight',
    'Tariff Details',
    'India Exposure Map',
    'Winners vs Losers (Sector/Stocks)',
    'Trade Measure Snapshot',
    'India Trade Linkages',
    'Company Name',
    'Event Snapshot',
    'Peer & Value Chain Read-through',
    'Policy Snapshot',
    'Macro & Fiscal Math',
    'Beneficiary Map (Sector/Stocks)',
    'Execution Risks & Cautions',
    'Exposure Map (India)',
    'Spillover & Contagion',
    'Cross-Asset Read-through',
    'Dividend Snapshot',
    'Trend & Sustainability',
    'Relative Yield & Peers',
    'whatsapp_forwarded_tips',
    'Claim Summary',
    'Verification Status',
    'Source Reliability',
    'Official Cross-Checks',
    'Insight Based on Verified News',
    'Data Snapshot',
    'Signal Interpretation',
    'Summary',
    'Relevance to India',
  ]));

  const iconMap: Record<string, string> = {
    finsight_insight: '💡',
    financial_highlights: '📊',
    forward_looking_statements: '🔮',
    tone_of_management: '🎭',
    risks_and_threats: '⚠',
    strategic_moves_and_corporate_actions: '🧭',
    segment_wise_performance: '🧩',
    innovation: '🧪',
    valuation_metrics: '📈',
    peer_comparison: '🤝',
    dividend_payout_ratio: '💸',
    dividend_yield: '📈',
    historical_trends: '📉',
    business_overview: '🏢',
    market_presence: '🗺',
    financial_performance: '💼',
    ipo_details: '📝',
    RISK_ASSESSMENT: '🛡',
    COMPANY_NAME: '🏢',
    EDUCATIONAL_HINTS: '📘',
    MARKET_CONTEXT: '🌐',
    TECHNICAL_SETUP: '🛠',
    'Geopolitical Snapshot': '🌍',
    'India Linkages': '🇮🇳',
    'Impact on Indian Markets': '📈',
    'Sector & Stock Read-through': '🔗',
    'Risks & Cautions': '⚠',
    'Finsight-Insight': '💡',
    'Tariff Details': '🧾',
    'India Exposure Map': '🗺',
    'Winners vs Losers (Sector/Stocks)': '🏆',
    'Trade Measure Snapshot': '📦',
    'India Trade Linkages': '🔗',
    'Company Name': '🏢',
    'Event Snapshot': '📋',
    'Peer & Value Chain Read-through': '🔗',
    'Policy Snapshot': '📜',
    'Macro & Fiscal Math': '🧮',
    'Beneficiary Map (Sector/Stocks)': '🗺',
    'Execution Risks & Cautions': '⚠',
    'Exposure Map (India)': '🗺',
    'Spillover & Contagion': '🌊',
    'Cross-Asset Read-through': '🔗',
    'Dividend Snapshot': '💰',
    'Trend & Sustainability': '📈',
    'Relative Yield & Peers': '📊',
    whatsapp_forwarded_tips: '📨',
    'Claim Summary': '🧾',
    'Verification Status': '✅',
    'Source Reliability': '🔎',
    'Official Cross-Checks': '✔',
    'Insight Based on Verified News': '📰',
    'Data Snapshot': '🧮',
    'Signal Interpretation': '📶',
    Summary: '📝',
    'Relevance to India': '🇮🇳',
  };

  const getIconForKey = (key: string) => iconMap[key] || '📄';

  const handleDownloadAnalysis = async (analysis: any) => {
    try {
      await PDFGenerator.downloadPDF(analysis);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };
  const [userProfile, setUserProfile] = useState<UserProfileExternal | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
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

  // Initialize dark mode on component mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    }
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
  
  const handleFileUpload = async (file: File | null, url?: string | null) => {
    // Redirect to OCR page for document analysis
    if (file || url) {
      window.location.href = '/ocr';
    }
  };
  
  // Removed old analysis session handlers - now using OCR service
  
  const handleLogout = async () => {
    try {
      await signOut();
      // User will be automatically redirected by Supabase provider
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header 
          onInfoClick={() => setShowCarouselModal(true)}
          showBackButton={false}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
        />
        <div className="pt-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Please sign in to access your dashboard
            </h1>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
        
        {/* Carousel Modal */}
        <CarouselModal 
          isOpen={showCarouselModal} 
          onClose={() => setShowCarouselModal(false)} 
          darkMode={darkMode} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header 
          onInfoClick={() => setShowCarouselModal(true)}
          showBackButton={false}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
          onHomeClick={() => window.location.href = '/dashboard'}
        />
      
      <div className="pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Navigation Tabs */}
          <div className="flex border-b mb-6 pb-2 space-x-2 sm:space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 font-medium text-sm sm:text-lg transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-gray-900 dark:text-white border-b-2 border-blue-600 dark:border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('document-analysis')}
              className={`pb-2 font-medium text-sm sm:text-lg transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                activeTab === 'document-analysis'
                  ? 'text-gray-900 dark:text-white border-b-2 border-blue-600 dark:border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Document Analysis</span>
              <span className="sm:hidden">Docs</span>
            </button>
            <button
              onClick={() => setActiveTab('analysis-history')}
              className={`pb-2 font-medium text-sm sm:text-lg transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                activeTab === 'analysis-history'
                  ? 'text-gray-900 dark:text-white border-b-2 border-blue-600 dark:border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Analysis History</span>
              <span className="sm:hidden">History</span>
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profileLoading ? (
                    'Welcome back!'
                  ) : userProfile?.first_name ? (
                    `Welcome back, ${userProfile.first_name}!`
                  ) : (
                    `Welcome back, ${user?.email?.split('@')[0]}!`
                  )}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Here&apos;s your financial overview for today
                </p>
              </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Stocks Tracked
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {watchlist.filter(item => item.type === 'stock').length}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Current Plan
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {(userProfile?.subscription_tier || userTier?.toLowerCase() || 'free').toUpperCase()}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Available Slots
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {(() => {
                      // Get tier from user profile if available, otherwise use store value
                      const tier = userProfile?.subscription_tier || userTier?.toLowerCase() || 'free';
                      const maxSlots = tier === 'free' ? 10 : tier === 'basic' ? 10 : tier === 'premium' ? 500 : tier === 'enterprise' ? 100 : 10;
                      const usedSlots = watchlist.length;
                      const availableSlots = Math.max(0, maxSlots - usedSlots);
                      return availableSlots;
                    })()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {(() => {
                      // Get tier from user profile if available, otherwise use store value
                      const tier = userProfile?.subscription_tier || userTier?.toLowerCase() || 'free';
                      const maxSlots = tier === 'free' ? 10 : tier === 'basic' ? 10 : tier === 'premium' ? 500 : tier === 'enterprise' ? 100 : 10;
                      const usedSlots = watchlist.length;
                      const isOverLimit = usedSlots > maxSlots;
                      return (
                        <span className={isOverLimit ? 'text-red-500 dark:text-red-400' : ''}>
                          {usedSlots}/{maxSlots} used
                          {isOverLimit && ' (Over limit!)'}
                        </span>
                      );
                    })()}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    Document Analysis
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    OCR Ready
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link href="/stocks">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                      Add Stocks
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
                      Search and add new stocks to your watchlist
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/watchlist">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                      View Watchlist
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
                      Manage your tracked stocks and mutual funds
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <div 
              onClick={() => setActiveTab('document-analysis')}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                    Document Analysis
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
                    Upload and analyze financial documents with AI
                  </p>
                </div>
              </div>
            </div>

            <Link href="/pricing">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                      Upgrade Plan
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
                      Get more features and higher limits
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            {watchlist.length > 0 ? (
              <div className="space-y-3">
                {watchlist.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.symbol}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.name}
                      </p>
                    </div>
                    <div className="text-right">
                      {typeof item.last_price === 'number' && item.last_price > 0 ? (
                        <>
                          <p className="font-medium text-gray-900 dark:text-white">₹{item.last_price.toFixed(2)}</p>
                          <p className={`text-sm ${
                            (item.change_percent || 0) >= 0 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {item.change_percent ? `${item.change_percent >= 0 ? '+' : ''}${item.change_percent.toFixed(2)}%` : 'N/A'}
                          </p>
                        </>
                      ) : (
                        <PriceMini symbol={item.symbol} price={item.last_price} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No stocks in your watchlist yet. Start by adding some stocks!
              </p>
            )}
          </div>

              {/* OCR Integration Notice */}
              <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    🎉 New: AI Document Analysis
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Upload PDF or image documents for AI-powered financial analysis. Our system can analyze annual reports, 
                  quarterly results, investor letters, and more using advanced OCR technology.
                </p>
                <Button 
                  onClick={() => setActiveTab('document-analysis')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Try Document Analysis
                </Button>
              </div>
            </>
          )}

          {activeTab === 'document-analysis' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Upload Documents for Analysis
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload PDF or image documents to get AI-powered financial analysis. 
                  Our system can analyze annual reports, quarterly results, investor letters, and more.
                </p>
              </div>
              
              <OCRDocumentUpload
                onUploadComplete={(result) => {
                  console.log('Upload completed:', result);
                  setActiveTab('analysis-history');
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          )}

          {activeTab === 'analysis-history' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Analysis History
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  View, search, and manage your document analysis results. 
                  Download reports and track your analysis progress.
                </p>
              </div>
              
              <OCRAnalysisHistory
                onAnalysisSelect={(analysis) => {
                  console.log('Selected analysis data:', analysis);
                  console.log('Analysis data field:', analysis.analysis_data);
                  setSelectedAnalysis(analysis);
                }}
              />
            </div>
          )}

        </div>
      </div>

      {/* Analysis Details Modal */}
      {selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Analysis Details
                </h3>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleDownloadAnalysis(selectedAnalysis)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </Button>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {selectedAnalysis.analysis_data && (
                <div className="space-y-6">
                  {/* Company Name Header */}
                  {selectedAnalysis.analysis_data["Company Name"] && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                            {selectedAnalysis.analysis_data["Company Name"]}
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Company Analysis Report
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Insights Section (ordered, with icons) */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">Key Insights</h4>
                    <div className="space-y-4">
                      {(() => {
                        const data = selectedAnalysis.analysis_data || {};
                        const excluded = new Set([
                          'company',
                          'document_type',
                          'ir_subtype',
                          'processing_time',
                          'cached',
                          'timestamp',
                          'document_id',
                          // Hide generic categories like "company_news" from UI
                          'category',
                          'Category',
                          'news_category',
                          'newsCategory'
                        ]);
                        const entries = Object.entries(data).filter(([k, v]) => v !== null && v !== undefined && v !== '' && !excluded.has(k));
                        const byKey: Record<string, any> = Object.fromEntries(entries);
                        const ordered = knownKeyOrder.filter((k) => k in byKey);
                        const remaining = entries.map(([k]) => k).filter((k) => !ordered.includes(k)).sort((a,b)=>prettifyLabel(a).localeCompare(prettifyLabel(b)));

                        const renderCard = (key: string) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{getIconForKey(key)} {prettifyLabel(key)}</h5>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {typeof byKey[key] === 'string' ? byKey[key] : JSON.stringify(byKey[key], null, 2)}
                            </p>
                          </div>
                        );

                        return (
                          <>
                            {ordered.map(renderCard)}
                            {remaining.map(renderCard)}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Risks & Cautions Section */}
                  {selectedAnalysis.analysis_data["Risks & Cautions"] && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
                      <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Risks & Cautions
                      </h4>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-red-800 dark:text-red-200 leading-relaxed">
                          {selectedAnalysis.analysis_data["Risks & Cautions"]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* SEBI Disclaimer */}
              <div className="mt-6 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Disclaimer:</strong> FinSight is an educational assistant, not a SEBI-registered investment advisor. We never execute trades. Every suggestion should be evaluated against your risk profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Carousel Modal */}
      <CarouselModal 
        isOpen={showCarouselModal} 
        onClose={() => setShowCarouselModal(false)} 
        darkMode={darkMode} 
      />
    </div>
  );
}
