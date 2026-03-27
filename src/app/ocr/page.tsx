'use client';

import React, { useState } from 'react';
import { FileText, History, Upload, BarChart3 } from 'lucide-react';
import OCRDocumentUpload from '@/components/OCRDocumentUpload';
import OCRAnalysisHistory from '@/components/OCRAnalysisHistory';

type TabType = 'overview' | 'upload' | 'history';

const OCRPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Helpers to normalize labels and control ordering/icons
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

  // Debug tab changes
  React.useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  const handleUploadComplete = (result: any) => {
    console.log('Upload completed:', result);
    console.log('Current activeTab before setActiveTab:', activeTab);
    // Force tab to stay on upload to ensure results show inline
    setActiveTab('upload');
    setIsUploading(false);
    console.log('Set activeTab to upload');
    // Results will show inline in OCRDocumentUpload component
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    setIsUploading(false);
    // You could show a toast notification here
  };

  const handleUploadStart = () => {
    console.log('Upload started');
    setIsUploading(true);
  };

  const handleAnalysisSelect = (analysis: any) => {
    setSelectedAnalysis(analysis);
    // You could open a modal or navigate to a detailed view
    console.log('Analysis selected:', analysis);
  };

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Overview',
      icon: BarChart3,
      description: 'Document analysis overview and statistics'
    },
    {
      id: 'upload' as TabType,
      label: 'Upload Documents',
      icon: Upload,
      description: 'Upload PDF or image documents for AI analysis'
    },
    {
      id: 'history' as TabType,
      label: 'Analysis History',
      icon: History,
      description: 'View and manage your document analysis results'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Document Analysis
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 line-clamp-2">
                  AI-powered financial document analysis using OCR technology
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6">
            <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      console.log('Tab clicked:', tab.id);
                      if (tab.id === 'overview') {
                        window.location.href = '/dashboard';
                      } else if (tab.id === 'history' && isUploading) {
                        console.log('History tab clicked during upload - ignoring');
                        return;
                      } else {
                        console.log('Setting active tab to:', tab.id);
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : tab.id === 'history' && isUploading
                        ? 'border-transparent text-gray-400 cursor-not-allowed opacity-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.id === 'overview' ? 'Overview' : 
                       tab.id === 'upload' ? 'Upload' : 
                       tab.id === 'history' ? 'History' : tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <div className="text-center py-8 sm:py-12">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Redirecting to Dashboard...
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                  Taking you back to your financial overview dashboard.
                </p>
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
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
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                onUploadStart={handleUploadStart}
              />
            </div>
          )}

          {activeTab === 'history' && (
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
              
              <OCRAnalysisHistory />
            </div>
          )}
        </div>

        {/* Analysis Details Modal (if analysis is selected) */}
        {selectedAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Analysis Details
                  </h3>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {selectedAnalysis.analysis_data && (
                  <div className="space-y-6">
                    {/* Summary card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h5 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Financial Analysis Summary</h5>
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedAnalysis.analysis_data.finsight_insight || selectedAnalysis.analysis_data.insight || 'No specific insights available for this document.'}
                      </div>
                    </div>

                    {/* Keyed insight cards (ordered) */}
                    <div className="space-y-4">
                      {(() => {
                        const data = selectedAnalysis.analysis_data || {};
                        const excluded = new Set(['company','document_type','ir_subtype','processing_time','cached','timestamp','document_id']);
                        const entries = Object.entries(data).filter(([k, v]) => v !== null && v !== undefined && v !== '' && !excluded.has(k));
                        const byKey: Record<string, any> = Object.fromEntries(entries);
                        const ordered = knownKeyOrder.filter((k) => k in byKey);
                        const remaining = entries.map(([k]) => k).filter((k) => !ordered.includes(k)).sort((a,b)=>prettifyLabel(a).localeCompare(prettifyLabel(b)));

                        const renderCard = (key: string) => (
                          <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <h6 className="font-semibold text-gray-900 dark:text-white mb-2">{getIconForKey(key)} {prettifyLabel(key)}</h6>
                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                              {typeof byKey[key] === 'string' ? byKey[key] : JSON.stringify(byKey[key], null, 2)}
                            </div>
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Powered by GinniAI Document Analysis API • 
              Supports PDF, JPEG, and PNG files up to 50MB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRPage;
