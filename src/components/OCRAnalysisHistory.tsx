'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, Filter, Download, Trash2, Eye,
  Calendar, Building2, BarChart3, AlertCircle, CheckCircle,
  Clock, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PDFGenerator } from '@/lib/utils/pdf-generator';

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalysisRecord {
  id: string;
  doc_name?: string;
  doc_type?: string;
  result?: any;
  summary?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  company_name?: string | null;
  document_type?: string | null;
  status: 'processing' | 'completed' | 'failed';
  analysis_data?: any;
  metadata?: any;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
}

function normalize(a: AnalysisRecord): AnalysisRecord {
  return {
    ...a,
    file_name:     a.file_name     || a.doc_name || 'Unknown file',
    document_type: a.document_type || a.doc_type || null,
    analysis_data: a.analysis_data || a.result   || null,
  };
}

interface AnalysisHistory {
  analyses: AnalysisRecord[];
  pagination: {
    page: number; limit: number; total: number;
    totalPages: number; hasNext: boolean; hasPrev: boolean;
  };
  statistics: {
    total: number; completed: number; processing: number;
    failed: number; totalFileSize: number;
    documentTypes: Record<string, number>;
  };
}

interface OCRAnalysisHistoryProps {
  className?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const KNOWN_KEY_ORDER = [
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
];

const ICON_MAP: Record<string, string> = {
  finsight_insight: '💡', financial_highlights: '📊',
  forward_looking_statements: '🔮', tone_of_management: '🎭',
  risks_and_threats: '⚠️', strategic_moves_and_corporate_actions: '🧭',
  segment_wise_performance: '🧩', innovation: '🧪',
  valuation_metrics: '📈', peer_comparison: '🤝',
  dividend_payout_ratio: '💸', dividend_yield: '📈',
  historical_trends: '📉', business_overview: '🏢',
  market_presence: '🗺️', financial_performance: '💼',
  ipo_details: '📝', RISK_ASSESSMENT: '🛡️', COMPANY_NAME: '🏢',
  EDUCATIONAL_HINTS: '📘', MARKET_CONTEXT: '🌐', TECHNICAL_SETUP: '🛠️',
  'Geopolitical Snapshot': '🌍', 'India Linkages': '🇮🇳',
  'Impact on Indian Markets': '📈', 'Sector & Stock Read-through': '🔗',
  'Risks & Cautions': '⚠️', 'Finsight-Insight': '💡',
  'Tariff Details': '🧾', 'India Exposure Map': '🗺️',
  'Winners vs Losers (Sector/Stocks)': '🏆', 'Trade Measure Snapshot': '📦',
  'India Trade Linkages': '🔗', 'Company Name': '🏢',
  'Event Snapshot': '📋', 'Peer & Value Chain Read-through': '🔗',
  'Policy Snapshot': '📜', 'Macro & Fiscal Math': '🧮',
  'Beneficiary Map (Sector/Stocks)': '🗺️', 'Execution Risks & Cautions': '⚠️',
  'Exposure Map (India)': '🗺️', 'Spillover & Contagion': '🌊',
  'Cross-Asset Read-through': '🔗', 'Dividend Snapshot': '💰',
  'Trend & Sustainability': '📈', 'Relative Yield & Peers': '📊',
  whatsapp_forwarded_tips: '📨', 'Claim Summary': '🧾',
  'Verification Status': '✅', 'Source Reliability': '🔎',
  'Official Cross-Checks': '✔️', 'Insight Based on Verified News': '📰',
  'Data Snapshot': '🧮', 'Signal Interpretation': '📶',
  Summary: '📝', 'Relevance to India': '🇮🇳',
};

const EXCLUDED_KEYS = new Set([
  'company', 'document_type', 'doc_type', 'ir_subtype', 'processing_time',
  'cached', 'timestamp', 'document_id', 'category', 'Category',
  'news_category', 'newsCategory',
]);

const DOC_TYPE_COLORS: Record<string, string> = {
  AR:    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SHL:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  IR:    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  BRK:   'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  DIV:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DRHP:  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  CHART: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  OTH:   'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const RISK_KEYS = new Set([
  'Risks & Cautions', 'risks_and_threats', 'RISK_ASSESSMENT', 'Execution Risks & Cautions',
]);

// ── Helpers ────────────────────────────────────────────────────────────────
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('finsight_user_id') ?? localStorage.getItem('user_id');
}

function authHeader(): Record<string, string> {
  const uid = getUserId();
  return uid ? { Authorization: `Bearer ${uid}` } : {};
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '—';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(ds: string) {
  return new Date(ds).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function prettifyLabel(key: string): string {
  if (/\s/.test(key))
    return key.toLowerCase().replace(/(^|[\s])([a-z])/g, m => m.toUpperCase());
  return key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase().replace(/(^|[\s])([a-z])/g, m => m.toUpperCase());
}

function getIconForKey(key: string) { return ICON_MAP[key] ?? '📄'; }

function getCompanyName(a: AnalysisRecord): string {
  const data = a.analysis_data || a.result || {};
  return (
    a.company_name?.trim() ||
    data?.['Company Name']?.toString().trim() ||
    data?.company?.toString().trim() ||
    data?.company_name?.toString().trim() ||
    a.metadata?.company_name?.toString().trim() ||
    'Unknown Company'
  );
}

// ── Structured value renderer ──────────────────────────────────────────────
function renderValue(value: any): React.ReactNode {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const lines = value.split(/\n+/).filter(l => l.trim());
    if (lines.length <= 1) return <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{value}</p>;
    return (
      <ul className="space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
            <span>{line.replace(/^[-•*]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
            <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    return (
      <div className="space-y-2 pl-2 border-l-2 border-blue-200 dark:border-blue-700">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {prettifyLabel(k)}
            </span>
            <div className="mt-0.5">{renderValue(v)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-gray-700 dark:text-gray-300">{String(value)}</p>;
}

// ── Collapsible section ────────────────────────────────────────────────────
function AnalysisSection({ label, icon, value, defaultOpen = true, accent = false }:
  { label: string; icon: string; value: any; defaultOpen?: boolean; accent?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-lg border overflow-hidden ${
      accent
        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700'
    }`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <h5 className={`font-semibold text-sm flex items-center gap-2 ${
          accent ? 'text-red-800 dark:text-red-200' : 'text-gray-900 dark:text-white'
        }`}>
          <span>{icon}</span>
          <span>{label}</span>
        </h5>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          {renderValue(value)}
        </div>
      )}
    </div>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────
function AnalysisViewModal({ analysis, onClose, onDownload }:
  { analysis: AnalysisRecord; onClose: () => void; onDownload: (a: AnalysisRecord) => void }) {
  const data = analysis.analysis_data || analysis.result || {};
  const companyName = getCompanyName(analysis);

  const entries = Object.entries(data).filter(([k, v]) =>
    v != null && v !== '' && !EXCLUDED_KEYS.has(k)
  );
  const byKey = Object.fromEntries(entries);
  const ordered = KNOWN_KEY_ORDER.filter(k => k in byKey);
  const remaining = entries.map(([k]) => k)
    .filter(k => !ordered.includes(k))
    .sort((a, b) => prettifyLabel(a).localeCompare(prettifyLabel(b)));
  const allKeys = [...ordered, ...remaining];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center p-4 z-50 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full my-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl z-10">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{companyName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {analysis.file_name || analysis.doc_name} · {formatDate(analysis.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <Button size="sm" onClick={() => onDownload(analysis)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Download className="w-3 h-3 mr-1" /> PDF
            </Button>
            <button onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Company banner */}
        {data['Company Name'] && (
          <div className="mx-5 mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🏢</span>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{data['Company Name']}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Company Analysis Report</p>
              </div>
            </div>
          </div>
        )}

        {/* Sections */}
        <div className="p-5 space-y-3">
          {allKeys.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">No analysis data available.</p>
          ) : (
            allKeys.map((key, idx) => (
              <AnalysisSection
                key={key}
                label={prettifyLabel(key)}
                icon={getIconForKey(key)}
                value={byKey[key]}
                defaultOpen={idx < 3}
                accent={RISK_KEYS.has(key)}
              />
            ))
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Disclaimer:</strong> FinSight is an educational assistant, not a SEBI-registered investment advisor. Every suggestion should be evaluated against your risk profile.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
const OCRAnalysisHistory: React.FC<OCRAnalysisHistoryProps> = ({ className = '' }) => {
  const [history, setHistory] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewingAnalysis, setViewingAnalysis] = useState<AnalysisRecord | null>(null);

  const fetchHistory = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setError('Not authenticated'); setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);
      if (documentTypeFilter) params.set('document_type', documentTypeFilter);

      const res = await fetch(`/api/ocr/history?${params}`, { headers: authHeader() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to fetch history');
      }

      const data = await res.json();
      if (data.analyses) data.analyses = data.analyses.map(normalize);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, documentTypeFilter, sortBy, sortOrder]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDeleteSelected = async () => {
    if (!selectedAnalyses.length) return;
    try {
      const res = await fetch('/api/ocr/history', {
        method: 'DELETE',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_ids: selectedAnalyses }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Delete failed');
      setSelectedAnalyses([]);
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete analyses');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all analyses? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/ocr/history', {
        method: 'DELETE',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete_all: true }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Delete failed');
      setSelectedAnalyses([]);
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete all analyses');
    }
  };

  const handleDownload = async (analysis: AnalysisRecord) => {
    const data = analysis.analysis_data || analysis.result;
    if (analysis.status !== 'completed' || !data) {
      alert('Analysis is not complete yet.');
      return;
    }
    try {
      await PDFGenerator.downloadPDF({
        id: analysis.id,
        file_name: analysis.file_name || analysis.doc_name || 'analysis',
        company_name: analysis.company_name ?? null,
        document_type: (analysis.document_type || analysis.doc_type) ?? null,
        analysis_data: data,
        created_at: analysis.created_at,
        completed_at: analysis.completed_at ?? null,
      });
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'failed')    return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
  };

  if (loading) return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading analysis history...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`p-8 ${className}`}>
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Error Loading History</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchHistory}>Try Again</Button>
      </div>
    </div>
  );

  return (
    <>
      {viewingAnalysis && (
        <AnalysisViewModal
          analysis={viewingAnalysis}
          onClose={() => setViewingAnalysis(null)}
          onDownload={handleDownload}
        />
      )}

      <div className={`w-full max-w-7xl mx-auto p-4 sm:p-6 ${className}`}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Document Analysis History</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">View and manage your document analysis results</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowFilters(v => !v)} className="text-xs sm:text-sm">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Filters
            </Button>
            {selectedAnalyses.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected} className="text-xs sm:text-sm">
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Delete ({selectedAnalyses.length})
              </Button>
            )}
            <Button variant="destructive" onClick={handleDeleteAll}
              disabled={!history?.analyses.length} className="text-xs sm:text-sm">
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Delete All
            </Button>
          </div>
        </div>

        {/* Stats */}
        {history?.statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {[
              { icon: FileText,    color: 'blue',   label: 'Total',      value: history.statistics.total },
              { icon: CheckCircle, color: 'green',  label: 'Completed',  value: history.statistics.completed },
              { icon: Clock,       color: 'yellow', label: 'Processing', value: history.statistics.processing },
              { icon: BarChart3,   color: 'purple', label: 'Total Size', value: formatFileSize(history.statistics.totalFileSize) },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-${color}-500 mr-2 sm:mr-3 flex-shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by file name or company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchHistory()}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setCurrentPage(1); fetchHistory(); }}>Search</Button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Status', value: statusFilter, setter: setStatusFilter,
                  options: [['', 'All Statuses'], ['completed', 'Completed'], ['processing', 'Processing'], ['failed', 'Failed']] },
                { label: 'Document Type', value: documentTypeFilter, setter: setDocumentTypeFilter,
                  options: [['', 'All Types'], ['AR', 'Annual Report'], ['SHL', 'Shareholder Letter'],
                    ['IR', 'Investor Relations'], ['BRK', 'Broker Note'], ['DIV', 'Dividend Report'],
                    ['DRHP', 'IPO Prospectus'], ['CHART', 'Chart Analysis'], ['OTH', 'Other']] },
                { label: 'Sort By', value: sortBy, setter: setSortBy,
                  options: [['created_at', 'Date Created'], ['doc_name', 'File Name'], ['company_name', 'Company Name']] },
              ].map(({ label, value, setter, options }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                  <select value={value}
                    onChange={e => { setter(e.target.value); setCurrentPage(1); fetchHistory(); }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {(options as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Analysis List */}
        <div className="space-y-4">
          {!history?.analyses.length ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No analyses found</h3>
              <p className="text-gray-600 dark:text-gray-400">Upload some documents to see your analysis history here.</p>
            </div>
          ) : history.analyses.map(analysis => {
            const docType = analysis.document_type || analysis.doc_type || '';
            const fileName = analysis.file_name || analysis.doc_name || 'Unknown file';
            const hasData = !!(analysis.analysis_data || analysis.result);

            return (
              <div key={analysis.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <input type="checkbox"
                      checked={selectedAnalyses.includes(analysis.id)}
                      onChange={e => setSelectedAnalyses(prev =>
                        e.target.checked ? [...prev, analysis.id] : prev.filter(id => id !== analysis.id)
                      )}
                      className="mt-1 flex-shrink-0"
                    />
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">{fileName}</h3>
                        {getStatusIcon(analysis.status)}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />{getCompanyName(analysis)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />{formatDate(analysis.created_at)}
                        </div>
                        {analysis.file_size ? <span>{formatFileSize(analysis.file_size)}</span> : null}
                      </div>
                      {docType && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DOC_TYPE_COLORS[docType] ?? DOC_TYPE_COLORS.OTH}`}>
                          {docType}
                        </span>
                      )}
                      {analysis.error_message && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300">
                          {analysis.error_message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:flex-shrink-0 sm:ml-4">
                    {analysis.status === 'completed' && hasData && (
                      <Button size="sm" variant="outline"
                        onClick={() => setViewingAnalysis(analysis)}
                        className="text-xs sm:text-sm">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> View
                      </Button>
                    )}
                    <Button size="sm" variant="outline"
                      onClick={() => handleDownload(analysis)}
                      disabled={analysis.status !== 'completed' || !hasData}
                      className="text-xs sm:text-sm">
                      <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Download
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {history?.pagination && history.pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((history.pagination.page - 1) * history.pagination.limit) + 1}–
              {Math.min(history.pagination.page * history.pagination.limit, history.pagination.total)} of {history.pagination.total}
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={!history.pagination.hasPrev}>Previous</Button>
              <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(history.pagination.totalPages, p + 1))} disabled={!history.pagination.hasNext}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OCRAnalysisHistory;