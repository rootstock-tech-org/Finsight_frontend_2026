'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStockStore } from '@/lib/store/stock-store';
import { useWatchlist } from '@/hooks/useWatchlist';
import Header from '@/components/Header';
import CarouselModal from '@/components/CarouselModal';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Eye, Plus, FileText,
  History, BarChart3, Download, CheckCircle, XCircle, X,
} from 'lucide-react';
import { PDFGenerator } from '@/lib/utils/pdf-generator';
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

const knownKeyOrder: string[] = Array.from(new Set([
  'financial_highlights', 'strategic_moves_and_corporate_actions',
  'segment_wise_performance', 'innovation', 'finsight_insight',
  'forward_looking_statements', 'risks_and_threats', 'tone_of_management',
  'valuation_metrics', 'peer_comparison', 'dividend_payout_ratio',
  'dividend_yield', 'historical_trends', 'business_overview',
  'market_presence', 'financial_performance', 'ipo_details',
  'RISK_ASSESSMENT', 'COMPANY_NAME', 'EDUCATIONAL_HINTS',
  'MARKET_CONTEXT', 'TECHNICAL_SETUP',
  'Geopolitical Snapshot', 'India Linkages', 'Impact on Indian Markets',
  'Sector & Stock Read-through', 'Risks & Cautions', 'Finsight-Insight',
  'Tariff Details', 'India Exposure Map', 'Winners vs Losers (Sector/Stocks)',
  'Trade Measure Snapshot', 'India Trade Linkages', 'Company Name',
  'Event Snapshot', 'Peer & Value Chain Read-through', 'Policy Snapshot',
  'Macro & Fiscal Math', 'Beneficiary Map (Sector/Stocks)',
  'Execution Risks & Cautions', 'Exposure Map (India)',
  'Spillover & Contagion', 'Cross-Asset Read-through', 'Dividend Snapshot',
  'Trend & Sustainability', 'Relative Yield & Peers', 'whatsapp_forwarded_tips',
  'Claim Summary', 'Verification Status', 'Source Reliability',
  'Official Cross-Checks', 'Insight Based on Verified News',
  'Data Snapshot', 'Signal Interpretation', 'Summary', 'Relevance to India',
]));

const iconMap: Record<string, string> = {
  finsight_insight: '💡', financial_highlights: '📊',
  forward_looking_statements: '🔮', tone_of_management: '🎭',
  risks_and_threats: '⚠', strategic_moves_and_corporate_actions: '🧭',
  segment_wise_performance: '🧩', innovation: '🧪',
  valuation_metrics: '📈', peer_comparison: '🤝',
  dividend_payout_ratio: '💸', dividend_yield: '📈',
  historical_trends: '📉', business_overview: '🏢',
  market_presence: '🗺', financial_performance: '💼',
  ipo_details: '📝', RISK_ASSESSMENT: '🛡', COMPANY_NAME: '🏢',
  EDUCATIONAL_HINTS: '📘', MARKET_CONTEXT: '🌐', TECHNICAL_SETUP: '🛠',
  'Geopolitical Snapshot': '🌍', 'India Linkages': '🇮🇳',
  'Impact on Indian Markets': '📈', 'Sector & Stock Read-through': '🔗',
  'Risks & Cautions': '⚠', 'Finsight-Insight': '💡',
  'Tariff Details': '🧾', 'India Exposure Map': '🗺',
  'Winners vs Losers (Sector/Stocks)': '🏆', 'Trade Measure Snapshot': '📦',
  'India Trade Linkages': '🔗', 'Company Name': '🏢',
  'Event Snapshot': '📋', 'Peer & Value Chain Read-through': '🔗',
  'Policy Snapshot': '📜', 'Macro & Fiscal Math': '🧮',
  'Beneficiary Map (Sector/Stocks)': '🗺', 'Execution Risks & Cautions': '⚠',
  'Exposure Map (India)': '🗺', 'Spillover & Contagion': '🌊',
  'Cross-Asset Read-through': '🔗', 'Dividend Snapshot': '💰',
  'Trend & Sustainability': '📈', 'Relative Yield & Peers': '📊',
  whatsapp_forwarded_tips: '📨', 'Claim Summary': '🧾',
  'Verification Status': '✅', 'Source Reliability': '🔎',
  'Official Cross-Checks': '✔', 'Insight Based on Verified News': '📰',
  'Data Snapshot': '🧮', 'Signal Interpretation': '📶',
  Summary: '📝', 'Relevance to India': '🇮🇳',
};

