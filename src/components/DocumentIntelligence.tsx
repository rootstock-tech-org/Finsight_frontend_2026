import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info,
  BarChart3,
  PieChart,
  Target,
  Shield,
  DollarSign,
  Clock,
  Users,
  Activity,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DocumentSection from './DocumentSection';

interface DocumentAnalysis {
  id: string;
  type: string;
  company: string;
  date: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  insights: DocumentInsight[];
  riskScore: number;
  recommendation: 'buy' | 'hold' | 'sell' | 'accumulate';
}

interface DocumentInsight {
  category: string;
  data: string;
  insight: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
}

interface MutualFund {
  id: string;
  name: string;
  category: string;
  humanScore: number;
  aiScore: number;
  nav: number;
  expenseRatio: number;
  returns: {
    '1Y': number;
    '3Y': number;
    '5Y': number;
  };
  manager: string;
  tenure: number;
  overlap: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const DocumentIntelligence: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'equity' | 'mf'>('equity');
  const [selectedDocument, setSelectedDocument] = useState<DocumentAnalysis | null>(null);
  const [showInsights, setShowInsights] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = (file: File | null, url?: string | null) => {
    // This will be handled by the DocumentSection component itself
    console.log('Upload initiated:', { file: file?.name, url });
  };

  // Mock data for demonstration
  const documents: DocumentAnalysis[] = [
    {
      id: '1',
      type: 'Annual Report',
      company: 'Reliance Industries',
      date: '2024-03-31',
      status: 'completed',
      riskScore: 25,
      recommendation: 'buy',
      insights: [
        {
          category: 'Financial Highlights',
          data: 'Revenue: ₹9.7L Cr (+12% YoY), EBITDA: ₹1.4L Cr (+18% YoY)',
          insight: 'Strong growth across all segments with improving margins',
          action: 'Consider accumulation on dips',
          priority: 'high'
        },
        {
          category: 'Strategic Moves',
          data: 'Jio 5G expansion, New Energy investments',
          insight: 'Forward-looking investments in high-growth areas',
          action: 'Long-term positive outlook',
          priority: 'high'
        },
        {
          category: 'Red Flags',
          data: 'High debt levels, Capex intensity',
          insight: 'Monitor cash flow and debt reduction plans',
          action: 'Watch for cash flow issues',
          priority: 'medium'
        }
      ]
    },
    {
      id: '2',
      type: 'Quarterly Results',
      company: 'TCS',
      date: '2024-06-30',
      status: 'completed',
      riskScore: 15,
      recommendation: 'hold',
      insights: [
        {
          category: 'Financial Highlights',
          data: 'Revenue: ₹59,381 Cr (+3.2% QoQ), PAT: ₹12,040 Cr (+8.8% QoQ)',
          insight: 'Steady growth with margin expansion',
          action: 'Maintain position, good for SIP',
          priority: 'medium'
        }
      ]
    }
  ];

