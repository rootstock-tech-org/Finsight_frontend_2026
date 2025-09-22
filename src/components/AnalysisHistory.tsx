import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  Image, 
  Link as LinkIcon, 
  Download, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { analysisService, AnalysisSession } from '@/lib/services/analysis-service';
import { PDFGenerator } from '@/lib/utils/pdf-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalysisHistoryProps {
  darkMode: boolean;
  onSelectSession?: (session: AnalysisSession) => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({ darkMode, onSelectSession }) => {
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'image' | 'pdf' | 'url'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortSessions();
  }, [sessions, searchQuery, filterBy, sortBy]);

  const loadHistory = async () => {
    try {
      const history = await analysisService.getAnalysisHistory();
      setSessions(history);
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSessions = () => {
    let filtered = sessions;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.result.document_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(session => session.result.document_type === filterBy);
    }

    // Sort sessions
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredSessions(filtered);
  };

  const handleExport = async (session: AnalysisSession) => {
    try {
      // Convert AnalysisSession to AnalysisData format
      const analysisData = {
        id: session.id,
        file_name: session.result.document_name,
        company_name: session.result.company_name || null,
        document_type: session.result.document_type,
        analysis_data: {
          'Key Insights': session.result.insights,
          'Event Snapshot': session.result.summary,
          'Finsight Insight': session.result.recommendations?.join('\n') || '',
          'Impact on Indian Markets': session.result.sectors_affected?.join(', ') || '',
          'Peer & Value Chain Read-through': session.result.summary,
          'Risks & Cautions': session.result.risk_factors?.join('\n') || ''
        },
        created_at: session.timestamp.toISOString(),
        completed_at: session.timestamp.toISOString()
      };
      
      await PDFGenerator.downloadPDF(analysisData);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      try {
        await analysisService.deleteAnalysisSession(sessionId);
        setSessions(sessions.filter(s => s.id !== sessionId));
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Delete failed. Please try again.');
      }
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'url':
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Analysis History</h2>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          View and manage your previous document analyses
        </p>
      </div>

      {/* Filters */}
      <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search analyses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                />
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as 'all' | 'image' | 'pdf' | 'url')}
                className={`px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="pdf">PDFs</option>
                <option value="url">URLs</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                className={`px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="p-8 text-center">
            <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              No analyses found
            </h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Upload your first document to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSessions.map((session) => (
            <Card 
              key={session.id}
              className={`transition-all hover:shadow-lg ${
                darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white hover:border-gray-300'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getDocumentIcon(session.result.document_type)}
                    <CardTitle className={`text-lg truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {session.title}
                    </CardTitle>
                  </div>
                  <Badge className={getSentimentColor(session.result.sentiment)}>
                    <span className="flex items-center gap-1">
                      {getSentimentIcon(session.result.sentiment)}
                      {session.result.sentiment}
                    </span>
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(session.timestamp).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className={`text-sm line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {session.result.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Confidence: {(session.result.confidence_score * 100).toFixed(0)}%
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      •
                    </span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {session.result.insights.length} insights
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectSession?.(session)}
                      className="p-2"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(session)}
                      className="p-2"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(session.id)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisHistory;