// ── Helpers ────────────────────────────────────────────────────────────────
function getIconForKey(key: string) { return iconMap[key] ?? '📄'; }

function prettifyLabel(key: string): string {
  if (/\s/.test(key))
    return key.toLowerCase().replace(/(^|[\s])([a-z])/g, m => m.toUpperCase());
  return key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase().replace(/(^|[\s])([a-z])/g, m => m.toUpperCase());
}

function getUserId(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('finsight_user_id') : null;
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
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
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
      headers: { Authorization: `Bearer ${userId}` },
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

  // Handlers
  const handleDownloadAnalysis = async (analysis: any) => {
    try {
      await PDFGenerator.downloadPDF(analysis);
      addToast('success', 'PDF downloaded successfully.');
    } catch (error) {
      addToast('error', `Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

const handleLogout = () => {
  localStorage.removeItem('finsight_user_id');
  document.cookie = 'finsight_user_id=; path=/; max-age=0';
  window.location.href = '/login';
};

  // Tier / slots
  const tierRaw = userProfile?.subscription_tier ?? userTier ?? 'free';
const tier = (typeof tierRaw === 'number'
  ? { 1: 'free', 2: 'basic', 3: 'premium', 4: 'enterprise' }[tierRaw] ?? 'free'
  : String(tierRaw)
).toLowerCase();
  const maxSlots = TIER_MAX_SLOTS[tier] ?? 10;
  const usedSlots = watchlist.length;
  const availableSlots = Math.max(0, maxSlots - usedSlots);
  const isOverLimit = usedSlots > maxSlots;

  // Fallback email display
  const displayName = profileLoading
    ? 'Welcome back!'
    : userProfile?.first_name
      ? `Welcome back, ${userProfile.first_name}!`
      : userId
        ? `Welcome back!`
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
                  { label: 'Stocks Tracked', value: watchlist.filter(i => i.type === 'stock').length, icon: TrendingUp, color: 'blue' },
                  { label: 'Current Plan',   value: tier.toUpperCase(), icon: Eye,      color: 'green' },
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
              <OCRAnalysisHistory
                onAnalysisSelect={(analysis) => {
                  console.log('Selected analysis:', analysis?.id);
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Details</h3>
                <div className="flex items-center space-x-2">
                  <Button onClick={() => handleDownloadAnalysis(selectedAnalysis)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4" /><span>Download PDF</span>
                  </Button>
                  <button onClick={() => setSelectedAnalysis(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {selectedAnalysis.analysis_data && (
                <div className="space-y-6">
                  {selectedAnalysis.analysis_data['Company Name'] && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                            {selectedAnalysis.analysis_data['Company Name']}
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">Company Analysis Report</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Insights</h4>
                    <div className="space-y-4">
                      {(() => {
                        const excluded = new Set([
                          'company', 'document_type', 'ir_subtype', 'processing_time',
                          'cached', 'timestamp', 'document_id',
                          'category', 'Category', 'news_category', 'newsCategory',
                        ]);
                        const data = selectedAnalysis.analysis_data ?? {};
                        const entries = Object.entries(data).filter(([k, v]) => v != null && v !== '' && !excluded.has(k));
                        const byKey = Object.fromEntries(entries);
                        const ordered = knownKeyOrder.filter(k => k in byKey);
                        const remaining = entries.map(([k]) => k)
                          .filter(k => !ordered.includes(k))
                          .sort((a, b) => prettifyLabel(a).localeCompare(prettifyLabel(b)));

                        const renderCard = (key: string) => (
                          <div key={key} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {getIconForKey(key)} {prettifyLabel(key)}
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {typeof byKey[key] === 'string' ? byKey[key] : JSON.stringify(byKey[key], null, 2)}
                            </p>
                          </div>
                        );
                        return <>{ordered.map(renderCard)}{remaining.map(renderCard)}</>;
                      })()}
                    </div>
                  </div>

                  {selectedAnalysis.analysis_data['Risks & Cautions'] && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
                      <h4 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4 flex items-center">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Risks & Cautions
                      </h4>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-red-800 dark:text-red-200 leading-relaxed">
                          {selectedAnalysis.analysis_data['Risks & Cautions']}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Disclaimer:</strong> FinSight is an educational assistant, not a SEBI-registered investment advisor. We never execute trades. Every suggestion should be evaluated against your risk profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <CarouselModal isOpen={showCarouselModal} onClose={() => setShowCarouselModal(false)} darkMode={darkMode} />
    </div>
  );
}