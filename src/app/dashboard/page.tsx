'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStockStore } from '@/lib/store/stock-store';
import { useWatchlist } from '@/hooks/useWatchlist';
import Header from '@/components/Header';
import CarouselModal from '@/components/CarouselModal';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Eye, Plus, FileText,
  History, BarChart3, CheckCircle, XCircle, X,
} from 'lucide-react';
import Link from 'next/link';
import OCRDocumentUpload from '@/components/OCRDocumentUpload';
import OCRAnalysisHistory from '@/components/OCRAnalysisHistory';

// ── Types ──────────────────────────────────────────────────────────────────
type TabType = 'overview' | 'document-analysis' | 'analysis-history';

interface UserProfile {
  user_id?: string;
  email?: string;
  first_name?: string;
  subscription_tier?: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const FASTAPI = process.env.NEXT_PUBLIC_FASTAPI_URL ?? '';

const TIER_MAX_SLOTS: Record<string, number> = {
  free: 10, basic: 10, premium: 500, enterprise: 100,
};

// ── Helpers ────────────────────────────────────────────────────────────────
function getUserId(): string | null {
  return typeof window !== 'undefined'
    ? (localStorage.getItem('finsight_user_id') ?? localStorage.getItem('user_id'))
    : null;
}

// ── Toast component ────────────────────────────────────────────────────────
function ToastBanner({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-24 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm
          ${t.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200'
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200'}`}>
          {t.type === 'success'
            ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
            : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── PriceMini ──────────────────────────────────────────────────────────────
const PriceMini: React.FC<{ symbol: string; price?: number }> = ({ symbol, price }) => {
  const [p, setP] = useState<number | undefined>(price);
  const [loading, setLoading] = useState(!price || price === 0);
  const autoFetched = useRef(false);
  const TTL_MS = 5 * 60 * 1000;

  const fetchPrice = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}/price`);
      const data = await res.json();
      const val = Number(data?.last_price) || 0;
      if (val > 0) {
        setP(val);
        try { localStorage.setItem(`price_cache_${symbol}`, JSON.stringify({ price: val, ts: Date.now() })); } catch (_) {}
      }
    } catch (_) {
    } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => {
    if (price && price > 0) {
      setP(price); setLoading(false);
      try { localStorage.setItem(`price_cache_${symbol}`, JSON.stringify({ price, ts: Date.now() })); } catch (_) {}
      return;
    }
    try {
      const raw = localStorage.getItem(`price_cache_${symbol}`);
      if (raw) {
        const cached = JSON.parse(raw) as { price: number; ts: number };
        if (cached?.price > 0 && Date.now() - cached.ts <= TTL_MS) { setP(cached.price); setLoading(false); return; }
      }
    } catch (_) {}
    if (!autoFetched.current) { autoFetched.current = true; fetchPrice(); }
  }, [price, symbol, fetchPrice, TTL_MS]);

  if (p && p > 0) return <p className="font-medium text-gray-900 dark:text-white">₹{p.toFixed(2)}</p>;
  if (loading) return (
    <div className="flex items-center justify-end text-gray-500 dark:text-gray-400">
      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2" />Loading...
    </div>
  );
  return <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>;
};

// ── Main component ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { userTier } = useStockStore();
  const { watchlist } = useWatchlist();

  // Auth via localStorage
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { setUserId(getUserId()); }, []);

  // UI state
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  // Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch profile from FastAPI
  useEffect(() => {
    if (!userId) { setProfileLoading(false); return; }
    fetch(`${FASTAPI}/user_profiles/${userId}`, {
      headers: { 
        Authorization: `Bearer ${userId}`,
        'ngrok-skip-browser-warning': 'true',
      }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUserProfile(data); setProfileLoading(false); })
      .catch(() => setProfileLoading(false));
  }, [userId]);

  // Toast helpers
  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Dark mode
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const handleLogout = () => {
    localStorage.removeItem('finsight_user_id');
    localStorage.removeItem('user_id');
    document.cookie = 'finsight_user_id=; path=/; max-age=0';
    window.location.href = '/login';
  };

  // Tier / slots
  const tierRaw = userProfile?.subscription_tier ?? userTier ?? 'free';
  const tier = (typeof tierRaw === 'number'
    ? ({ 1: 'free', 2: 'basic', 3: 'premium', 4: 'enterprise' } as Record<number, string>)[tierRaw] ?? 'free'
    : String(tierRaw)
  ).toLowerCase();
  const maxSlots = TIER_MAX_SLOTS[tier] ?? 10;
  const usedSlots = watchlist.length;
  const availableSlots = Math.max(0, maxSlots - usedSlots);
  const isOverLimit = usedSlots > maxSlots;

  const displayName = profileLoading
    ? 'Welcome back!'
    : userProfile?.first_name
      ? `Welcome back, ${userProfile.first_name}!`
      : 'Welcome back!';

  // Not logged in
  if (!userId) {
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
            <Link href="/login"><Button>Sign In</Button></Link>
          </div>
        </div>
        <CarouselModal isOpen={showCarouselModal} onClose={() => setShowCarouselModal(false)} darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ToastBanner toasts={toasts} dismiss={dismissToast} />

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

          {/* Tabs */}
          <div className="flex border-b mb-6 pb-2 space-x-2 sm:space-x-4 overflow-x-auto">
            {([
              { id: 'overview',          icon: BarChart3, label: 'Overview' },
              { id: 'document-analysis', icon: FileText,  label: 'Document Analysis', short: 'Docs' },
              { id: 'analysis-history',  icon: History,   label: 'Analysis History',  short: 'History' },
            ] as const).map(({ id, icon: Icon, label, short }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`pb-2 font-medium text-sm sm:text-lg transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                  activeTab === id
                    ? 'text-gray-900 dark:text-white border-b-2 border-blue-600 dark:border-blue-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300'
                }`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short ?? label}</span>
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <>
              <div className="mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {displayName}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Here&apos;s your financial overview for today
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {[
                  { label: 'Stocks Tracked',    value: watchlist.filter(i => i.type === 'stock').length, icon: TrendingUp, color: 'blue' },
                  { label: 'Current Plan',       value: tier.toUpperCase(), icon: Eye, color: 'green' },
                  { label: 'Available Slots',
                    value: availableSlots,
                    sub: <span className={isOverLimit ? 'text-red-500 dark:text-red-400' : ''}>
                      {usedSlots}/{maxSlots} used{isOverLimit && ' (Over limit!)'}
                    </span>,
                    icon: Plus, color: 'yellow' },
                  { label: 'Document Analysis', value: 'OCR Ready', icon: FileText, color: 'purple' },
                ].map(({ label, value, sub, icon: Icon, color }) => (
                  <div key={label} className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">{label}</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                        {sub && <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{sub}</p>}
                      </div>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${color}-100 dark:bg-${color}-900 rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-600 dark:text-${color}-400`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {[
                  { href: '/stocks',    icon: TrendingUp, color: 'blue',   title: 'Add Stocks',     desc: 'Search and add new stocks to your watchlist' },
                  { href: '/watchlist', icon: Eye,        color: 'green',  title: 'View Watchlist', desc: 'Manage your tracked stocks and mutual funds' },
                  { href: '/pricing',   icon: Plus,       color: 'orange', title: 'Upgrade Plan',   desc: 'Get more features and higher limits' },
                ].map(({ href, icon: Icon, color, title, desc }) => (
                  <Link key={href} href={href}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${color}-100 dark:bg-${color}-900 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-600 dark:text-${color}-400`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">{desc}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                <div onClick={() => setActiveTab('document-analysis')}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">Document Analysis</h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">Upload and analyze financial documents with AI</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
                {watchlist.length > 0 ? (
                  <div className="space-y-3">
                    {watchlist.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.symbol}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
                        </div>
                        <div className="text-right">
                          {typeof item.last_price === 'number' && item.last_price > 0 ? (
                            <>
                              <p className="font-medium text-gray-900 dark:text-white">₹{item.last_price.toFixed(2)}</p>
                              <p className={`text-sm ${(item.change_percent || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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

              {/* OCR Promo */}
              <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🎉 New: AI Document Analysis</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Upload PDF or image documents for AI-powered financial analysis — annual reports, quarterly results, investor letters, and more.
                </p>
                <Button onClick={() => setActiveTab('document-analysis')} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Try Document Analysis
                </Button>
              </div>
            </>
          )}

          {/* ── Document Analysis ── */}
          {activeTab === 'document-analysis' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Upload Documents for Analysis</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Upload PDF or image documents to get AI-powered financial analysis — annual reports, quarterly results, investor letters, and more.
                </p>
              </div>
              <OCRDocumentUpload
                onUploadComplete={(result) => {
                  console.log('Upload completed:', result);
                  addToast('success', 'Document uploaded and analysed successfully.');
                  setActiveTab('analysis-history');
                }}
                onUploadError={(error) => {
                  const message =
                    typeof error === 'string' ? error
                    : error instanceof Error ? error.message
                    : (error as any)?.message ?? 'Upload failed. Please try again.';
                  console.error('Upload error:', message);
                  addToast('error', message);
                }}
              />
            </div>
          )}

          {/* ── Analysis History ── */}
          {activeTab === 'analysis-history' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Analysis History</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  View, search, and manage your document analysis results. Download reports and track your analysis progress.
                </p>
              </div>
              <OCRAnalysisHistory />
            </div>
          )}

        </div>
      </div>

      <CarouselModal isOpen={showCarouselModal} onClose={() => setShowCarouselModal(false)} darkMode={darkMode} />
    </div>
  );
}