  const mutualFunds: MutualFund[] = [
    {
      id: '1',
      name: 'HDFC FlexiCap Fund',
      category: 'FlexiCap',
      humanScore: 8.5,
      aiScore: 8.2,
      nav: 45.67,
      expenseRatio: 1.75,
      returns: { '1Y': 18.5, '3Y': 22.3, '5Y': 19.8 },
      manager: 'Prashant Jain',
      tenure: 84,
      overlap: 15,
      riskLevel: 'medium'
    },
    {
      id: '2',
      name: 'Axis ELSS Tax Saver Fund',
      category: 'ELSS',
      humanScore: 9.0,
      aiScore: 8.9,
      nav: 32.45,
      expenseRatio: 1.85,
      returns: { '1Y': 16.2, '3Y': 24.1, '5Y': 21.5 },
      manager: 'Shreyash Devalkar',
      tenure: 48,
      overlap: 8,
      riskLevel: 'medium'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'buy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'sell': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'accumulate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Finsight Document Intelligence & MF Review
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-powered analysis of equity documents and mutual fund insights
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white dark:bg-slate-800 rounded-lg p-1 mb-8 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('equity')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'equity'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Equity Document Intelligence
            </div>
          </button>
          <button
            onClick={() => setActiveTab('mf')}
            className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'mf'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <PieChart className="w-4 h-4" />
              Mutual Fund Review
            </div>
          </button>
        </div>

        {activeTab === 'equity' && (
          <div className="space-y-6">
            {/* Upload Section Toggle */}
            <div className="flex justify-center">
              <Button
                onClick={() => setShowUpload(!showUpload)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {showUpload ? 'Hide Upload' : 'Upload Documents for Analysis'}
              </Button>
            </div>

            {/* Upload Section */}
            {showUpload && (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">
                    Upload Documents for Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Upload PDF or image documents to get AI-powered financial analysis. Our system can analyze annual reports, quarterly results, investor letters, and more.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DocumentSection 
                    onSubmit={handleUpload}
                    darkMode={false}
                    isLoading={false}
                  />
                </CardContent>
              </Card>
            )}

            {/* Document Types Overview */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Document Types & Analysis Framework
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  AI-powered analysis of various equity documents with actionable insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { type: 'Annual Reports', icon: FileText, color: 'bg-blue-500' },
                    { type: 'Quarterly Results', icon: TrendingUp, color: 'bg-green-500' },
                    { type: 'Shareholder Letters', icon: Users, color: 'bg-purple-500' },
                    { type: 'Insider Trading', icon: Activity, color: 'bg-orange-500' },
                    { type: 'Audit Reports', icon: Shield, color: 'bg-red-500' },
                    { type: 'Corporate News', icon: Info, color: 'bg-indigo-500' }
                  ].map((docType, index) => (
                    <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <div className={`w-10 h-10 ${docType.color} rounded-lg flex items-center justify-center mb-3`}>
                        <docType.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-medium text-slate-900 dark:text-white mb-2">{docType.type}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        AI analysis with key insights and actionable recommendations
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Analysis Results */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Recent Document Analysis
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  Latest AI-powered insights from uploaded documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{doc.company}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{doc.type} • {doc.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRecommendationColor(doc.recommendation)}>
                            {doc.recommendation.toUpperCase()}
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-slate-400">Risk Score</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{doc.riskScore}/100</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {doc.insights.map((insight, index) => (
                          <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-slate-900 dark:text-white">{insight.category}</h4>
                              <Badge className={getPriorityColor(insight.priority)}>
                                {insight.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{insight.data}</p>
                            <div className="bg-white dark:bg-slate-800 rounded p-2 border-l-4 border-indigo-500">
                              <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">AI Insight:</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{insight.insight}</p>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm text-slate-600 dark:text-slate-400">{insight.action}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'mf' && (
          <div className="space-y-6">
            {/* MF Rating Framework */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Mutual Fund Rating Framework
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  AI-powered scoring system with expert validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left p-3 font-medium text-slate-900 dark:text-white">Category</th>
                        <th className="text-center p-3 font-medium text-slate-900 dark:text-white">Returns (%)</th>
                        <th className="text-center p-3 font-medium text-slate-900 dark:text-white">Expense Ratio (%)</th>
                        <th className="text-center p-3 font-medium text-slate-900 dark:text-white">Volatility (%)</th>
                        <th className="text-center p-3 font-medium text-slate-900 dark:text-white">Manager Tenure (%)</th>
                        <th className="text-center p-3 font-medium text-slate-900 dark:text-white">Drawdown (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { category: 'ELSS', returns: 40, expense: 15, volatility: 20, tenure: 10, drawdown: 10 },
                        { category: 'Large Cap', returns: 45, expense: 15, volatility: 15, tenure: 10, drawdown: 10 },
                        { category: 'Small Cap', returns: 50, expense: 10, volatility: 20, tenure: 5, drawdown: 10 },
                        { category: 'Debt', returns: 35, expense: 20, volatility: 15, tenure: 20, drawdown: 5 }
                      ].map((row, index) => (
                        <tr key={index} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="p-3 font-medium text-slate-900 dark:text-white">{row.category}</td>
                          <td className="p-3 text-center text-slate-700 dark:text-slate-300">{row.returns}</td>
                          <td className="p-3 text-center text-slate-700 dark:text-slate-300">{row.expense}</td>
                          <td className="p-3 text-center text-slate-700 dark:text-slate-300">{row.volatility}</td>
                          <td className="p-3 text-center text-slate-700 dark:text-slate-300">{row.tenure}</td>
                          <td className="p-3 text-center text-slate-700 dark:text-slate-300">{row.drawdown}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Fund Analysis Results */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 dark:text-white">
                  Fund Analysis & Scoring
                </CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  AI vs Human scoring with detailed insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mutualFunds.map((fund) => (
                    <div key={fund.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">{fund.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{fund.category} Fund</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRiskLevelColor(fund.riskLevel)}>
                            {fund.riskLevel.toUpperCase()} RISK
                          </Badge>
                          <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-slate-400">NAV</p>
                            <p className="font-semibold text-slate-900 dark:text-white">₹{fund.nav}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Expense Ratio</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{fund.expenseRatio}%</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">3Y Returns</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{fund.returns['3Y']}%</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Manager Tenure</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{fund.tenure} months</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Overlap</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{fund.overlap}%</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Human Score</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 text-yellow-500 fill-current" />
                              <span className="font-semibold text-slate-900 dark:text-white">{fund.humanScore}/10</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">AI Score</p>
                            <div className="flex items-center gap-1">
                              <Target className="w-5 h-5 text-indigo-500" />
                              <span className="font-semibold text-slate-900 dark:text-white">{fund.aiScore}/10</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="text-slate-600 dark:text-slate-400">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" className="text-slate-600 dark:text-slate-400">
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
  );
};

export default DocumentIntelligence;


