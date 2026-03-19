'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Search, Filter, Download, Trash2, Eye,
  Calendar, Building2, BarChart3, AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PDFGenerator } from '@/lib/utils/pdf-generator';

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalysisRecord {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  company_name: string | null;
  document_type: string | null;
  status: 'processing' | 'completed' | 'failed';
  analysis_data: any;
  metadata: any;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
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
  onAnalysisSelect?: (analysis: AnalysisRecord) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_id');
}

function authHeader(): Record<string, string> {
  const uid = getUserId();
  return uid ? { Authorization: `Bearer ${uid}` } : {};
}

const DOC_TYPE_COLORS: Record<string, string> = {
  AR:   'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SHL:  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  IR:   'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  BRK:  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  DIV:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DRHP: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  OTH:  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

function formatFileSize(bytes: number) {
  if (!bytes) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(ds: string) {
  return new Date(ds).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getCompanyName(a: AnalysisRecord): string {
  return (
    a.company_name?.trim() ||
    a.analysis_data?.['Company Name']?.toString().trim() ||
    a.analysis_data?.company?.toString().trim() ||
    a.analysis_data?.company_name?.toString().trim() ||
    a.metadata?.company_name?.toString().trim() ||
    'Unknown Company'
  );
}

// ── Component ──────────────────────────────────────────────────────────────
const OCRAnalysisHistory: React.FC<OCRAnalysisHistoryProps> = ({
  className = '',
  onAnalysisSelect,
}) => {
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

  const fetchHistory = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setError('Not authenticated'); setLoading(false); return; }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(), limit: '10',
        sort_by: sortBy, sort_order: sortOrder,
      });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter) params.set('status', statusFilter);
      if (documentTypeFilter) params.set('document_type', documentTypeFilter);

      const res = await fetch(`/api/ocr/history?${params}`, {
        headers: authHeader(),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Failed to fetch history');
      }

      setHistory(await res.json());
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
    if (analysis.status !== 'completed' || !analysis.analysis_data) {
      alert('Analysis is not complete yet.');
      return;
    }
    try {
      await PDFGenerator.downloadPDF(analysis);
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

  // ── Loading ──────────────────────────────────────────────────────────────
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
            { icon: FileText,    color: 'blue',   label: 'Total Analyses', value: history.statistics.total },
            { icon: CheckCircle, color: 'green',  label: 'Completed',      value: history.statistics.completed },
            { icon: Clock,       color: 'blue',   label: 'Processing',     value: history.statistics.processing },
            { icon: BarChart3,   color: 'purple', label: 'Total Size',     value: formatFileSize(history.statistics.totalFileSize) },
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
                  ['DRHP', 'IPO Prospectus'], ['OTH', 'Other']] },
              { label: 'Sort By', value: sortBy, setter: setSortBy,
                options: [['created_at', 'Date Created'], ['file_name', 'File Name'],
                  ['company_name', 'Company Name'], ['file_size', 'File Size']] },
            ].map(({ label, value, setter, options }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
                <select value={value} onChange={e => { setter(e.target.value); setCurrentPage(1); fetchHistory(); }}
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
        ) : history.analyses.map(analysis => (
          <div key={analysis.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedAnalyses.includes(analysis.id)}
                  onChange={e => setSelectedAnalyses(prev =>
                    e.target.checked ? [...prev, analysis.id] : prev.filter(id => id !== analysis.id)
                  )}
                  className="mt-1"
                />
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate">
                      {analysis.file_name}
                    </h3>
                    {getStatusIcon(analysis.status)}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center"><Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />{getCompanyName(analysis)}</div>
                    <div className="flex items-center"><Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />{formatDate(analysis.created_at)}</div>
                    <span>{formatFileSize(analysis.file_size)}</span>
                  </div>
                  {analysis.document_type && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DOC_TYPE_COLORS[analysis.document_type] ?? DOC_TYPE_COLORS.OTH}`}>
                      {analysis.document_type}
                    </span>
                  )}
                  {analysis.error_message && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-xs sm:text-sm text-red-700 dark:text-red-300">
                      {analysis.error_message}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:flex-shrink-0">
                {analysis.status === 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => onAnalysisSelect?.(analysis)} className="text-xs sm:text-sm">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> View
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleDownload(analysis)}
                  disabled={analysis.status !== 'completed'} className="text-xs sm:text-sm">
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
          </div>
        ))}
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
  );
};

export default OCRAnalysisHistory;