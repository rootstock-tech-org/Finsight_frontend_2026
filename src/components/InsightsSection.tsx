import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

interface InsightsSectionProps {
  insights: string[];
  loading: boolean;
  darkMode: boolean;
}

const InsightsSection: React.FC<InsightsSectionProps> = ({ insights, loading, darkMode }) => {
  const { t } = useTranslation();

  // Function to determine icon based on insight content
  const getInsightIcon = (insight: string) => {
    const lowerInsight = insight.toLowerCase();
    if (lowerInsight.includes('increase') || lowerInsight.includes('growth') || lowerInsight.includes('up')) {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    } else if (lowerInsight.includes('decrease') || lowerInsight.includes('decline') || lowerInsight.includes('down')) {
      return <TrendingDown className="w-5 h-5 text-red-500" />;
    } else if (lowerInsight.includes('risk') || lowerInsight.includes('warning') || lowerInsight.includes('caution')) {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    } else if (lowerInsight.includes('recommend') || lowerInsight.includes('opportunity')) {
      return <CheckCircle className="w-5 h-5 text-blue-500" />;
    } else {
      return <Lightbulb className="w-5 h-5 text-purple-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className={`w-10 h-10 animate-spin mb-4 ${darkMode ? 'text-teal-400' : 'text-teal-500'}`} />
          <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('analyzingDocument')}
          </h3>
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('aiProcessingMessage')}
          </p>
        </div>
      </div>
    );
  }

  if (!insights.length) {
    return null;
  }

  return (
    <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <div className={`p-2 rounded-lg mr-3 ${darkMode ? 'bg-teal-900' : 'bg-teal-100'}`}>
            <Lightbulb className={`w-5 h-5 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} />
          </div>
          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('keyInsights')}
          </h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg flex items-start ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-50 hover:bg-gray-100'
              } transition-colors`}
            >
              <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                {getInsightIcon(insight)}
              </div>
              <div>
                <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {insight}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* SEBI Disclaimer */}
        <div className="mt-4 p-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Disclaimer:</strong> FinSight is an educational assistant, not a SEBI-registered investment advisor. We never execute trades. Every suggestion should be evaluated against your risk profile.
          </p>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
          >
            {t('viewDetailedAnalysis')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsSection;
