'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  Building2,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { PDFGenerator } from '@/lib/utils/pdf-generator';

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
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: {
    total: number;
    completed: number;
    processing: number;
    failed: number;
    totalFileSize: number;
    documentTypes: Record<string, number>;
  };
}

interface OCRAnalysisHistoryProps {
  className?: string;
  onAnalysisSelect?: (analysis: AnalysisRecord) => void;
}

const OCRAnalysisHistory: React.FC<OCRAnalysisHistoryProps> = ({
  className = '',
  onAnalysisSelect
}) => {
  const [history, setHistory] = useState<AnalysisHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const { user, supabase } = useSupabase();

  const fetchHistory = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (documentTypeFilter) params.append('document_type', documentTypeFilter);

      const response = await fetch(`/api/ocr/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data);

    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, searchQuery, statusFilter, documentTypeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchHistory();
  }, [fetchHistory]);

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteSelected = async () => {
    if (selectedAnalyses.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/ocr/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          analysis_ids: selectedAnalyses
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete analyses');
      }

      setSelectedAnalyses([]);
      fetchHistory();

    } catch (err) {
      console.error('Error deleting analyses:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete analyses');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all analyses? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/ocr/history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          delete_all: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete all analyses');
      }

      setSelectedAnalyses([]);
      fetchHistory();

    } catch (err) {
      console.error('Error deleting all analyses:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete all analyses');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getDocumentTypeColor = (type: string | null) => {
    const colors: Record<string, string> = {
      'AR': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'SHL': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'IR': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'BRK': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'DIV': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'DRHP': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'OTH': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[type || 'OTH'] || colors['OTH'];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (analysis: AnalysisRecord) => {
    try {
      if (analysis.status !== 'completed') {
        alert('Analysis is not completed yet. Please wait for the analysis to finish.');
        return;
      }

      if (!analysis.analysis_data) {
        alert('No analysis data available for download.');
        return;
      }

      // Show loading state
      const button = document.querySelector(`[data-analysis-id="${analysis.id}"] .download-button`);
      if (button) {
        button.textContent = 'Generating PDF...';
        (button as HTMLButtonElement).disabled = true;
      }

      await PDFGenerator.downloadPDF(analysis);
      
      // Reset button state
      if (button) {
        button.textContent = 'Download';
        (button as HTMLButtonElement).disabled = false;
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
      
      // Reset button state
      const button = document.querySelector(`[data-analysis-id="${analysis.id}"] .download-button`);
      if (button) {
        button.textContent = 'Download';
        (button as HTMLButtonElement).disabled = false;
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompanyName = (analysis: AnalysisRecord): string => {
    const fromTop = analysis.company_name?.trim();
    const fromData = (analysis.analysis_data && (analysis.analysis_data['Company Name'] || analysis.analysis_data.company || analysis.analysis_data.company_name))?.toString().trim();
    const fromMeta = (analysis.metadata && (analysis.metadata.company_name || analysis.metadata.company))?.toString().trim();
    return fromTop || fromData || fromMeta || 'Unknown Company';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analysis history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading History
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchHistory}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Document Analysis History
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            View and manage your document analysis results
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
          </Button>
          
          {selectedAnalyses.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Delete Selected ({selectedAnalyses.length})</span>
              <span className="sm:hidden">Delete ({selectedAnalyses.length})</span>
            </Button>
          )}
          
          <Button
            variant="destructive"
            onClick={handleDeleteAll}
            disabled={!history || history.analyses.length === 0}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Delete All</span>
            <span className="sm:hidden">Delete All</span>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {history?.statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total Analyses</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {history.statistics.total}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {history.statistics.completed}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Processing</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {history.statistics.processing}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Total Size</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {formatFileSize(history.statistics.totalFileSize)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by file name or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Type
              </label>
              <select
                value={documentTypeFilter}
                onChange={(e) => setDocumentTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="AR">Annual Report</option>
                <option value="SHL">Shareholder Letter</option>
                <option value="IR">Investor Relations</option>
                <option value="BRK">Broker Note</option>
                <option value="DIV">Dividend Report</option>
                <option value="DRHP">IPO Prospectus</option>
                <option value="OTH">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="created_at">Date Created</option>
                <option value="file_name">File Name</option>
                <option value="company_name">Company Name</option>
                <option value="file_size">File Size</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Analysis List */}
      <div className="space-y-4">
        {history?.analyses.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No analyses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Upload some documents to see your analysis history here.
            </p>
          </div>
        ) : (
          history?.analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={selectedAnalyses.includes(analysis.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAnalyses(prev => [...prev, analysis.id]);
                      } else {
                        setSelectedAnalyses(prev => prev.filter(id => id !== analysis.id));
                      }
                    }}
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
                      <div className="flex items-center">
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{getCompanyName(analysis)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{formatDate(analysis.created_at)}</span>
                      </div>
                      
                      <div className="text-gray-500">
                        {formatFileSize(analysis.file_size)}
                      </div>
                    </div>
                    
                    {analysis.document_type && (
                      <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(analysis.document_type)}`}>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAnalysisSelect?.(analysis)}
                      className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">View</span>
                      <span className="sm:hidden">View</span>
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(analysis)}
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 download-button"
                    data-analysis-id={analysis.id}
                    disabled={analysis.status !== 'completed'}
                  >
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {history?.pagination && history.pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((history.pagination.page - 1) * history.pagination.limit) + 1} to{' '}
            {Math.min(history.pagination.page * history.pagination.limit, history.pagination.total)} of{' '}
            {history.pagination.total} results
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!history.pagination.hasPrev}
            >
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(history.pagination.totalPages, prev + 1))}
              disabled={!history.pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRAnalysisHistory;
